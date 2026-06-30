import { Button } from "./button";
import { Alert, AlertDescription, AlertTitle } from "./alert";
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
    <Alert
      variant="destructive"
      tabIndex={-1}
      className={cn("p-4", className)}
    >
      <AlertTitle className="text-lg font-semibold">{title}</AlertTitle>
      {description && <AlertDescription className="text-foreground">{description}</AlertDescription>}
      {onRetry && (
        <div className="mt-4">
          <Button variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </Alert>
  );
}
