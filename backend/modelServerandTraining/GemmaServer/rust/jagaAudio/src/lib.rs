#![allow(non_snake_case)]

use std::io::Cursor;

use anyhow::{anyhow, Result};

pub struct AudioBuffer {
    pub samples: Vec<f32>,
    pub sampleRate: u32,
}

pub fn decodeWav(bytes: &[u8]) -> Result<AudioBuffer> {
    let reader = hound::WavReader::new(Cursor::new(bytes))
        .map_err(|err| anyhow!("failed to read WAV: {err}"))?;
    let spec = reader.spec();
    let channels = spec.channels.max(1) as usize;

    let interleaved: Vec<f32> = match spec.sample_format {
        hound::SampleFormat::Float => reader
            .into_samples::<f32>()
            .collect::<Result<Vec<_>, _>>()
            .map_err(|err| anyhow!("failed to decode float samples: {err}"))?,
        hound::SampleFormat::Int => {
            let fullScale = (1i64 << (spec.bits_per_sample - 1)) as f32;
            reader
                .into_samples::<i32>()
                .map(|sample| sample.map(|value| value as f32 / fullScale))
                .collect::<Result<Vec<_>, _>>()
                .map_err(|err| anyhow!("failed to decode int samples: {err}"))?
        }
    };

    let samples = downmixToMono(interleaved, channels);
    Ok(AudioBuffer { samples, sampleRate: spec.sample_rate })
}

fn downmixToMono(interleaved: Vec<f32>, channels: usize) -> Vec<f32> {
    if channels <= 1 {
        return interleaved;
    }
    interleaved
        .chunks(channels)
        .map(|frame| frame.iter().sum::<f32>() / channels as f32)
        .collect()
}

pub fn resampleLinear(input: &[f32], from: u32, to: u32) -> Vec<f32> {
    if from == to || input.is_empty() {
        return input.to_vec();
    }
    let ratio = to as f64 / from as f64;
    let outLen = ((input.len() as f64) * ratio).round() as usize;
    let lastIndex = input.len() - 1;

    let mut out = Vec::with_capacity(outLen);
    for i in 0..outLen {
        let source = i as f64 / ratio;
        let index = source.floor() as usize;
        let frac = (source - index as f64) as f32;
        let current = input[index.min(lastIndex)];
        let next = input[(index + 1).min(lastIndex)];
        out.push(current + (next - current) * frac);
    }
    out
}

pub fn decodeToMono16k(bytes: &[u8]) -> Result<Vec<f32>> {
    let buffer = decodeWav(bytes)?;
    Ok(resampleLinear(&buffer.samples, buffer.sampleRate, 16_000))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn encodeWav16(samples: &[f32], sampleRate: u32) -> Vec<u8> {
        let spec = hound::WavSpec {
            channels: 1,
            sample_rate: sampleRate,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };
        let mut buffer = Cursor::new(Vec::new());
        {
            let mut writer = hound::WavWriter::new(&mut buffer, spec).unwrap();
            for &sample in samples {
                let scaled = (sample * i16::MAX as f32).round() as i16;
                writer.write_sample(scaled).unwrap();
            }
            writer.finalize().unwrap();
        }
        buffer.into_inner()
    }

    #[test]
    fn decodesRoundTrip() {
        let samples: Vec<f32> = (0..1000)
            .map(|i| (i as f32 * 0.05).sin() * 0.5)
            .collect();
        let wav = encodeWav16(&samples, 16_000);
        let decoded = decodeWav(&wav).unwrap();
        assert_eq!(decoded.sampleRate, 16_000);
        assert_eq!(decoded.samples.len(), samples.len());
        for (got, want) in decoded.samples.iter().zip(&samples) {
            assert!((got - want).abs() < 1e-3, "got {got} want {want}");
        }
    }

    #[test]
    fn resamplesToTargetLength() {
        let input: Vec<f32> = (0..8000).map(|i| (i as f32 * 0.01).sin()).collect();
        let out = resampleLinear(&input, 8_000, 16_000);
        assert_eq!(out.len(), 16_000);
    }
}
