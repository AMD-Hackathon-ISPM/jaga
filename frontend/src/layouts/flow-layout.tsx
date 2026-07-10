import type { FlowStep } from "@/types";
import { cn } from "@/lib/utils";
import { EligibilityGuard } from "@/components/layout/eligibility-guard";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StepIndicator } from "@/components/layout/step-indicator";
import { SkipToMain } from "@/components/layout/skip-to-main";

/**
 * FlowLayout — the single shared layout for the step-based capture flow.
 * Single column capped at 32rem (design §5.5). From 840px, pages that pass `wide`
 * (review/result) widen to 56rem for the two-column evidence layout (§5.6);
 * capture pages keep the centered column.
 */
export function FlowLayout({
  step,
  wide = false,
  children,
}: {
  step: FlowStep;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const guardedChildren =
    step === "gate" ? children : <EligibilityGuard>{children}</EligibilityGuard>;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <SkipToMain />
      <Header wide={wide} />
      <StepIndicator current={step} />
      <main
        id="main-content"
        className={cn(
          "mx-auto w-full flex-1 px-4 py-6 lg:px-6 lg:py-10",
          wide ? "max-w-flow min-[840px]:max-w-flow-wide" : "max-w-flow",
        )}
      >
        {guardedChildren}
      </main>
      <Footer wide={wide} />
    </div>
  );
}
