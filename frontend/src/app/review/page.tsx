import { FlowLayout } from "@/layouts/flow-layout";
import { ReviewScreen } from "@/features/review/review-screen";

/**
 * Step 3 — Review (`/review`). Summary of clinical inputs + five accepted
 * coughs; single submit action; processing overlay lives here (PRD-05).
 * Placeholder UI only — submit does not call any API.
 */
export default function ReviewPage() {
  return (
    <FlowLayout step="review">
      <ReviewScreen />
    </FlowLayout>
  );
}
