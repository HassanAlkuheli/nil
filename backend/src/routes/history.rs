use axum::{ extract::{ Path, State }, http::StatusCode, Json };
use sqlx::SqlitePool;

use crate::db;
use crate::models::Transaction;

pub async fn get_history(
    Path(address): Path<String>,
    State(pool): State<SqlitePool>
) -> Result<Json<Vec<Transaction>>, StatusCode> {
    // Validate address format
    if !address.starts_with("0x") || address.len() != 42 {
        return Err(StatusCode::BAD_REQUEST);
    }

    match db::get_transactions_by_address(&pool, &address).await {
        Ok(transactions) => Ok(Json(transactions)),
        Err(e) => {
            tracing::error!("Failed to get history for {}: {}", address, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
