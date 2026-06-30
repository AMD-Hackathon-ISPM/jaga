import { cn } from "@/lib/utils";

/** Skeleton — loading placeholder (design §6: skeletons, not content spinners). */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-control bg-surface-sunken", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
