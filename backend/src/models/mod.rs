use serde::{ Deserialize, Serialize };

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Transaction {
    pub id: i64,
    pub tx_type: String,
    pub address: String,
    pub eth_amount: String,
    pub nil_amount: String,
    pub steth_amount: String,
    pub tx_hash: String,
    pub block_number: i64,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PositionResponse {
    pub address: String,
    pub collateral: String,
    pub debt: String,
    pub deposited_eth: String,
    pub steth_value: String,
    pub yield_earned: String,
    pub collateral_usd: String,
    pub debt_usd: String,
    pub ratio: String,
    pub health: String,
    pub eth_price: String,
    pub current_apy: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct StatsRow {
    pub total_eth_locked: String,
    pub total_nil_minted: String,
    pub total_users: i64,
    pub total_steth_held: String,
    pub last_block: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatsResponse {
    pub total_eth_locked: String,
    pub total_nil_minted: String,
    pub total_users: i64,
    pub total_steth_held: String,
    pub current_apy: String,
    pub eth_price: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiError {
    pub error: String,
}
