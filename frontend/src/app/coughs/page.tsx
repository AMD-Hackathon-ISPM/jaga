import { FlowLayout } from "@/layouts/flow-layout";
import { CoughsScreen } from "@/features/coughs/coughs-screen";

/**
 * Step 2 — Coughs (`/coughs`). Five guided attempts, sub-step 1/5..5/5,
 * in-context mic permission, per-attempt quality + retry (PRD-03/04).
 * Placeholder UI only — no real audio capture wired.
 */
export default function CoughsPage() {
  return (
    <FlowLayout step="coughs">
      <CoughsScreen />
    </FlowLayout>
  );
}
