mod db;
mod listener;
mod models;
mod routes;

use axum::{ routing::get, Router };
use tower_http::cors::{ Any, CorsLayer };

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load .env
    dotenvy::dotenv().ok();

    // Init tracing
    tracing_subscriber::fmt().with_target(false).compact().init();

    // Init database
    let database_url = std::env
        ::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:nil.db".to_string());
    let pool = db::init_db(&database_url).await?;

    // Spawn blockchain event listener
    let listener_pool = pool.clone();
    tokio::spawn(async move {
        listener::events::start_listener(listener_pool).await;
    });

    // CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([axum::http::Method::GET])
        .allow_headers([axum::http::header::CONTENT_TYPE]);

    // Build router
    let app = Router::new()
        .route("/api/position/{address}", get(routes::stats::get_position))
        .route("/api/history/{address}", get(routes::history::get_history))
        .route("/api/stats", get(routes::stats::get_stats))
        .route(
            "/health",
            get(|| async { "OK" })
        )
        .layer(cors)
        .with_state(pool);

    // Start server
    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{}", port);

    tracing::info!("∅ Nil backend running on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
