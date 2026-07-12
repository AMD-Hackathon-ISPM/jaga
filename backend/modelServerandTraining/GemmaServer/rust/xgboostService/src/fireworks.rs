//! Client for the Fireworks AI WavLM audio-embedding deployment.
//!
//! Calls the OpenAI-style embeddings endpoint
//! `POST https://api.fireworks.ai/inference/v1/embeddings` with a JSON body
//! `{ "model": <deployment>, "input": <base64 WAV> }` and reads the embedding
//! from the standard `{ "data": [ { "embedding": [...] } ] }` response.
//!
//! WavLM is an audio model, so the WAV bytes are base64-encoded into `input`.
//! If your deployment expects a different encoding (raw text, data URI, etc.),
//! adjust `buildBody` — the request/response plumbing stays the same.

use anyhow::{anyhow, Context, Result};
use base64::Engine;
use reqwest::Client;
use serde_json::json;

#[derive(Clone)]
pub struct FireworksClient {
    client: Client,
    url: String,
    apiKey: String,
    model: String,
}

impl FireworksClient {
    pub fn new(url: String, apiKey: String, model: String) -> Self {
        FireworksClient { client: Client::new(), url, apiKey, model }
    }

    pub fn isConfigured(&self) -> bool {
        !self.url.is_empty() && !self.apiKey.is_empty()
    }

    /// Sends a WAV recording to the WavLM deployment and returns its embedding.
    pub async fn embed(&self, wavBytes: Vec<u8>) -> Result<Vec<f32>> {
        if !self.isConfigured() {
            return Err(anyhow!(
                "Fireworks is not configured; set FIREWORKS_EMBEDDING_URL and FIREWORKS_API_KEY"
            ));
        }

        let body = self.buildBody(&wavBytes);
        let response = self
            .client
            .post(&self.url)
            .bearer_auth(&self.apiKey)
            .header("Accept", "application/json")
            .json(&body)
            .send()
            .await
            .context("calling Fireworks embedding API")?;

        let status = response.status();
        let text = response.text().await.context("reading Fireworks response")?;
        if !status.is_success() {
            return Err(anyhow!("Fireworks returned {status}: {text}"));
        }

        parseEmbedding(&text)
    }

    fn buildBody(&self, wavBytes: &[u8]) -> serde_json::Value {
        let encoded = base64::engine::general_purpose::STANDARD.encode(wavBytes);
        json!({
            "model": self.model,
            "input": encoded,
        })
    }
}

fn parseEmbedding(text: &str) -> Result<Vec<f32>> {
    let value: serde_json::Value =
        serde_json::from_str(text).context("parsing Fireworks JSON response")?;

    if let Some(array) = value
        .get("data")
        .and_then(|data| data.get(0))
        .and_then(|entry| entry.get("embedding"))
        .and_then(|v| v.as_array())
    {
        return Ok(collectFloats(array));
    }
    if let Some(array) = value.get("embedding").and_then(|v| v.as_array()) {
        return Ok(collectFloats(array));
    }

    Err(anyhow!("unexpected Fireworks response shape: {text}"))
}

fn collectFloats(array: &[serde_json::Value]) -> Vec<f32> {
    array.iter().filter_map(|v| v.as_f64().map(|f| f as f32)).collect()
}
