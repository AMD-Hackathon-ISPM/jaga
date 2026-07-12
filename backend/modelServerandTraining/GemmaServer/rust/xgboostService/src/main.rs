#![allow(non_snake_case)]

mod config;
mod demographics;
mod fireworks;
mod model;
mod preprocessor;
mod wavlm;

use std::sync::Arc;
use std::time::Duration;

use axum::{
    extract::{Multipart, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use reqwest::Client;
use serde::{Deserialize, Serialize};

use config::Config;
use demographics::{DemographicsData, DemographicsInput};
use fireworks::FireworksClient;
use model::{XgbModel, EMBEDDING_LEN, FEATURE_LEN};
use preprocessor::demographicFeatures;
use wavlm::WavLmModel;

#[derive(Clone)]
struct AppState {
    model: Arc<XgbModel>,
    wavlm: Option<Arc<WavLmModel>>,
    localTimeout: Duration,
    httpClient: Client,
    fireworks: FireworksClient,
    goBackendUrl: String,
    defaultCountry: String,
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
    tracing::info!("loading XGBoost model from {}", config.xgbModelPath);
    let model = Arc::new(XgbModel::load(&config.xgbModelPath)?);

    // Local WavLM is the primary embedder; loading it is optional (falls back to
    // Fireworks if the model is missing).
    let wavlm = match WavLmModel::load(&config.wavlmModelPath) {
        Ok(model) => {
            tracing::info!("loaded local WavLM from {}", config.wavlmModelPath);
            Some(Arc::new(model))
        }
        Err(err) => {
            tracing::warn!(
                "local WavLM unavailable ({err}); will use Fireworks only for embeddings"
            );
            None
        }
    };

    let fireworks = FireworksClient::new(
        config.fireworksUrl.clone(),
        config.fireworksApiKey.clone(),
        config.fireworksModel.clone(),
    );
    if wavlm.is_none() && !fireworks.isConfigured() {
        tracing::warn!("neither local WavLM nor Fireworks is available; /predict will error");
    }

    let state = AppState {
        model,
        wavlm,
        localTimeout: Duration::from_secs(config.localEmbedTimeoutSecs),
        httpClient: Client::new(),
        fireworks,
        goBackendUrl: config.goBackendUrl.clone(),
        defaultCountry: config.defaultCountry.clone(),
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/v1/tb/predict", post(predict))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(&config.addr).await?;
    tracing::info!("xgboost TB-probability API listening on {}", config.addr);
    axum::serve(listener, app).await?;
    Ok(())
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok", "service": "xgboost" }))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DemographicsRequest {
    age_years: i64,
    sex_at_birth: String,
    height_cm: f64,
    weight_kg: f64,
    #[serde(default)]
    country: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PredictResponse {
    tb_probability: f32,
    risk_band: String,
    embedding_source: String,
    demographics: DemographicsData,
}

async fn predict(State(state): State<AppState>, multipart: Multipart) -> Result<Response, ApiError> {
    let (audio, demographicsJson) = readParts(multipart).await?;

    let request: DemographicsRequest = serde_json::from_str(&demographicsJson)
        .map_err(|err| ApiError::badRequest(format!("invalid demographics JSON: {err}")))?;

    let validated = demographics::validate(
        &state.httpClient,
        &state.goBackendUrl,
        &DemographicsInput {
            age_years: request.age_years,
            sex_at_birth: request.sex_at_birth.clone(),
            height_cm: request.height_cm,
            weight_kg: request.weight_kg,
        },
    )
    .await
    .map_err(|err| ApiError::badRequest(err.to_string()))?;

    let (embedding, embeddingSource) = embedAudio(&state, audio).await?;

    let country = request.country.unwrap_or_else(|| state.defaultCountry.clone());
    let demoFeatures = demographicFeatures(
        validated.age_years as f32,
        validated.height_cm as f32,
        validated.weight_kg as f32,
        &validated.sex_at_birth,
        &country,
    );

    let mut features = Vec::with_capacity(FEATURE_LEN);
    features.extend_from_slice(&embedding);
    features.extend_from_slice(&demoFeatures);

    let model = state.model.clone();
    let probability = tokio::task::spawn_blocking(move || model.predict(&features))
        .await
        .map_err(|err| ApiError::internal(format!("inference task failed: {err}")))?
        .map_err(|err| ApiError::internal(format!("inference failed: {err}")))?;

    let body = PredictResponse {
        tb_probability: probability,
        risk_band: riskBand(probability).to_string(),
        embedding_source: embeddingSource.to_string(),
        demographics: validated,
    };
    Ok((StatusCode::OK, Json(body)).into_response())
}

/// Embeds the audio locally with WavLM first, bounded by the configured timeout,
/// and falls back to the Fireworks API if the local model is missing, errors, or
/// runs past the timeout. Returns the embedding and which source produced it.
async fn embedAudio(state: &AppState, audio: Vec<u8>) -> Result<(Vec<f32>, &'static str), ApiError> {
    if let Some(model) = &state.wavlm {
        match jagaAudio::decodeToMono16k(&audio) {
            Ok(samples) => {
                let model = model.clone();
                let task = tokio::task::spawn_blocking(move || model.embed(&samples));
                match tokio::time::timeout(state.localTimeout, task).await {
                    Ok(Ok(Ok(embedding))) if embedding.len() == EMBEDDING_LEN => {
                        return Ok((embedding, "local-wavlm-int8"));
                    }
                    Ok(Ok(Ok(embedding))) => tracing::warn!(
                        "local WavLM returned {} dims, falling back to Fireworks",
                        embedding.len()
                    ),
                    Ok(Ok(Err(err))) => {
                        tracing::warn!("local WavLM failed ({err}), falling back to Fireworks")
                    }
                    Ok(Err(err)) => {
                        tracing::warn!("local WavLM task panicked ({err}), falling back to Fireworks")
                    }
                    Err(_) => tracing::warn!(
                        "local WavLM exceeded {:?}, falling back to Fireworks",
                        state.localTimeout
                    ),
                }
            }
            Err(err) => tracing::warn!("could not decode audio for local WavLM ({err}); trying Fireworks"),
        }
    }

    let embedding = state
        .fireworks
        .embed(audio)
        .await
        .map_err(|err| ApiError::badGateway(err.to_string()))?;
    if embedding.len() != EMBEDDING_LEN {
        return Err(ApiError::badGateway(format!(
            "expected a {EMBEDDING_LEN}-dim embedding from Fireworks, got {}",
            embedding.len()
        )));
    }
    Ok((embedding, "fireworks"))
}

fn riskBand(probability: f32) -> &'static str {
    if probability < 0.33 {
        "lower"
    } else if probability < 0.66 {
        "intermediate"
    } else {
        "higher"
    }
}

/// Reads the `audio` file part and the `demographics` text part from a multipart form.
async fn readParts(mut multipart: Multipart) -> Result<(Vec<u8>, String), ApiError> {
    let mut audio: Option<Vec<u8>> = None;
    let mut demographicsJson: Option<String> = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|err| ApiError::badRequest(format!("invalid multipart body: {err}")))?
    {
        match field.name() {
            Some("audio") => {
                let bytes = field
                    .bytes()
                    .await
                    .map_err(|err| ApiError::badRequest(format!("could not read audio field: {err}")))?;
                audio = Some(bytes.to_vec());
            }
            Some("demographics") => {
                let text = field
                    .text()
                    .await
                    .map_err(|err| ApiError::badRequest(format!("could not read demographics field: {err}")))?;
                demographicsJson = Some(text);
            }
            _ => {}
        }
    }

    let audio = audio.ok_or_else(|| ApiError::badRequest("missing 'audio' file field".into()))?;
    if audio.is_empty() {
        return Err(ApiError::badRequest("audio field is empty".into()));
    }
    let demographicsJson =
        demographicsJson.ok_or_else(|| ApiError::badRequest("missing 'demographics' field".into()))?;
    Ok((audio, demographicsJson))
}

struct ApiError {
    status: StatusCode,
    message: String,
}

impl ApiError {
    fn badRequest(message: String) -> Self {
        ApiError { status: StatusCode::BAD_REQUEST, message }
    }
    fn badGateway(message: String) -> Self {
        ApiError { status: StatusCode::BAD_GATEWAY, message }
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
