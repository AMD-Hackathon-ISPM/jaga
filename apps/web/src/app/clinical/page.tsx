import { FlowLayout } from "@/layouts/flow-layout";
import { ClinicalScreen } from "@/features/clinical/clinical-screen";

/**
 * Step 1 — Clinical (`/clinical`). Supported clinical/demographic fields from
 * the signed contract (PRD-02). Placeholder UI only.
 */
export default function ClinicalPage() {
  return (
    <FlowLayout step="clinical">
      <ClinicalScreen />
    </FlowLayout>
  );
}
