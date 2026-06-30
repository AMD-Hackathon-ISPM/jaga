import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level loading UI. Design §6: loading uses skeletons, not centered
 * spinners in content.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-flow px-4 py-8" aria-busy="true" aria-live="polite">
      <Skeleton className="mb-4 h-8 w-2/3" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  );
}
