import { FlowLayout } from "@/layouts/flow-layout";
import { ReviewScreen } from "@/features/review/review-screen";

export default function ReviewPage() {
  return (
    <FlowLayout step="review" wide>
      <ReviewScreen />
    </FlowLayout>
  );
}
