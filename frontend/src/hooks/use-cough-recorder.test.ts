import { describe, expect, it, vi } from "vitest";
import { selectRecorderMimeType } from "./use-cough-recorder";

describe("selectRecorderMimeType", () => {
  it("selects a supported WebM recording format", () => {
    const isTypeSupported = vi.fn((type: string) => type === "audio/webm;codecs=opus");
    expect(selectRecorderMimeType(isTypeSupported)).toBe("audio/webm;codecs=opus");
  });

  it("fails when the browser cannot create WebM audio", () => {
    expect(() => selectRecorderMimeType(() => false)).toThrow("WebM audio recording is unavailable.");
  });
});
