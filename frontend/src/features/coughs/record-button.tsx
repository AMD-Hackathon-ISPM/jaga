"use client";

import { IconMicrophone, IconPlayerStopFilled } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * RecordButton — flat teal rounded-square mic button (~76px) per design §7.
 * Recording feedback lives in the live waveform + status caption.
 */
export function RecordButton({
  recording,
  onClick,
  disabled,
  startLabel,
  stopLabel,
}: {
  recording: boolean;
  onClick: () => void;
  disabled?: boolean;
  startLabel: string;
  stopLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={recording}
      aria-label={recording ? stopLabel : startLabel}
      className={cn(
        "inline-flex size-[76px] shrink-0 items-center justify-center rounded-control text-white transition-colors",
        "bg-brand hover:brightness-95 active:brightness-90",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-sunken disabled:text-ink-muted",
        recording && "bg-brand-active",
      )}
    >
      {recording ? (
        <IconPlayerStopFilled className="size-7 fill-current" aria-hidden="true" />
      ) : (
        <IconMicrophone className="size-8" aria-hidden="true" />
      )}
    </button>
  );
}
