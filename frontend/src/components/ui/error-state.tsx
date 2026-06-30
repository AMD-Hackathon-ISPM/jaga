import { Button } from "./button";
import { cn } from "@/lib/utils";

/**
 * ErrorState — focusable error region (role="alert"; design §6). Never shows an
 * estimate. Used by route error boundary and inline page errors.
 */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Retry",
  className,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      tabIndex={-1}
      className={cn("rounded-control border border-error bg-error-surface p-4 text-ink", className)}
    >
      <h3 className="mb-1 text-lg font-semibold text-error">{title}</h3>
      {description && <p className="mb-4">{description}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
