import { cn } from "@/lib/utils";

export function TextShimmer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("text-shimmer", className)}>{children}</span>;
}
