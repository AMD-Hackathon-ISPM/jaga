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
    pub events: Vec<CoughEvent>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct CoughEvent {
    pub start_sec: f32,
    pub end_sec: f32,
    pub peak_score: f32,
}

fn group_cough_events(scores: &[f32], threshold: f32, hop_sec: f32, frame_sec: f32, audio_duration_sec: f32) -> Vec<CoughEvent> {
    let mut events = Vec::new();
    let mut run_start = None;
    let mut peak = 0.0f32;
    for (index, &score) in scores.iter().enumerate() {
        if score >= threshold {
            if run_start.is_none() { run_start = Some(index); peak = score; }
            peak = peak.max(score);
        } else if let Some(start) = run_start.take() {
            events.push(CoughEvent { start_sec: start as f32 * hop_sec, end_sec: (((index - 1) as f32 * hop_sec) + frame_sec).min(audio_duration_sec), peak_score: peak });
        }
    }
    if let Some(start) = run_start {
        let last = scores.len().saturating_sub(1);
        events.push(CoughEvent { start_sec: start as f32 * hop_sec, end_sec: (last as f32 * hop_sec + frame_sec).min(audio_duration_sec), peak_score: peak });
    }
    events
}

impl YamnetModel {
    pub fn load(modelPath: &str, classMapPath: &str) -> Result<Self> {
        let session = Session::builder()?
            .commit_from_file(modelPath)
            .with_context(|| format!("loading YAMNet model at {modelPath}"))?;
        let labels = loadLabels(classMapPath)?;
        Ok(Self { session: Mutex::new(session), labels })
    }

    pub fn detect(&self, waveform: &[f32], coughThreshold: f32) -> Result<CoughResult> {
        if waveform.is_empty() {
            return Err(anyhow!("empty waveform"));
        }

        let mut session = self.session.lock().map_err(|_| anyhow!("model lock poisoned"))?;
        let mut maxPerClass = vec![0f32; NUM_CLASSES];
        let mut frame = vec![0f32; FRAME_SAMPLES];
        let mut framesAnalyzed = 0usize;
        let mut coughScores = Vec::new();
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
            coughScores.push(scores.get(COUGH_CLASS_INDEX).copied().unwrap_or(0.0));

            framesAnalyzed += 1;
            if start + FRAME_SAMPLES >= waveform.len() {
                break;
            }
            start += HOP_SAMPLES;
        }
        drop(session);

        let coughScore = maxPerClass.get(COUGH_CLASS_INDEX).copied().unwrap_or(0.0);
        let audioDurationSec = waveform.len() as f32 / 16_000.0;
        let events = group_cough_events(&coughScores, coughThreshold, HOP_SAMPLES as f32 / 16_000.0, FRAME_SAMPLES as f32 / 16_000.0, audioDurationSec);

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

        Ok(CoughResult { coughScore, framesAnalyzed, topClasses, events })
    }

    fn labelFor(&self, index: usize) -> String {
        self.labels
            .get(index)
            .cloned()
            .unwrap_or_else(|| format!("class_{index}"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn threshold_boundary() {
        let events = group_cough_events(&[0.49, 0.5], 0.5, 0.5, 1.0, 2.0);
        assert_eq!(events, vec![CoughEvent { start_sec: 0.5, end_sec: 1.5, peak_score: 0.5 }]);
    }

    #[test]
    fn separates_two_episodes() {
        let events = group_cough_events(&[0.6, 0.7, 0.1, 0.8], 0.5, 0.5, 1.0, 3.0);
        assert_eq!(events.len(), 2);
        assert_eq!(events[0].peak_score, 0.7);
        assert_eq!(events[1].start_sec, 1.5);
    }

    #[test]
    fn trailing_episode_uses_last_frame() {
        let events = group_cough_events(&[0.1, 0.6, 0.7], 0.5, 0.5, 1.0, 3.0);
        assert_eq!(events[0].end_sec, 2.0);
    }

    #[test]
    fn clamps_padded_tail_to_audio_duration() {
        let events = group_cough_events(&[0.1, 0.6], 0.5, 0.5, 1.0, 0.8);
        assert_eq!(events[0].end_sec, 0.8);
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
