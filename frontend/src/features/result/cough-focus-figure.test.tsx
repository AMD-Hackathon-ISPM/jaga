import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { CoughRecording } from "@/store/session.store";
import { CoughFocusFigure } from "./cough-focus-figure";

const caption = "Illustrative recording summary, not model output.";

function makeRecording(coughEvents: number[]): CoughRecording {
  return {
    file: {
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      name: "cough.webm",
      size: 8,
      type: "audio/webm",
    } as unknown as File,
    durationMs: 90_000,
    coughEvents,
  };
}

function installCanvasMock() {
  const context = {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    roundRect: vi.fn(),
    fillStyle: "",
    globalAlpha: 1,
  };

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as never);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(320);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(112);
}

function installOfflineAudioContext() {
  class OfflineAudioContextMock {
    decodeAudioData = vi.fn().mockResolvedValue({
      getChannelData: () => new Float32Array(90_000),
      sampleRate: 1000,
    });
  }

  vi.stubGlobal("OfflineAudioContext", OfflineAudioContextMock);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CoughFocusFigure", () => {
  it("renders every numeral for more than eight events and keeps edge labels inside", async () => {
    installCanvasMock();
    installOfflineAudioContext();
    const events = [1000, 10_000, 20_000, 30_000, 40_000, 50_000, 60_000, 70_000, 89_000];

    render(<CoughFocusFigure recording={makeRecording(events)} />);

    const visual = await screen.findByRole("img", {
      name: "Recording waveform with 9 detected coughs",
    });
    for (let index = 1; index <= events.length; index++) {
      expect(screen.getByText(String(index))).toBeVisible();
    }
    expect(screen.getByText("1")).toHaveStyle({ transform: "none" });
    expect(screen.getByText("9")).toHaveStyle({ transform: "translateX(-100%)" });

    const figureCaption = screen.getByText(caption);
    expect(screen.getByText("Detected cough moments")).toBeVisible();
    expect(screen.getByText("lower energy")).toBeVisible();
    expect(screen.getByText("higher energy")).toBeVisible();
    expect(screen.queryByText("Model focus over time")).not.toBeInTheDocument();
    expect(visual).toHaveAttribute("aria-describedby", figureCaption.id);
    await waitFor(() => expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled());
  });

  it("announces an unavailable preview without claiming a waveform rendered", async () => {
    vi.stubGlobal("OfflineAudioContext", undefined);

    render(<CoughFocusFigure recording={makeRecording([1000])} />);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Waveform preview unavailable for this recording.",
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText(caption)).toBeVisible();
  });
});
