"use client";

import type { RiskBand } from "@/types";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

const ORDER: RiskBand[] = ["lower", "intermediate", "higher"];

const FILL: Record<RiskBand, string> = {
  lower: "bg-band-lower",
  intermediate: "bg-band-intermediate",
  higher: "bg-band-higher",
};

/**
 * RiskBandTrack — quiet 3-segment track (design §4.4). Figma geometry (12px-tall
 * rounded segments, small gaps, full width) with the locked non-green `--band-*`
 * ramp instead of brand teal (teal never carries risk, §4.4). Only the active
 * segment fills; the band is also named in words under the track (§C2.3) and by
 * the caller, so color is reinforcement, never the sole signal. Lower carries no
 * green / checkmark.
 *
 * `caption` is an optional one-line "how to read" note rendered under the names.
 */
export function RiskBandTrack({
  band,
  probability,
  caption,
}: {
  band: RiskBand;
  probability?: number;
  caption?: string;
}) {
  const t = useT();
  const activeIndex = ORDER.indexOf(band);
  const pct = typeof probability === "number" ? `${Math.round(probability * 100)}%` : null;
  const ariaLabel = t("result.riskBandAria").replace("{band}", band);

  return (
    <div>
      {pct && (
        <div className="mb-1.5 grid grid-cols-3 gap-1.5">
          <div className="flex justify-center" style={{ gridColumnStart: activeIndex + 1 }}>
            <span className="rounded-full border border-border-subtle bg-surface px-2 py-0.5 font-mono text-xs tabular-nums text-ink">
              {pct}
            </span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-1.5" role="img" aria-label={ariaLabel}>
        {ORDER.map((seg) => {
          const active = seg === band;
          return (
            <span
              key={seg}
              className={cn(
                "relative h-3 overflow-hidden rounded-full border",
                active ? "border-border-strong" : "border-border-subtle bg-surface-sunken",
              )}
            >
              {active && (
                <span aria-hidden="true" className={cn("absolute inset-0 risk-band-fill", FILL[seg])} />
              )}
            </span>
          );
        })}
      </div>
      <div aria-hidden="true" className="mt-1.5 grid grid-cols-3 gap-1.5 text-xs">
        {ORDER.map((seg) => (
          <span
            key={seg}
            className={cn(
              "text-center",
              seg === band ? "font-medium text-ink" : "text-ink-muted",
            )}
          >
            {t(`result.bandShort.${seg}`)}
          </span>
        ))}
      </div>
      {caption && <p className="mt-2 text-xs text-ink-muted text-pretty">{caption}</p>}
    </div>
  );
}
