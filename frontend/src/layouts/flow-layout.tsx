import type { FlowStep } from "@/types";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StepIndicator } from "@/components/layout/step-indicator";

/**
 * FlowLayout — the single shared layout for the step-based capture flow.
 * Single column, capped at 32rem, centered on the cream canvas (design §5.5/§5.6).
 * The flow deliberately does NOT become a multi-column dashboard.
 */
export function FlowLayout({ step, children }: { step: FlowStep; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Header />
      <StepIndicator current={step} />
      <main className="mx-auto w-full max-w-flow flex-1 px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
}
