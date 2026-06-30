import { cn } from "@/lib/utils";

/** Inline spinner. Prefer skeletons for content loading; use this for inline actions only. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent",
        className,
      )}
    />
  );
}
