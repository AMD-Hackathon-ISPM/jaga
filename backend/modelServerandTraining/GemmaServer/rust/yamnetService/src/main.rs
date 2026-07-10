#![allow(non_snake_case)]

mod config;
mod model;

use std::sync::Arc;

use axum::{
    extract::{Multipart, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::Serialize;

use config::Config;
use model::YamnetModel;

#[derive(Clone)]
struct AppState {
    model: Arc<YamnetModel>,
    threshold: f32,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let _ = dotenvy::dotenv();
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let config = Config::fromEnv();
    tracing::info!("loading YAMNet from {}", config.modelPath);
    let model = Arc::new(YamnetModel::load(&config.modelPath, &config.classMapPath)?);

    let state = AppState { model, threshold: config.coughThreshold };

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/v1/cough/detect", post(detect))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(&config.addr).await?;
    tracing::info!("yamnet cough-detection API listening on {}", config.addr);
    axum::serve(listener, app).await?;
    Ok(())
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok", "service": "yamnet" }))
}

#[derive(Serialize)]
struct ClassScoreBody {
    label: String,
    score: f32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DetectResponse {
    cough_detected: bool,
    cough_score: f32,
    frames_analyzed: usize,
    top_classes: Vec<ClassScoreBody>,
}

async fn detect(State(state): State<AppState>, multipart: Multipart) -> Result<Response, ApiError> {
    let audio = readAudioField(multipart).await?;
    let samples = jagaAudio::decodeToMono16k(&audio)
        .map_err(|err| ApiError::badRequest(format!("could not decode audio: {err}")))?;

    let model = state.model.clone();
    let result = tokio::task::spawn_blocking(move || model.detect(&samples))
        .await
        .map_err(|err| ApiError::internal(format!("inference task failed: {err}")))?
        .map_err(|err| ApiError::internal(format!("inference failed: {err}")))?;

    let body = DetectResponse {
        cough_detected: result.coughScore >= state.threshold,
        cough_score: result.coughScore,
        frames_analyzed: result.framesAnalyzed,
        top_classes: result
            .topClasses
            .into_iter()
            .map(|item| ClassScoreBody { label: item.label, score: item.score })
            .collect(),
    };
    Ok((StatusCode::OK, Json(body)).into_response())
}

async fn readAudioField(mut multipart: Multipart) -> Result<Vec<u8>, ApiError> {
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|err| ApiError::badRequest(format!("invalid multipart body: {err}")))?
    {
        if field.name() == Some("audio") {
            let bytes = field
                .bytes()
                .await
                .map_err(|err| ApiError::badRequest(format!("could not read audio field: {err}")))?;
            if bytes.is_empty() {
                return Err(ApiError::badRequest("audio field is empty".into()));
            }
            return Ok(bytes.to_vec());
        }
    }
    Err(ApiError::badRequest("multipart form is missing the 'audio' file field".into()))
}

struct ApiError {
    status: StatusCode,
    message: String,
}

impl ApiError {
    fn badRequest(message: String) -> Self {
        ApiError { status: StatusCode::BAD_REQUEST, message }
    }
    fn internal(message: String) -> Self {
        ApiError { status: StatusCode::INTERNAL_SERVER_ERROR, message }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.status, Json(serde_json::json!({ "status": "error", "message": self.message })))
            .into_response()
    }
}
