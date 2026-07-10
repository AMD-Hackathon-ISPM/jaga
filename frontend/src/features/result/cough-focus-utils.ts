export function downsamplePeaks(samples: Float32Array | number[], bars: number): number[] {
  const n = Math.max(1, Math.floor(bars));
  const out = new Array<number>(n).fill(0);
  const len = samples.length;
  if (len === 0) return out;

  const block = len / n;
  let max = 0;
  for (let i = 0; i < n; i++) {
    const start = Math.floor(i * block);
    const end = Math.min(len, Math.floor((i + 1) * block));
    let peak = 0;
    for (let j = start; j < end; j++) {
      const v = Math.abs(samples[j]);
      if (v > peak) peak = v;
    }
    out[i] = peak;
    if (peak > max) max = peak;
  }
  if (max > 0) {
    for (let i = 0; i < n; i++) out[i] /= max;
  }
  return out;
}

export function eventToX(atMs: number, durationMs: number, width: number): number {
  if (durationMs <= 0 || width <= 0) return 0;
  const x = (atMs / durationMs) * width;
  return Math.max(0, Math.min(width, x));
}

export function localRmsAtEvents(
  samples: Float32Array | number[],
  sampleRate: number,
  events: number[],
  windowMs = 150,
  floor = 0.4,
): number[] {
  if (events.length === 0) return [];
  if (sampleRate <= 0 || samples.length === 0) return events.map(() => 1);

  const half = Math.max(1, Math.floor((windowMs / 1000) * sampleRate));
  const raw = events.map((atMs) => {
    const center = Math.floor((atMs / 1000) * sampleRate);
    const start = Math.max(0, center - half);
    const end = Math.min(samples.length, center + half);
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      const v = samples[j];
      sum += v * v;
      count += 1;
    }
    return count > 0 ? Math.sqrt(sum / count) : 0;
  });

  const max = raw.reduce((m, r) => (r > m ? r : m), 0);
  if (max <= 0) return events.map(() => 1);
  return raw.map((r) => floor + (1 - floor) * (r / max));
}

export function computeGlowField(
  width: number,
  events: number[],
  durationMs: number,
  intensities: number[],
  sigmaMs: number,
): Float32Array {
  const cols = Math.max(1, Math.floor(width));
  const field = new Float32Array(cols);
  if (durationMs <= 0 || width <= 0 || events.length === 0) return field;

  const sigmaPx = (sigmaMs / durationMs) * width;
  if (sigmaPx <= 0) return field;
  const span = Math.ceil(sigmaPx * 3);
  const twoSigmaSq = 2 * sigmaPx * sigmaPx;

  events.forEach((atMs, i) => {
    const cx = (atMs / durationMs) * width;
    const intensity = intensities[i] ?? 1;
    const from = Math.max(0, Math.floor(cx - span));
    const to = Math.min(cols - 1, Math.ceil(cx + span));
    for (let x = from; x <= to; x++) {
      const dx = x - cx;
      field[x] += intensity * Math.exp(-(dx * dx) / twoSigmaSq);
    }
  });

  for (let x = 0; x < cols; x++) {
    if (field[x] > 1) field[x] = 1;
  }
  return field;
}

export interface LabelPlacement {
  fraction: number;
  show: boolean;
}

export function computeLabelLayout(
  events: number[],
  durationMs: number,
  width: number,
  minGapPx: number,
): LabelPlacement[] {
  let lastX = Number.NEGATIVE_INFINITY;
  return events.map((atMs) => {
    const x = eventToX(atMs, durationMs, width);
    const show = x - lastX >= minGapPx;
    if (show) lastX = x;
    const fraction = durationMs > 0 ? Math.max(0, Math.min(1, atMs / durationMs)) : 0;
    return { fraction, show };
  });
}
