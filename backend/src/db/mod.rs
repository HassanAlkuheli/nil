use anyhow::Result;
use sqlx::sqlite::{ SqliteConnectOptions, SqlitePoolOptions };
use sqlx::SqlitePool;
use std::str::FromStr;

use crate::models::{ StatsRow, Transaction };

pub async fn init_db(database_url: &str) -> Result<SqlitePool> {
    let options = SqliteConnectOptions::from_str(database_url)?.create_if_missing(true);

    let pool = SqlitePoolOptions::new().max_connections(5).connect_with(options).await?;

    // Run migrations
    let migrations = [
        include_str!("migrations/001_init.sql"),
        include_str!("migrations/002_add_steth.sql"),
    ];

    for migration_sql in &migrations {
        for statement in migration_sql.split(';') {
            let trimmed = statement.trim();
            if !trimmed.is_empty() {
                // ALTER TABLE may fail if column already exists — ignore that error
                if let Err(e) = sqlx::query(trimmed).execute(&pool).await {
                    let msg = e.to_string();
                    if msg.contains("duplicate column") || msg.contains("already exists") {
                        continue;
                    }
                    return Err(e.into());
                }
            }
        }
    }

    tracing::info!("Database initialized successfully");
    Ok(pool)
}

pub async fn save_transaction(
    pool: &SqlitePool,
    tx_type: &str,
    address: &str,
    eth_amount: &str,
    nil_amount: &str,
    steth_amount: &str,
    tx_hash: &str,
    block_number: i64
) -> Result<()> {
    let now = chrono::Utc::now().timestamp();

    sqlx
        ::query(
            "INSERT OR IGNORE INTO transactions (tx_type, address, eth_amount, nil_amount, steth_amount, tx_hash, block_number, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(tx_type)
        .bind(address.to_lowercase())
        .bind(eth_amount)
        .bind(nil_amount)
        .bind(steth_amount)
        .bind(tx_hash)
        .bind(block_number)
        .bind(now)
        .execute(pool).await?;

    Ok(())
}

pub async fn get_transactions_by_address(
    pool: &SqlitePool,
    address: &str
) -> Result<Vec<Transaction>> {
    let transactions = sqlx
        ::query_as::<_, Transaction>(
            "SELECT id, tx_type, address, eth_amount, nil_amount, steth_amount, tx_hash, block_number, created_at
         FROM transactions
         WHERE address = ?
         ORDER BY created_at DESC"
        )
        .bind(address.to_lowercase())
        .fetch_all(pool).await?;

    Ok(transactions)
}

pub async fn get_stats(pool: &SqlitePool) -> Result<StatsRow> {
    let stats = sqlx
        ::query_as::<_, StatsRow>(
            "SELECT total_eth_locked, total_nil_minted, total_users, total_steth_held, last_block, updated_at
         FROM stats WHERE id = 1"
        )
        .fetch_one(pool).await?;

    Ok(stats)
}

pub async fn update_stats(
    pool: &SqlitePool,
    total_eth: &str,
    total_nil: &str,
    total_users: i64,
    total_steth: &str,
    last_block: i64
) -> Result<()> {
    let now = chrono::Utc::now().timestamp();

    sqlx
        ::query(
            "UPDATE stats SET total_eth_locked = ?, total_nil_minted = ?, total_users = ?, total_steth_held = ?, last_block = ?, updated_at = ? WHERE id = 1"
        )
        .bind(total_eth)
        .bind(total_nil)
        .bind(total_users)
        .bind(total_steth)
        .bind(last_block)
        .bind(now)
        .execute(pool).await?;

    Ok(())
}

pub async fn get_last_block(pool: &SqlitePool) -> Result<i64> {
    let row: (i64,) = sqlx
        ::query_as("SELECT last_block FROM stats WHERE id = 1")
        .fetch_one(pool).await?;

    Ok(row.0)
}
