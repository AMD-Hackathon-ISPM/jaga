import { FlowLayout } from "@/layouts/flow-layout";
import { CoughsScreen } from "@/features/coughs/coughs-screen";

export default function CoughsPage() {
  return (
    <FlowLayout step="coughs">
      <CoughsScreen />
    </FlowLayout>
  );
}
