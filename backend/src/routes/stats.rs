use axum::{ extract::{ Path, State }, http::StatusCode, Json };
use alloy::primitives::{ Address, utils::format_ether };
use alloy::providers::ProviderBuilder;
use alloy::sol;
use sqlx::SqlitePool;

use crate::db;
use crate::models::{ PositionResponse, StatsResponse };

// NilVault ABI — only the functions we need
sol! {
    #[sol(rpc)]
    interface NilVault {
        function getPosition(address user) external view returns (uint256, uint256, uint256);
        function getStETHValue(address user) external view returns (uint256);
        function getStats() external view returns (uint256, uint256, uint256, uint256);
    }
}

async fn fetch_eth_price() -> Result<f64, reqwest::Error> {
    let url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

    let resp: serde_json::Value = reqwest::get(url).await?.json().await?;

    Ok(resp["ethereum"]["usd"].as_f64().unwrap_or(0.0))
}

pub async fn get_stats(State(pool): State<SqlitePool>) -> Result<Json<StatsResponse>, StatusCode> {
    let stats = db::get_stats(&pool).await.map_err(|e| {
        tracing::error!("Failed to get stats: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let eth_price = fetch_eth_price().await.unwrap_or(0.0);

    Ok(
        Json(StatsResponse {
            total_eth_locked: stats.total_eth_locked,
            total_nil_minted: stats.total_nil_minted,
            total_users: stats.total_users,
            total_steth_held: stats.total_steth_held,
            current_apy: "4.0".to_string(),
            eth_price: format!("{:.2}", eth_price),
        })
    )
}

pub async fn get_position(
    Path(address): Path<String>,
    State(pool): State<SqlitePool>
) -> Result<Json<PositionResponse>, StatusCode> {
    // Validate address format
    if !address.starts_with("0x") || address.len() != 42 {
        return Err(StatusCode::BAD_REQUEST);
    }

    let _ = pool; // pool available for future use

    let alchemy_url = std::env::var("ALCHEMY_URL").map_err(|_| {
        tracing::error!("ALCHEMY_URL not set");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let vault_address = std::env::var("VAULT_ADDRESS").map_err(|_| {
        tracing::error!("VAULT_ADDRESS not set");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let url: reqwest::Url = alchemy_url.parse().map_err(|e| {
        tracing::error!("Failed to parse ALCHEMY_URL: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let provider = ProviderBuilder::new().connect_http(url);

    let vault_addr: Address = vault_address.parse().map_err(|e| {
        tracing::error!("Failed to parse vault address: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let contract = NilVault::new(vault_addr, provider);

    let user_addr: Address = address.parse().map_err(|e| {
        tracing::error!("Failed to parse user address: {}", e);
        StatusCode::BAD_REQUEST
    })?;

    let NilVault::getPositionReturn { _0: collateral, _1: debt, _2: deposited_eth } = contract
        .getPosition(user_addr)
        .call().await
        .map_err(|e| {
            tracing::error!("Failed to call getPosition: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let steth_value = contract
        .getStETHValue(user_addr)
        .call().await
        .map_err(|e| {
            tracing::error!("Failed to call getStETHValue: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let eth_price = fetch_eth_price().await.unwrap_or(0.0);

    let collateral_eth: f64 = format_ether(collateral).parse().unwrap_or(0.0);
    let debt_nil: f64 = format_ether(debt).parse().unwrap_or(0.0);
    let deposited_eth_f: f64 = format_ether(deposited_eth).parse().unwrap_or(0.0);
    let steth_value_f: f64 = format_ether(steth_value).parse().unwrap_or(0.0);
    let yield_earned = if steth_value_f > collateral_eth { steth_value_f - collateral_eth } else { 0.0 };
    let collateral_usd = collateral_eth * eth_price;
    let debt_usd = debt_nil; // 1 NIL = $1

    let ratio = if debt_nil > 0.0 { (collateral_usd / debt_usd) * 100.0 } else { 0.0 };

    let health = if ratio > 150.0 {
        "safe"
    } else if ratio > 120.0 {
        "warning"
    } else if debt_nil > 0.0 {
        "danger"
    } else {
        "safe"
    };

    Ok(
        Json(PositionResponse {
            address: address.to_lowercase(),
            collateral: format!("{:.6}", collateral_eth),
            debt: format!("{:.6}", debt_nil),
            deposited_eth: format!("{:.6}", deposited_eth_f),
            steth_value: format!("{:.6}", steth_value_f),
            yield_earned: format!("{:.6}", yield_earned),
            collateral_usd: format!("{:.2}", collateral_usd),
            debt_usd: format!("{:.2}", debt_usd),
            ratio: format!("{:.1}", ratio),
            health: health.to_string(),
            eth_price: format!("{:.2}", eth_price),
            current_apy: "4.0".to_string(),
        })
    )
}
