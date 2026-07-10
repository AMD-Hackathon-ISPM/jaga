import { describe, expect, it } from "vitest";
import {
  computeGlowField,
  computeLabelLayout,
  downsamplePeaks,
  eventToX,
  localRmsAtEvents,
} from "./cough-focus-utils";

describe("downsamplePeaks", () => {
  it("returns the requested number of bars normalised to [0,1]", () => {
    const samples = new Float32Array([0, 0.5, -1, 0.25, 0, -0.75]);
    const peaks = downsamplePeaks(samples, 3);
    expect(peaks).toHaveLength(3);
    for (const p of peaks) expect(p).toBeGreaterThanOrEqual(0);
    expect(Math.max(...peaks)).toBeCloseTo(1);
  });

  it("returns all-zero bars for empty input", () => {
    expect(downsamplePeaks(new Float32Array([]), 4)).toEqual([0, 0, 0, 0]);
  });

  it("never divides by zero for pure silence", () => {
    const peaks = downsamplePeaks(new Float32Array([0, 0, 0, 0]), 2);
    expect(peaks).toEqual([0, 0]);
  });

  it("clamps bar count to at least 1", () => {
    expect(downsamplePeaks(new Float32Array([1]), 0)).toHaveLength(1);
  });
});

describe("eventToX", () => {
  it("maps a midpoint event to the middle of the width", () => {
    expect(eventToX(500, 1000, 200)).toBe(100);
  });

  it("clamps out-of-range offsets", () => {
    expect(eventToX(-50, 1000, 200)).toBe(0);
    expect(eventToX(5000, 1000, 200)).toBe(200);
  });

  it("returns 0 for a non-positive duration", () => {
    expect(eventToX(500, 0, 200)).toBe(0);
  });
});

describe("localRmsAtEvents", () => {
  it("gives the loudest cough intensity 1 and quieter coughs a floored value", () => {
    const sampleRate = 1000;
    const samples = new Float32Array(2000);
    for (let i = 450; i < 550; i++) samples[i] = 1;
    for (let i = 1450; i < 1550; i++) samples[i] = 0.2;
    const [loud, quiet] = localRmsAtEvents(samples, sampleRate, [500, 1500]);
    expect(loud).toBeCloseTo(1, 5);
    expect(quiet).toBeGreaterThan(0.4);
    expect(quiet).toBeLessThan(loud);
  });

  it("returns an empty array when there are no events", () => {
    expect(localRmsAtEvents(new Float32Array([1, 1]), 1000, [])).toEqual([]);
  });

  it("falls back to uniform intensity for silence", () => {
    expect(localRmsAtEvents(new Float32Array(1000), 1000, [500])).toEqual([1]);
  });
});

describe("computeGlowField", () => {
  it("peaks at the cough position and decays toward the edges", () => {
    const field = computeGlowField(200, [1000], 2000, [1], 200);
    expect(field[100]).toBeCloseTo(1, 1);
    expect(field[100]).toBeGreaterThan(field[0]);
    expect(field[100]).toBeGreaterThan(field[199]);
    expect(field[0]).toBeLessThan(0.2);
  });

  it("clamps overlapping bursts to at most 1", () => {
    const field = computeGlowField(100, [500, 520, 540], 1000, [1, 1, 1], 300);
    for (const v of field) expect(v).toBeLessThanOrEqual(1);
    expect(Math.max(...field)).toBeCloseTo(1, 5);
  });

  it("returns a zero field when there are no events", () => {
    const field = computeGlowField(50, [], 1000, [], 200);
    expect(field).toHaveLength(50);
    expect(Math.max(...field)).toBe(0);
  });

  it("returns a zero field for a non-positive duration", () => {
    const field = computeGlowField(50, [500], 0, [1], 200);
    expect(Math.max(...field)).toBe(0);
  });
});

describe("computeLabelLayout", () => {
  it("keeps all labels when they are well spaced", () => {
    const layout = computeLabelLayout([0, 500, 1000], 1000, 300, 40);
    expect(layout.map((l) => l.show)).toEqual([true, true, true]);
    expect(layout[1].fraction).toBeCloseTo(0.5);
  });

  it("drops later labels that collide with an earlier one", () => {
    const layout = computeLabelLayout([500, 510, 900], 1000, 300, 40);
    expect(layout.map((l) => l.show)).toEqual([true, false, true]);
  });

  it("returns fractions clamped to [0,1]", () => {
    const layout = computeLabelLayout([2000], 1000, 300, 40);
    expect(layout[0].fraction).toBe(1);
  });
});
