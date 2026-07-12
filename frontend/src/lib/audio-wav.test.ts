import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convertToWavFile, encodeWav, WAV_SAMPLE_RATE } from "./audio-wav";

/** Minimal AudioBuffer stand-in: mono float samples at a sample rate. */
function fakeAudioBuffer(samples: Float32Array, sampleRate: number) {
  return {
    sampleRate,
    duration: samples.length / sampleRate,
    getChannelData: () => samples,
  } as unknown as AudioBuffer;
}

describe("encodeWav", () => {
  it("produces a valid 16-bit PCM mono RIFF header and clamped samples", async () => {
    const blob = encodeWav(fakeAudioBuffer(new Float32Array([0, 1, -1, 2, -2]), WAV_SAMPLE_RATE));
    expect(blob.type).toBe("audio/wav");

    const view = new DataView(await blob.arrayBuffer());
    const ascii = (offset: number, length: number) =>
      String.fromCharCode(...new Uint8Array(view.buffer, offset, length));

    expect(ascii(0, 4)).toBe("RIFF");
    expect(ascii(8, 4)).toBe("WAVE");
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(WAV_SAMPLE_RATE);
    expect(view.getUint16(34, true)).toBe(16); // bits per sample
    expect(view.getUint32(40, true)).toBe(5 * 2); // data size

    expect(view.getInt16(44, true)).toBe(0);
    expect(view.getInt16(46, true)).toBe(0x7fff);
    expect(view.getInt16(48, true)).toBe(-0x8000);
    expect(view.getInt16(50, true)).toBe(0x7fff); // clamped
    expect(view.getInt16(52, true)).toBe(-0x8000); // clamped
  });
});

describe("convertToWavFile", () => {
  const decoded = fakeAudioBuffer(new Float32Array(48_000), 48_000);
  const rendered = fakeAudioBuffer(new Float32Array(WAV_SAMPLE_RATE), WAV_SAMPLE_RATE);

  beforeEach(() => {
    vi.stubGlobal(
      "AudioContext",
      class {
        decodeAudioData = vi.fn(async () => decoded);
        close = () => Promise.resolve();
      },
    );
    vi.stubGlobal(
      "OfflineAudioContext",
      class {
        constructor(
          public channels: number,
          public length: number,
          public sampleRate: number,
        ) {}
        destination = {};
        createBufferSource = () => ({ buffer: null, connect: () => {}, start: () => {} });
        startRendering = vi.fn(async () => rendered);
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("decodes, resamples, and returns a named audio/wav File", async () => {
    const file = await convertToWavFile(new Blob(["webm-bytes"], { type: "audio/webm" }));
    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe("audio/wav");
    expect(file.name).toMatch(/^cough-\d+\.wav$/);
    // 44-byte header + 1s of mono 16-bit samples at 16 kHz.
    expect(file.size).toBe(44 + WAV_SAMPLE_RATE * 2);
  });

  it("propagates decode failures so callers can fall back", async () => {
    vi.stubGlobal(
      "AudioContext",
      class {
        decodeAudioData = () => Promise.reject(new Error("undecodable"));
        close = () => Promise.resolve();
      },
    );
    await expect(convertToWavFile(new Blob(["junk"]))).rejects.toThrow("undecodable");
  });
});
