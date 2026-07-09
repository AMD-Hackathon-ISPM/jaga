"use client";

import { IconPlayerPlay, IconRefresh } from "@tabler/icons-react";
import { useCallback, useRef } from "react";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session.store";

/**
 * AttemptList — five per-attempt rows. Recorded rows get a teal tint fill plus
 * play / re-record icon buttons; pending rows stay white with right-aligned
 * status text. Status carries both an affordance AND text (design §6).
 */
export function AttemptList({ onReplace }: { onReplace: (index: number) => void }) {
  const t = useT();
  const coughFiles = useSessionStore((s) => s.coughFiles);
  const firstEmptyIndex = coughFiles.findIndex((file) => file === null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    audio.src = url;
    audio.currentTime = 0;
    audio.onended = () => URL.revokeObjectURL(url);
    void audio.play().catch(() => URL.revokeObjectURL(url));
  }, []);

  const label = (index: number) => {
    const template = t("coughs.row.label");
    const [lead, tail = ""] = template.split("{n}");
    return (
      <span className="text-sm text-ink">
        {lead}
        <span className="font-mono tabular-nums">{index + 1}</span>
        {tail}
      </span>
    );
  };

  return (
    <ul role="list" className="flex flex-col gap-1.5">
      {coughFiles.map((file, index) => {
        const recorded = file !== null;
        const waiting = !recorded && index === firstEmptyIndex;
        const rowLabel = t("coughs.row.label").replace("{n}", String(index + 1));

        return (
          <li
            key={index}
            className={cn(
              "flex min-h-11 items-center justify-between gap-3 rounded-control border px-3 py-1.5",
              recorded
                ? "border-transparent bg-tint-brand-5"
                : "border-border-subtle bg-surface",
            )}
          >
            {label(index)}

            {recorded ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => play(file)}
                  aria-label={t("coughs.row.play").replace("{n}", String(index + 1))}
                  className="inline-flex size-11 items-center justify-center rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <span className="inline-flex size-5 items-center justify-center rounded-[5px] bg-brand-soft text-white">
                    <IconPlayerPlay className="size-3 fill-current" aria-hidden="true" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onReplace(index)}
                  aria-label={t("coughs.row.replace").replace("{n}", String(index + 1))}
                  className="inline-flex size-11 items-center justify-center rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <span className="inline-flex size-5 items-center justify-center rounded-[5px] bg-accent-return text-white">
                    <IconRefresh className="size-3" aria-hidden="true" />
                  </span>
                </button>
              </div>
            ) : (
              <span
                className="text-sm text-ink-muted"
                aria-label={`${rowLabel}: ${waiting ? t("coughs.row.waiting") : t("coughs.row.empty")}`}
              >
                {waiting ? t("coughs.row.waiting") : t("coughs.row.empty")}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
