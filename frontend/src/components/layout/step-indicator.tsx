"use client";

import type { FlowStep } from "@/types/common";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/use-t";
import { STEP_ICONS } from "./step-icons";

const STEP_KEYS: FlowStep[] = ["gate", "clinical", "coughs", "review", "result"];

/**
 * StepIndicator — top stepper (design §6). Five columns, each an icon over a
 * 60×5 bar over a label. Current = teal; completed = brand-soft with a check
 * badge; upcoming = muted. The current step carries aria-current; the label is
 * always AA-readable (muted icons are decorative). Never blocks reading.
 */
export function StepIndicator({ current }: { current: FlowStep }) {
  const t = useT();
  const currentIndex = STEP_KEYS.findIndex((s) => s === current);

  return (
    <nav aria-label={t("steps.navLabel")} className="mx-auto w-full max-w-flow px-4 pt-4">
      <ol className="flex items-start gap-2">
        {STEP_KEYS.map((stepKey, i) => {
          const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
          const Icon = STEP_ICONS[stepKey];
          const label = t(`steps.${stepKey}`);
          return (
            <li
              key={stepKey}
              aria-current={state === "current" ? "step" : undefined}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span className="relative inline-flex h-5 w-5 items-center justify-center">
                <Icon
                  className={cn(
                    "size-5",
                    state === "current" && "text-brand",
                    state === "done" && "text-brand-soft",
                    state === "upcoming" && "text-ink-muted opacity-40",
                  )}
                  aria-hidden="true"
                />
                {state === "done" && (
                  <IconCircleCheckFilled
                    className="absolute -bottom-0.5 -right-1 size-2.5 text-brand"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span
                className={cn(
                  "h-[5px] w-full max-w-[60px] rounded-full transition-colors duration-300 ease-out motion-reduce:transition-none",
                  state === "current" && "bg-brand",
                  state === "done" && "bg-brand-soft",
                  state === "upcoming" && "bg-track-muted",
                )}
              />
              <span
                className={cn(
                  "text-center text-sm",
                  state === "current" ? "font-medium text-ink" : "text-ink-muted",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
