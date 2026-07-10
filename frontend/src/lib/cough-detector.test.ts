import { describe, expect, it } from "vitest";
import { createCoughDetector } from "./cough-detector";

/**
 * Feeds a run of constant-RMS frames into the detector and returns how many
 * new cough events registered. Frames are spaced `stepMs` apart starting at
 * `startMs` (inclusive) up to but not including `endMs`.
 */
function feed(
  detector: { push: (rms: number, atMs: number) => boolean },
  rms: number,
  startMs: number,
  endMs: number,
  stepMs = 30,
) {
  let events = 0;
  for (let t = startMs; t < endMs; t += stepMs) {
    if (detector.push(rms, t)) events += 1;
  }
  return events;
}

const SILENCE = 0.01;
const BURST = 0.5;

describe("createCoughDetector", () => {
  it("registers exactly one event for a single sustained burst", () => {
    const detector = createCoughDetector();
    let events = 0;
    events += feed(detector, SILENCE, 0, 1000); // quiet lead-in
    events += feed(detector, BURST, 1000, 1060); // ~60ms burst (≥30ms sustain)
    events += feed(detector, SILENCE, 1100, 1400); // quiet tail
    expect(events).toBe(1);
  });

  it("does not fire on brief spikes shorter than the sustain window", () => {
    const detector = createCoughDetector();
    let events = 0;
    events += feed(detector, SILENCE, 0, 1000);
    // A single loud frame (no sustain) then immediate silence.
    if (detector.push(BURST, 1000)) events += 1;
    events += feed(detector, SILENCE, 1030, 1300);
    expect(events).toBe(0);
  });

  it("suppresses a second burst inside the 300ms refractory window", () => {
    const detector = createCoughDetector();
    let events = 0;
    events += feed(detector, SILENCE, 0, 1000);
    events += feed(detector, BURST, 1000, 1060); // event registers ~1030
    events += feed(detector, SILENCE, 1100, 1150); // brief gap, still < 300ms
    events += feed(detector, BURST, 1150, 1220); // second burst inside refractory
    expect(events).toBe(1);
  });

  it("registers exactly one event for a continuous loud run longer than the refractory window", () => {
    const detector = createCoughDetector();
    let events = 0;
    events += feed(detector, SILENCE, 0, 1000);
    // One uninterrupted 600ms loud run (> 300ms refractory). The signal never
    // returns to quiet, so this is ONE cough — it must not re-fire once the
    // refractory window lapses mid-run.
    events += feed(detector, BURST, 1000, 1600);
    events += feed(detector, SILENCE, 1600, 1900);
    expect(events).toBe(1);
  });

  it("registers a second event once the refractory window has elapsed", () => {
    const detector = createCoughDetector();
    let events = 0;
    events += feed(detector, SILENCE, 0, 1000);
    events += feed(detector, BURST, 1000, 1060); // first event ~1030
    events += feed(detector, SILENCE, 1100, 1400); // quiet past the refractory
    events += feed(detector, BURST, 1400, 1460); // second event ~1430
    expect(events).toBe(2);
  });
});
