//! Local WavLM Large (int8 ONNX) audio embedder — the sole embedding source.
//! Audio is embedded entirely on-device; there is no external fallback.
//!
//! Reproduces the exact recipe the training embeddings were built with (verified
//! to match the reference parquet at cosine 1.0 in fp32): normalize the 16 kHz
//! mono waveform to zero mean / unit variance, run WavLM, and mean-pool the final
//! hidden state over time into a 1024-dim vector.

use std::sync::Mutex;

use anyhow::{anyhow, Context, Result};
use ort::{inputs, session::Session, value::TensorRef};

use crate::model::EMBEDDING_LEN;

pub struct WavLmModel {
    session: Mutex<Session>,
}

impl WavLmModel {
    pub fn load(path: &str) -> Result<Self> {
        let session = Session::builder()?
            .commit_from_file(path)
            .with_context(|| format!("loading WavLM model at {path}"))?;
        Ok(Self { session: Mutex::new(session) })
    }

    /// Embeds a 16 kHz mono waveform into a 1024-dim vector.
    pub fn embed(&self, samples: &[f32]) -> Result<Vec<f32>> {
        if samples.is_empty() {
            return Err(anyhow!("empty waveform"));
        }

        let normalized = normalize(samples);
        let seq = normalized.len();
        let input = TensorRef::from_array_view((vec![1i64, seq as i64], normalized.as_slice()))?;

        let mut session = self.session.lock().map_err(|_| anyhow!("model lock poisoned"))?;
        let outputs = session.run(inputs!["input_values" => input])?;
        let (dims, hidden) = outputs["last_hidden_state"].try_extract_tensor::<f32>()?;

        // hidden: [1, frames, width]
        let frames = *dims.get(1).unwrap_or(&0) as usize;
        let width = *dims.get(2).unwrap_or(&0) as usize;
        if width != EMBEDDING_LEN {
            return Err(anyhow!("expected {EMBEDDING_LEN}-dim hidden state, got {width}"));
        }
        if frames == 0 {
            return Err(anyhow!("model produced no frames"));
        }

        // Mean-pool over the frame axis.
        let mut pooled = vec![0f32; width];
        for frame in 0..frames {
            let base = frame * width;
            for w in 0..width {
                pooled[w] += hidden[base + w];
            }
        }
        let scale = 1.0 / frames as f32;
        for value in &mut pooled {
            *value *= scale;
        }
        Ok(pooled)
    }
}

/// Zero-mean, unit-variance normalization (the training feature extractor).
fn normalize(samples: &[f32]) -> Vec<f32> {
    let count = samples.len() as f32;
    let mean = samples.iter().copied().sum::<f32>() / count;
    let variance = samples.iter().map(|s| (s - mean) * (s - mean)).sum::<f32>() / count;
    let std = variance.sqrt().max(1e-7);
    samples.iter().map(|s| (s - mean) / std).collect()
}
