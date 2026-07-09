import { FlowLayout } from "@/layouts/flow-layout";
import { GateScreen } from "@/features/gate/gate-screen";

/**
 * Step 0 — Gate (`/`). Language, research-prototype framing, eligibility +
 * consent acknowledgements (PRD-01).
 */
export default function GatePage() {
  return (
    <FlowLayout step="gate">
      <GateScreen />
    </FlowLayout>
  );
}
