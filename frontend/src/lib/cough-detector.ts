// ponytail: energy heuristic, swap for model endpoint when available

/**
 * Client-side cough detector — a pure, testable energy heuristic.
 *
 * The recorder samples the AnalyserNode's time-domain RMS on a steady cadence
 * and pushes each frame here. Detection is deliberately simple and swappable:
 *
 * - Adaptive baseline: an exponential moving average of the quiet-floor RMS.
 *   The baseline only tracks quiet frames so a loud cough never inflates it.
 * - Trigger: RMS above `max(baseline × multiplier, absoluteFloor)` sustained
 *   for at least `sustainMs`.
 * - Refractory: after an event, further events are suppressed for
 *   `refractoryMs`.
 * - Rising edge: a new event may only begin after the signal has returned to
 *   quiet, so one continuous loud run — however long — registers exactly once.
 *
 * SAFETY: this is an illustrative prototype signal, not a clinical measurement.
 */

export interface CoughDetectorOptions {
  /** Nominal spacing between RMS frames in ms (informational; timing uses atMs). */
  sampleIntervalMs?: number;
  /** EMA smoothing factor for the adaptive quiet-floor baseline (0..1). */
  emaAlpha?: number;
  /** Trigger threshold = max(baseline × multiplier, absoluteFloor). */
  thresholdMultiplier?: number;
  /** Hard lower bound on the trigger threshold, independent of the baseline. */
  absoluteFloor?: number;
  /** Minimum time RMS must stay above threshold to count as an event (ms). */
  sustainMs?: number;
  /** Minimum gap between consecutive events (ms). */
  refractoryMs?: number;
}

export interface CoughDetector {
  /**
   * Push one RMS sample taken at `atMs` (ms since recording start).
   * Returns `true` exactly when a new cough event registers on this frame.
   */
  push(rms: number, atMs: number): boolean;
}

const DEFAULTS: Required<CoughDetectorOptions> = {
  sampleIntervalMs: 40,
  emaAlpha: 0.05,
  thresholdMultiplier: 4,
  absoluteFloor: 0.05,
  sustainMs: 30,
  refractoryMs: 300,
};

export function createCoughDetector(options: CoughDetectorOptions = {}): CoughDetector {
  const opts = { ...DEFAULTS, ...options };

  let baseline: number | null = null;
  let candidateStartMs: number | null = null;
  let lastEventMs: number | null = null;
  // A candidate may only open on a rising edge from quiet. `armed` is set by a
  // quiet frame and consumed by an event, so a continuous loud run cannot
  // re-fire once its refractory window lapses mid-run.
  let armed = false;

  return {
    push(rms: number, atMs: number): boolean {
      if (baseline === null) baseline = rms;
      const threshold = Math.max(baseline * opts.thresholdMultiplier, opts.absoluteFloor);

      if (rms <= threshold) {
        // Quiet frame: track the floor, drop any pending candidate, re-arm.
        baseline = opts.emaAlpha * rms + (1 - opts.emaAlpha) * baseline;
        candidateStartMs = null;
        armed = true;
        return false;
      }

      // Loud frame that is a continuation of an already-registered run: the
      // signal has not returned to quiet since the last event, so ignore it.
      if (!armed) return false;

      // Begin (or continue) a candidate event.
      if (candidateStartMs === null) candidateStartMs = atMs;

      // Suppress anything still inside the refractory window of the last event.
      if (lastEventMs !== null && atMs - lastEventMs < opts.refractoryMs) {
        return false;
      }

      if (atMs - candidateStartMs >= opts.sustainMs) {
        lastEventMs = atMs;
        candidateStartMs = null;
        armed = false;
        return true;
      }

      return false;
    },
  };
}
