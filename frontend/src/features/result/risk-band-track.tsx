import type { RiskBand } from "@/types";
import { cn } from "@/lib/utils";

const ORDER: RiskBand[] = ["lower", "intermediate", "higher"];

const FILL: Record<RiskBand, string> = {
  lower: "bg-band-lower",
  intermediate: "bg-band-intermediate",
  higher: "bg-band-higher",
};

/**
 * RiskBandTrack — quiet 3-segment outlined track (design §4.4). The band is also
 * named in words by the caller; color is reinforcement, never the sole signal.
 * Lower carries no green / checkmark / reassurance.
 */
export function RiskBandTrack({ band }: { band: RiskBand }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`Model-estimated risk band: ${band}`}>
      {ORDER.map((seg) => {
        const active = seg === band;
        return (
          <span
            key={seg}
            className="relative h-2 flex-1 overflow-hidden rounded-bar border border-border-strong bg-surface"
          >
            {/* Active band fills to position via a left-anchored scaleX grow
                (risk-band-fill in globals.css) rather than popping in. */}
            {active && (
              <span aria-hidden="true" className={cn("absolute inset-0 risk-band-fill", FILL[seg])} />
            )}
          </span>
        );
      })}
    </div>
  );
}
