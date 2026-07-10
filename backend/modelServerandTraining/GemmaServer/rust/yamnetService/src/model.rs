use std::sync::Mutex;
use anyhow::{anyhow, Context, Result};
use ort::{inputs, session::Session, value::TensorRef};

pub const COUGH_CLASS_INDEX: usize = 42;
const FRAME_SAMPLES: usize = 15_600;
const HOP_SAMPLES: usize = 7_800;
const NUM_CLASSES: usize = 521;

pub struct YamnetModel {
    session: Mutex<Session>,
    labels: Vec<String>,
}

pub struct ClassScore {
    pub label: String,
    pub score: f32,
}

pub struct CoughResult {
    pub coughScore: f32,
    pub framesAnalyzed: usize,
    pub topClasses: Vec<ClassScore>,
}

impl YamnetModel {
    pub fn load(modelPath: &str, classMapPath: &str) -> Result<Self> {
        let session = Session::builder()?
            .commit_from_file(modelPath)
            .with_context(|| format!("loading YAMNet model at {modelPath}"))?;
        let labels = loadLabels(classMapPath)?;
        Ok(Self { session: Mutex::new(session), labels })
    }

    pub fn detect(&self, waveform: &[f32]) -> Result<CoughResult> {
        if waveform.is_empty() {
            return Err(anyhow!("empty waveform"));
        }

        let mut session = self.session.lock().map_err(|_| anyhow!("model lock poisoned"))?;
        let mut maxPerClass = vec![0f32; NUM_CLASSES];
        let mut frame = vec![0f32; FRAME_SAMPLES];
        let mut framesAnalyzed = 0usize;
        let mut start = 0usize;

        loop {
            let end = (start + FRAME_SAMPLES).min(waveform.len());
            for slot in frame.iter_mut() {
                *slot = 0.0;
            }
            frame[..end - start].copy_from_slice(&waveform[start..end]);

            let input = TensorRef::from_array_view((vec![FRAME_SAMPLES as i64], frame.as_slice()))?;
            let outputs = session.run(inputs!["waveform" => input])?;
            let (_dims, scores) = outputs["scores"].try_extract_tensor::<f32>()?;
            for class in 0..NUM_CLASSES {
                if scores[class] > maxPerClass[class] {
                    maxPerClass[class] = scores[class];
                }
            }

            framesAnalyzed += 1;
            if start + FRAME_SAMPLES >= waveform.len() {
                break;
            }
            start += HOP_SAMPLES;
        }
        drop(session);

        let coughScore = maxPerClass.get(COUGH_CLASS_INDEX).copied().unwrap_or(0.0);

        let mut ranked: Vec<(usize, f32)> = maxPerClass.iter().copied().enumerate().collect();
        ranked.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        let topClasses = ranked
            .into_iter()
            .take(5)
            .map(|(index, score)| ClassScore {
                label: self.labelFor(index),
                score,
            })
            .collect();

        Ok(CoughResult { coughScore, framesAnalyzed, topClasses })
    }

    fn labelFor(&self, index: usize) -> String {
        self.labels
            .get(index)
            .cloned()
            .unwrap_or_else(|| format!("class_{index}"))
    }
}

fn loadLabels(path: &str) -> Result<Vec<String>> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("reading class map at {path}"))?;

    let mut labels = Vec::new();
    for line in content.lines().skip(1) {
        if line.trim().is_empty() {
            continue;
        }
        labels.push(parseDisplayName(line));
    }
    Ok(labels)
}

fn parseDisplayName(line: &str) -> String {
    let afterFirst = match line.find(',') {
        Some(pos) => &line[pos + 1..],
        None => return line.trim().to_string(),
    };
    let name = match afterFirst.find(',') {
        Some(pos) => &afterFirst[pos + 1..],
        None => afterFirst,
    };
    name.trim().trim_matches('"').to_string()
}
