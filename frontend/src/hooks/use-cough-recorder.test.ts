import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RECORDING_MS, selectRecorderMimeType, useCoughRecorder } from "./use-cough-recorder";
import type { CoughRecording } from "@/store/session.store";

describe("selectRecorderMimeType", () => {
  it("selects a supported WebM recording format", () => {
    const isTypeSupported = vi.fn((type: string) => type === "audio/webm;codecs=opus");
    expect(selectRecorderMimeType(isTypeSupported)).toBe("audio/webm;codecs=opus");
  });

  it("fails when the browser cannot create WebM audio", () => {
    expect(() => selectRecorderMimeType(() => false)).toThrow("WebM audio recording is unavailable.");
  });
});

// --- Mocked media stack for recording semantics -----------------------------

class MockMediaRecorder {
  static isTypeSupported = vi.fn(() => true);
  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  readonly mimeType: string;

  constructor(_stream: MediaStream, options: { mimeType: string }) {
    this.mimeType = options.mimeType;
  }

  start() {
    this.state = "recording";
  }

  // Real MediaRecorders deliver dataavailable/stop ASYNCHRONOUSLY after
  // stop(). Modeling that with a macrotask is what exercises the
  // restart-vs-stale-onstop race: a restart() re-arms a new take before the
  // old recorder's handlers ever run.
  stop() {
    this.state = "inactive";
    setTimeout(() => {
      this.ondataavailable?.({ data: new Blob(["chunk"], { type: this.mimeType }) });
      this.onstop?.();
    }, 0);
  }
}

// No decodeAudioData: WAV conversion fails in these tests, so captures take
// the WebM fallback path. The success path is covered by its own test below.
class MockAudioContext {
  createMediaStreamSource() {
    return { connect: () => {} };
  }
  createAnalyser() {
    return {
      fftSize: 1024,
      smoothingTimeConstant: 0,
      connect: () => {},
      getFloatTimeDomainData: () => {},
    };
  }
  close() {
    return Promise.resolve();
  }
}

let endTrack: () => void;

function installMediaMocks() {
  let onEnded: (() => void) | null = null;
  const track = {
    stop: () => {},
    addEventListener: (type: string, listener: () => void) => {
      if (type === "ended") onEnded = listener;
    },
  };
  const stream = { getTracks: () => [track] } as unknown as MediaStream;
  const getUserMedia = vi.fn(async () => stream);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
  vi.stubGlobal("MediaRecorder", MockMediaRecorder);
  vi.stubGlobal("AudioContext", MockAudioContext);
  // Keep the sampling loop inert so tests exercise cap/restart logic only.
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  endTrack = () => onEnded?.();
  return { getUserMedia };
}

describe("useCoughRecorder", () => {
  beforeEach(() => {
    // Fake `performance` too so elapsed/duration math is deterministic and
    // advances in lockstep with the timer clock.
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date", "performance"],
    });
    installMediaMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("starts recording", async () => {
    const onCaptured = vi.fn();
    const { result } = renderHook(() => useCoughRecorder(onCaptured));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.state).toBe("recording");
    expect(onCaptured).not.toHaveBeenCalled();
  });

  it("auto-stops at the hard cap and captures a full CoughRecording", async () => {
    const onCaptured = vi.fn();
    const { result } = renderHook(() => useCoughRecorder(onCaptured));

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      vi.advanceTimersByTime(RECORDING_MS);
      vi.advanceTimersByTime(1); // flush the recorder's async onstop (macrotask)
    });

    expect(onCaptured).toHaveBeenCalledTimes(1);
    const rec = onCaptured.mock.calls[0][0] as CoughRecording;
    expect(rec.file).toBeInstanceOf(File);
    expect(rec.file.type).toBe("audio/webm;codecs=opus");
    expect(rec.file.name).toMatch(/^cough-\d+\.webm$/);
    expect(rec.file.size).toBeGreaterThan(0);
    expect(rec.durationMs).toBe(RECORDING_MS);
    expect(result.current.state).toBe("idle");
  });

  it("captures with the elapsed duration when stopped manually before the cap", async () => {
    const onCaptured = vi.fn();
    const { result } = renderHook(() => useCoughRecorder(onCaptured));

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      vi.advanceTimersByTime(5_000); // record for 5s of fake time
    });
    await act(async () => {
      result.current.stop();
      vi.advanceTimersByTime(1); // flush the recorder's async onstop (macrotask)
    });

    expect(onCaptured).toHaveBeenCalledTimes(1);
    const rec = onCaptured.mock.calls[0][0] as CoughRecording;
    expect(rec.file).toBeInstanceOf(File);
    expect(rec.durationMs).toBe(5_000);
    expect(result.current.state).toBe("idle");
  });

  it("restart discards the take even though the old recorder stops asynchronously", async () => {
    const onCaptured = vi.fn();
    const { result } = renderHook(() => useCoughRecorder(onCaptured));

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.restart();
    });
    expect(result.current.state).toBe("recording");

    // The OLD recorder's dataavailable/onstop fire only now — after restart()
    // has already re-armed a new take. The discarded take must not capture.
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(onCaptured).not.toHaveBeenCalled();

    // The re-armed take still captures at the cap, exactly once.
    await act(async () => {
      vi.advanceTimersByTime(RECORDING_MS);
      vi.advanceTimersByTime(1); // flush the recorder's async onstop (macrotask)
    });
    expect(onCaptured).toHaveBeenCalledTimes(1);
    const rec = onCaptured.mock.calls[0][0] as CoughRecording;
    expect(rec.durationMs).toBe(RECORDING_MS);
  });

  it("does not capture when unmounted mid-recording", async () => {
    const onCaptured = vi.fn();
    const { result, unmount } = renderHook(() => useCoughRecorder(onCaptured));

    await act(async () => {
      await result.current.start();
    });
    unmount();
    await act(async () => {
      vi.advanceTimersByTime(1); // flush the recorder's async onstop (macrotask)
    });

    expect(onCaptured).not.toHaveBeenCalled();
  });

  it("captures a 16 kHz mono WAV file when the browser can decode the take", async () => {
    const rendered = {
      sampleRate: 16_000,
      duration: 1,
      getChannelData: () => new Float32Array(16_000),
    };
    vi.stubGlobal(
      "AudioContext",
      class extends MockAudioContext {
        decodeAudioData = async () => rendered;
      },
    );
    vi.stubGlobal(
      "OfflineAudioContext",
      class {
        destination = {};
        createBufferSource = () => ({ buffer: null, connect: () => {}, start: () => {} });
        startRendering = async () => rendered;
      },
    );

    const onCaptured = vi.fn();
    const { result } = renderHook(() => useCoughRecorder(onCaptured));

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      result.current.stop();
      vi.advanceTimersByTime(1); // flush the recorder's async onstop (macrotask)
    });

    expect(onCaptured).toHaveBeenCalledTimes(1);
    const rec = onCaptured.mock.calls[0][0] as CoughRecording;
    expect(rec.file.type).toBe("audio/wav");
    expect(rec.file.name).toMatch(/^cough-\d+\.wav$/);
    expect(rec.file.size).toBe(44 + 16_000 * 2);
  });

  it("falls back to the original WebM file when WAV conversion fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onCaptured = vi.fn();
    const { result } = renderHook(() => useCoughRecorder(onCaptured));

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      result.current.stop();
      vi.advanceTimersByTime(1);
    });

    expect(onCaptured).toHaveBeenCalledTimes(1);
    const rec = onCaptured.mock.calls[0][0] as CoughRecording;
    expect(rec.file.type).toBe("audio/webm;codecs=opus");
    expect(rec.file.name).toMatch(/^cough-\d+\.webm$/);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("discards the take when the microphone track ends", async () => {
    const onCaptured = vi.fn();
    const { result } = renderHook(() => useCoughRecorder(onCaptured));

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      endTrack();
      vi.advanceTimersByTime(1);
    });

    expect(onCaptured).not.toHaveBeenCalled();
    expect(result.current.state).toBe("error");
  });
});
