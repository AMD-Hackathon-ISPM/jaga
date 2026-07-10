"use client";

import { useCoughRecorder } from "@/hooks/use-cough-recorder";
import { useT } from "@/hooks/use-t";
import type { CoughRecording } from "@/store/session.store";
import { CoughWaveform } from "./cough-waveform";
import { RecordButton } from "./record-button";

export function CoughRecorder({
  attemptIndex,
  onCaptured,
}: {
  attemptIndex: number;
  onCaptured: (rec: CoughRecording) => void;
}) {
  const t = useT();
  const { state, start, stop, analyserRef } = useCoughRecorder(onCaptured);
  const recording = state === "recording";

  return (
    <div className="flex flex-col gap-6">
      {/* Attempt counter — teal pill, numerals in Ioskeley Mono. */}
      <div className="flex justify-center">
        <span className="inline-flex min-h-6 items-center rounded-full bg-brand px-3 py-1 text-sm font-medium text-white">
          {t("coughs.attemptPill")
            .split(/(\{n\}|\{total\})/)
            .map((part, i) =>
              part === "{n}" || part === "{total}" ? (
                <span key={i} className="font-mono tabular-nums">
                  {part === "{n}" ? attemptIndex : 5}
                </span>
              ) : (
                <span key={i} className="whitespace-pre-wrap">
                  {part}
                </span>
              ),
            )}
        </span>
      </div>

      {/* Dotted teal separator across the content width. */}
      <div className="h-0 border-t-2 border-dotted border-brand" role="presentation" />

      <div className="flex flex-col items-center gap-3">
        <RecordButton
          recording={recording}
          onClick={recording ? stop : start}
          disabled={state === "requesting"}
          startLabel={t("coughs.record.start")}
          stopLabel={t("coughs.record.stop")}
        />
        <p aria-live="polite" className="min-h-[1.25rem] text-center text-base text-ink-muted">
          {t(`coughs.status.${state}`)}
        </p>
      </div>

      {/* Live waveform only while recording — keeps the idle screen clean like
          the Figma reference. CoughWaveform handles its own reduced-motion path
          (static level meter). Full-bleed: -mx-4 cancels the flow padding. */}
      {recording && (
        <div className="-mx-4 overflow-hidden">
          <CoughWaveform analyserRef={analyserRef} active={recording} />
        </div>
      )}
    </div>
  );
}
