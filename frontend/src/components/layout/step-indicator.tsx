import type { FlowStep } from "@/types";
import { cn } from "@/lib/utils";

const STEPS: { key: FlowStep; label: string }[] = [
  { key: "gate", label: "Eligibility" },
  { key: "clinical", label: "Clinical" },
  { key: "coughs", label: "Coughs" },
  { key: "review", label: "Review" },
  { key: "result", label: "Result" },
];

/**
 * StepIndicator — top stepper (design §6). Current step uses aria-current.
 * Never blocks reading the step content.
 */
export function StepIndicator({ current }: { current: FlowStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <nav aria-label="Progress" className="mx-auto w-full max-w-flow px-4 pt-4">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
          return (
            <li key={step.key} className="flex flex-1 flex-col items-center gap-1">
              <span
                aria-current={state === "current" ? "step" : undefined}
                className={cn(
                  "h-1 w-full rounded-bar transition-colors duration-300 ease-out motion-reduce:transition-none",
                  state === "upcoming" ? "bg-border-subtle" : "bg-brand",
                )}
              />
              <span
                className={cn(
                  "font-mono text-xs tabular-nums",
                  state === "current" ? "text-ink" : "text-ink-muted",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
