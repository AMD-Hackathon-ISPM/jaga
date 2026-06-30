import { cn } from "@/lib/utils";

/**
 * EmptyState — teaches the step (what to do, why), never "nothing here"
 * (design §6).
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-control border border-dashed border-border-strong p-6 text-center", className)}>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      {description && <p className="mb-4 text-ink-muted">{description}</p>}
      {action}
    </div>
  );
}
