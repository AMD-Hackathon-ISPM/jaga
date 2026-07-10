use anyhow::{anyhow, Context, Result};
use reqwest::Client;

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

    pub async fn embed(&self, wavBytes: Vec<u8>) -> Result<Vec<f32>> {
        if !self.isConfigured() {
            return Err(anyhow!(
                "Fireworks is not configured; set FIREWORKS_EMBEDDING_URL and FIREWORKS_API_KEY"
            ));
        }

        let part = reqwest::multipart::Part::bytes(wavBytes)
            .file_name("audio.wav")
            .mime_str("audio/wav")?;
        let form = reqwest::multipart::Form::new()
            .text("model", self.model.clone())
            .part("file", part);

        let response = self
            .client
            .post(&self.url)
            .bearer_auth(&self.apiKey)
            .multipart(form)
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
}

fn parseEmbedding(text: &str) -> Result<Vec<f32>> {
    let value: serde_json::Value =
        serde_json::from_str(text).context("parsing Fireworks JSON response")?;

    if let Some(array) = value.get("embedding").and_then(|v| v.as_array()) {
        return Ok(collectFloats(array));
    }
    if let Some(array) = value
        .get("data")
        .and_then(|data| data.get(0))
        .and_then(|entry| entry.get("embedding"))
        .and_then(|v| v.as_array())
    {
        return Ok(collectFloats(array));
    }

    Err(anyhow!("unexpected Fireworks response shape: {text}"))
}

fn collectFloats(array: &[serde_json::Value]) -> Vec<f32> {
    array.iter().filter_map(|v| v.as_f64().map(|f| f as f32)).collect()
}
