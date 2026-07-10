use std::sync::Mutex;

use anyhow::{anyhow, Context, Result};
use ort::{inputs, session::Session, value::TensorRef};

pub const EMBEDDING_LEN: usize = 1024;
pub const FEATURE_LEN: usize = 1036;

pub struct XgbModel {
    session: Mutex<Session>,
}

impl XgbModel {
    pub fn load(path: &str) -> Result<Self> {
        let session = Session::builder()?
            .commit_from_file(path)
            .with_context(|| format!("loading XGBoost model at {path}"))?;
        Ok(Self { session: Mutex::new(session) })
    }

    pub fn predict(&self, features: &[f32]) -> Result<f32> {
        if features.len() != FEATURE_LEN {
            return Err(anyhow!("expected {FEATURE_LEN} features, got {}", features.len()));
        }

        let input = TensorRef::from_array_view((vec![1i64, FEATURE_LEN as i64], features))?;
        let mut session = self.session.lock().map_err(|_| anyhow!("model lock poisoned"))?;
        let outputs = session.run(inputs!["input" => input])?;
        let (dims, probabilities) = outputs["probabilities"].try_extract_tensor::<f32>()?;

        let columns = *dims.last().unwrap_or(&2) as usize;
        let positive = probabilities
            .get(columns.saturating_sub(1))
            .copied()
            .ok_or_else(|| anyhow!("model produced no probability output"))?;
        Ok(positive)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::preprocessor::demographicFeatures;

    #[test]
    fn matchesPythonReferenceProbability() {
        let modelPath = concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../models/xgboostAndDemoPreprocessor/tb_xgb_demo.onnx"
        );
        let model = XgbModel::load(modelPath).expect("load model");

        let mut features = vec![0.01f32; EMBEDDING_LEN];
        features.extend_from_slice(&demographicFeatures(34.0, 170.5, 65.2, "male", "PH"));
        assert_eq!(features.len(), FEATURE_LEN);

        let probability = model.predict(&features).expect("predict");
        assert!(
            (probability - 0.494487).abs() < 1e-3,
            "got {probability}, expected ~0.494487"
        );
    }
}
