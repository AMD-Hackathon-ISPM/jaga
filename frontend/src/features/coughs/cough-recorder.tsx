"use client";

import { RECORDING_MS, useCoughRecorder } from "@/hooks/use-cough-recorder";
import { useT } from "@/hooks/use-t";
import type { CoughRecording } from "@/store/session.store";
import { Button } from "@/components/ui/button";
import { CoughWaveform } from "./cough-waveform";
import { RecordButton } from "./record-button";

/** Format a millisecond value as clock time (m:ss). */
function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Single-session cough recorder card. Three live faces, one calm frame:
 *  · prompt   — idle / requesting / denied / error: mic button + status.
 *  · recording — remaining-time countdown, live waveform, stop button.
 *  · captured  — recording length and "Record again".
 */
export function CoughRecorder({
  coughRecording,
  onCaptured,
  onDiscard,
}: {
  coughRecording: CoughRecording | null;
  onCaptured: (rec: CoughRecording) => void;
  onDiscard: () => void;
}) {
  const t = useT();
  const { state, start, stop, restart, elapsedMs, analyserRef } =
    useCoughRecorder(onCaptured);

  const recording = state === "recording";
  const requesting = state === "requesting";
  const failed = state === "denied" || state === "error";
  const captured = !recording && !requesting && !failed && coughRecording !== null;

  return (
    <div className="rounded-frame border border-border-subtle bg-surface p-6">
      {recording ? (
        <div className="flex flex-col items-center gap-5">
          {/* Remaining time — the dominant, calm readout. */}
          <div className="flex flex-col items-center">
            <span
              className="font-mono text-4xl font-semibold tabular-nums text-ink"
              aria-hidden="true"
            >
              {formatClock(RECORDING_MS - elapsedMs)}
            </span>
            <span className="mt-1 text-xs text-ink-muted">{t("coughs.remaining")}</span>
          </div>

          {/* Live waveform, full-bleed within the card padding. */}
          <div className="relative -mx-6 overflow-hidden">
            <CoughWaveform analyserRef={analyserRef} active={recording} />
          </div>

          <RecordButton
            recording
            onClick={stop}
            startLabel={t("coughs.record.start")}
            stopLabel={t("coughs.record.stop")}
          />
        </div>
      ) : captured && coughRecording ? (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col rounded-control bg-surface-sunken px-4 py-3">
              <span className="text-xs text-ink-muted">{t("coughs.captured.duration")}</span>
              <span className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-ink">
                {formatClock(coughRecording.durationMs)}
              </span>
            </div>
          </div>

          {coughRecording.durationMs <= 2000 && (
            <p className="text-sm text-error" role="status">
              {t("coughs.captured.tooShort")}
            </p>
          )}

          <Button
            type="button"
            variant="return"
            onClick={() => {
              onDiscard();
              restart();
            }}
            className="self-start"
          >
            {t("coughs.captured.again")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <RecordButton
            recording={false}
            onClick={start}
            disabled={requesting}
            startLabel={t("coughs.record.start")}
            stopLabel={t("coughs.record.stop")}
          />
          <div className="flex flex-col items-center gap-1">
            <p
              aria-live="polite"
              className={`min-h-[1.25rem] text-center text-base ${
                failed ? "text-error" : "text-ink-muted"
              }`}
            >
              {t(`coughs.status.${state}`)}
            </p>
            {state === "idle" && (
              <span className="font-mono text-sm tabular-nums text-ink-muted">
                {t("coughs.hint")}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
