use alloy::primitives::{ Address, utils::format_ether };
use alloy::providers::{ Provider, ProviderBuilder, WsConnect };
use alloy::rpc::types::{ Filter, Log };
use alloy::sol;
use alloy::sol_types::SolEvent;
use sqlx::SqlitePool;

use crate::db;

// NilVault ABI — events and view functions
sol! {
    #[sol(rpc)]
    interface NilVaultListener {
        event Deposited(address indexed user, uint256 ethAmount, uint256 stEthReceived, uint256 nilAmount);
        event Redeemed(address indexed user, uint256 nilAmount, uint256 stEthReturned);
        function getStats() external view returns (uint256, uint256, uint256, uint256);
    }
}

pub async fn start_listener(pool: SqlitePool) {
    loop {
        match run_listener(pool.clone()).await {
            Ok(_) => {
                tracing::warn!("Listener disconnected, reconnecting in 5s...");
            }
            Err(e) => {
                tracing::error!("Listener error: {}, reconnecting in 5s...", e);
            }
        }
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
    }
}

async fn run_listener(pool: SqlitePool) -> anyhow::Result<()> {
    let alchemy_url = std::env::var("ALCHEMY_URL")?;
    let vault_address_str = std::env::var("VAULT_ADDRESS")?;

    // Convert HTTPS to WSS for WebSocket connection
    let ws_url = alchemy_url.replace("https://", "wss://").replace("http://", "ws://");

    tracing::info!("Connecting to WebSocket: {}...", &ws_url[..ws_url.len().min(50)]);

    let ws = WsConnect::new(&ws_url);
    let provider = ProviderBuilder::new().connect_ws(ws).await?;

    let vault_addr: Address = vault_address_str.parse()?;

    // Get last processed block
    let last_block = db::get_last_block(&pool).await.unwrap_or(0);
    let current_block = provider.get_block_number().await? as i64;

    tracing::info!("Replaying events from block {} to {}", last_block, current_block);

    // Replay missed events (skip replay if too far behind — free tier limits range to 10 blocks)
    if last_block < current_block {
        let replay_from = if current_block - last_block > 9 {
            tracing::warn!(
                "Too many blocks to replay ({}), starting from recent blocks",
                current_block - last_block
            );
            current_block - 9
        } else {
            last_block
        };
        replay_events(&pool, &provider, vault_addr, replay_from, current_block).await?;
        update_stats_from_contract(&pool, &provider, vault_addr, current_block).await?;
    }

    tracing::info!("Listening for new events...");

    let mut last_processed = current_block;

    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

        let latest_block = provider.get_block_number().await.map_err(|e| {
            tracing::error!("Failed to get block number: {}", e);
            anyhow::anyhow!("Failed to get block number: {}", e)
        })? as i64;

        if latest_block > last_processed {
            let from = (last_processed + 1) as u64;
            let to = latest_block as u64;

            // Batch in chunks of 9 (Alchemy free tier: max 10 blocks inclusive)
            let mut chunk_from = from;
            while chunk_from <= to {
                let chunk_to = (chunk_from + 9).min(to);
                process_events(&pool, &provider, vault_addr, chunk_from, chunk_to, false).await?;
                chunk_from = chunk_to + 1;
            }

            update_stats_from_contract(&pool, &provider, vault_addr, latest_block).await?;

            last_processed = latest_block;
        }
    }
}

async fn process_events<P: Provider>(
    pool: &SqlitePool,
    provider: &P,
    vault_addr: Address,
    from: u64,
    to: u64,
    replay: bool
) -> anyhow::Result<()> {
    // Query deposit events
    let deposit_filter = Filter::new()
        .address(vault_addr)
        .event_signature(NilVaultListener::Deposited::SIGNATURE_HASH)
        .from_block(from)
        .to_block(to);

    let deposit_logs: Vec<Log> = provider.get_logs(&deposit_filter).await?;

    for log in &deposit_logs {
        let event = NilVaultListener::Deposited::decode_log(&log.inner)?;
        let eth_amount = format_ether(event.ethAmount);
        let steth_amount = format_ether(event.stEthReceived);
        let nil_amount = format_ether(event.nilAmount);
        let tx_hash = format!("{}", log.transaction_hash.unwrap_or_default());
        let block_num = log.block_number.unwrap_or_default() as i64;

        db::save_transaction(
            pool,
            "deposit",
            &format!("{}", event.user),
            &eth_amount,
            &nil_amount,
            &steth_amount,
            &tx_hash,
            block_num
        ).await?;

        let prefix = if replay { "Replayed deposit" } else { "Deposit" };
        tracing::info!(
            "{}: {} locked {} ETH, received {} stETH / {} NIL",
            prefix,
            event.user,
            eth_amount,
            steth_amount,
            nil_amount
        );
    }

    // Query redeem events
    let redeem_filter = Filter::new()
        .address(vault_addr)
        .event_signature(NilVaultListener::Redeemed::SIGNATURE_HASH)
        .from_block(from)
        .to_block(to);

    let redeem_logs: Vec<Log> = provider.get_logs(&redeem_filter).await?;

    for log in &redeem_logs {
        let event = NilVaultListener::Redeemed::decode_log(&log.inner)?;
        let nil_amount = format_ether(event.nilAmount);
        let steth_amount = format_ether(event.stEthReturned);
        let tx_hash = format!("{}", log.transaction_hash.unwrap_or_default());
        let block_num = log.block_number.unwrap_or_default() as i64;

        db::save_transaction(
            pool,
            "redeem",
            &format!("{}", event.user),
            "0",
            &nil_amount,
            &steth_amount,
            &tx_hash,
            block_num
        ).await?;

        let prefix = if replay { "Replayed redeem" } else { "Redeem" };
        tracing::info!(
            "{}: {} burned {} NIL, received {} stETH",
            prefix,
            event.user,
            nil_amount,
            steth_amount
        );
    }

    Ok(())
}

async fn replay_events<P: Provider>(
    pool: &SqlitePool,
    provider: &P,
    vault_addr: Address,
    last_block: i64,
    current_block: i64
) -> anyhow::Result<()> {
    let from = last_block as u64;
    let to = current_block as u64;
    let mut chunk_from = from;
    while chunk_from <= to {
        let chunk_to = (chunk_from + 9).min(to);
        process_events(pool, provider, vault_addr, chunk_from, chunk_to, true).await?;
        chunk_from = chunk_to + 1;
    }
    Ok(())
}

async fn update_stats_from_contract<P: Provider>(
    pool: &SqlitePool,
    provider: &P,
    vault_addr: Address,
    block_number: i64
) -> anyhow::Result<()> {
    let contract = NilVaultListener::new(vault_addr, provider);
    let result = contract.getStats().call().await?;

    let total_eth_str = format_ether(result._0);
    let total_nil_str = format_ether(result._1);
    let total_users = result._2;
    let total_steth_str = format_ether(result._3);

    db::update_stats(
        pool,
        &total_eth_str,
        &total_nil_str,
        total_users.try_into().unwrap_or(0),
        &total_steth_str,
        block_number
    ).await?;

    Ok(())
}
