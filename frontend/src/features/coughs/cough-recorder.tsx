"use client";

import { useCoughRecorder } from "@/hooks/use-cough-recorder";
import { CoughWaveform } from "./cough-waveform";
import { RecordButton } from "./record-button";

const STATUS: Record<string, string> = {
  idle: "Tap to record a cough",
  requesting: "Allow microphone access…",
  recording: "Recording… tap to stop",
  denied: "Microphone blocked. Enable it in your browser settings, then try again.",
  error: "Could not start recording. Try again.",
};

export function CoughRecorder({
  attemptIndex,
  onCaptured,
}: {
  attemptIndex: number;
  onCaptured: (file: File) => void;
}) {
  const { state, start, stop, analyserRef } = useCoughRecorder(onCaptured);
  const recording = state === "recording";

  return (
    <div className="flex flex-col gap-5">
      <p className="text-center font-mono text-sm tabular-nums text-ink-muted">
        Attempt {attemptIndex} of 5
      </p>

      {/* Full-bleed: -mx-4 cancels the FlowLayout column padding. No box. */}
      <div className="-mx-4 overflow-hidden">
        <CoughWaveform analyserRef={analyserRef} active={recording} />
      </div>

      <div className="flex flex-col items-center gap-3">
        <RecordButton
          recording={recording}
          onClick={recording ? stop : start}
          disabled={state === "requesting"}
        />
        <p aria-live="polite" className="min-h-[1.25rem] text-sm text-ink-muted">
          {STATUS[state]}
        </p>
      </div>
    </div>
  );
}
