use anyhow::{anyhow, Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DemographicsInput {
    pub age_years: i64,
    pub sex_at_birth: String,
    pub height_cm: f64,
    pub weight_kg: f64,
}

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DemographicsData {
    pub age_years: i64,
    pub sex_at_birth: String,
    pub height_cm: f64,
    pub weight_kg: f64,
}

#[derive(Deserialize)]
struct ValidatedResponse {
    demographics: DemographicsData,
}

pub async fn validate(
    client: &Client,
    goBackendUrl: &str,
    input: &DemographicsInput,
) -> Result<DemographicsData> {
    let url = format!("{}/api/v1/demographics", goBackendUrl.trim_end_matches('/'));
    let response = client
        .post(&url)
        .json(input)
        .send()
        .await
        .context("calling Go demographics API")?;

    let status = response.status();
    let text = response.text().await.context("reading demographics response")?;
    if !status.is_success() {
        return Err(anyhow!("demographics validation failed ({status}): {text}"));
    }

    let parsed: ValidatedResponse =
        serde_json::from_str(&text).context("parsing demographics response")?;
    Ok(parsed.demographics)
}
