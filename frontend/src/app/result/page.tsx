import { FlowLayout } from "@/layouts/flow-layout";
import { ResultScreen } from "@/features/result/result-screen";

/**
 * Step 5 — Result (`/result`). Locked result hierarchy (design §8) +
 * limitations + optional model inspection (PRD-06). Renders MOCK data only.
 */
export default function ResultPage() {
  return (
    <FlowLayout step="result" wide>
      <ResultScreen />
    </FlowLayout>
  );
}
