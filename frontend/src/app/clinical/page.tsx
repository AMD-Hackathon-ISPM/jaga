import { FlowLayout } from "@/layouts/flow-layout";
import { ClinicalScreen } from "@/features/clinical/clinical-screen";

export default function ClinicalPage() {
  return (
    <FlowLayout step="clinical">
      <ClinicalScreen />
    </FlowLayout>
  );
}
