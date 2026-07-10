import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CoughRecording } from "@/store/session.store";
import { CoughRecorder } from "./cough-recorder";

// Controllable stand-in for the recorder hook so the component's captured/idle
// faces can be exercised without a real MediaRecorder.
const restart = vi.fn();
const start = vi.fn();
const stop = vi.fn();
let recorderReturn: {
  state: string;
  start: typeof start;
  stop: typeof stop;
  restart: typeof restart;
  elapsedMs: number;
  coughEvents: number[];
  analyserRef: { current: AnalyserNode | null };
};

vi.mock("@/hooks/use-cough-recorder", () => ({
  RECORDING_MS: 90_000,
  useCoughRecorder: () => recorderReturn,
}));

function makeRecording(overrides: Partial<CoughRecording> = {}): CoughRecording {
  return {
    file: new File(["audio"], "cough-session.webm", { type: "audio/webm" }),
    durationMs: 42_000,
    coughEvents: [1200, 4800, 9000],
    ...overrides,
  };
}

describe("CoughRecorder", () => {
  beforeEach(() => {
    restart.mockReset();
    start.mockReset();
    stop.mockReset();
    recorderReturn = {
      state: "idle",
      start,
      stop,
      restart,
      elapsedMs: 0,
      coughEvents: [],
      analyserRef: { current: null },
    };
  });

  afterEach(cleanup);

  it("shows the captured summary and re-records via restart", async () => {
    const user = userEvent.setup();
    const onDiscard = vi.fn();
    render(
      <CoughRecorder
        coughRecording={makeRecording()}
        onCaptured={vi.fn()}
        onDiscard={onDiscard}
      />,
    );

    // Duration formatted mm:ss and the detected-cough count are both surfaced.
    expect(screen.getByText("0:42")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    const again = screen.getByRole("button", { name: /record again/i });
    await user.click(again);
    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(restart).toHaveBeenCalledTimes(1);
  });

  it("flags a too-short capture instead of letting the user continue", () => {
    render(
      <CoughRecorder
        coughRecording={makeRecording({ durationMs: 1500 })}
        onCaptured={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );
    expect(screen.getByText(/too short/i)).toBeInTheDocument();
  });

  it("shows the idle prompt and duration hint before any recording exists", () => {
    render(
      <CoughRecorder coughRecording={null} onCaptured={vi.fn()} onDiscard={vi.fn()} />,
    );
    expect(screen.getByText("Up to 1:30")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start recording/i })).toBeInTheDocument();
  });
});
