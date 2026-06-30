/**
 * PrototypeBanner — required research-prototype warning (design §2.1, §8 locked
 * hierarchy item 1). Renders immediately and unconditionally; never gated behind
 * motion. Calm warning surface, no alarm.
 */
export function PrototypeBanner() {
  return (
    <Alert
      role="note"
      variant="warning"
      className="px-4 py-3"
    >
      <AlertDescription className="text-foreground">
        Jaga is a research prototype. It does not diagnose or rule out TB.
      </AlertDescription>
    </Alert>
  );
}
import { Alert, AlertDescription } from "@/components/ui/alert";
