"use client";

import { ErrorState } from "@/components/ui/error-state";

/**
 * Route segment error boundary (Next.js App Router). Safety copy rule (§2):
 * a failure means no result was produced; retry or use the standard clinical
 * pathway. Never imply a diagnosis. No estimate is ever shown here.
 */
export default function RouteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-flow px-4 py-8">
      <ErrorState
        title="Something went wrong"
        description="No result was produced. You can retry, or continue with the standard clinical pathway."
        onRetry={reset}
        retryLabel="Try again"
      />
    </div>
  );
}
