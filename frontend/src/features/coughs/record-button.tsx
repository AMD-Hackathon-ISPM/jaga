"use client";

import { Button } from "@/components/ui/button";

/**
 * RecordButton — round, glowing, breathing record orb (ChatGPT-voice style).
 * Mic icon inside; gradient fill + glow + size pulse driven by CSS in
 * globals.css (.record-orb). The breathing/pulse animation is automatically
 * disabled under prefers-reduced-motion by the global reduced-motion rule.
 */
export function RecordButton({
  recording,
  onClick,
  disabled,
}: {
  recording: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="recorder"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={recording}
      aria-label={recording ? "Stop recording" : "Start recording"}
      className={recording ? "record-orb--active" : undefined}
    >
      {recording ? <StopIcon /> : <MicIcon />}
    </Button>
  );
}

function MicIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
        fill="currentColor"
      />
      <path
        d="M19 11a7 7 0 0 1-14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="2.5" fill="currentColor" />
    </svg>
  );
}
