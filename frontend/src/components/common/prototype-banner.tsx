"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useT } from "@/hooks/use-t";

/**
 * PrototypeBanner — required research-prototype warning (design §2.1, §8 locked
 * hierarchy item 1). Renders immediately and unconditionally; never gated behind
 * motion. Calm warning surface, no alarm.
 */
export function PrototypeBanner() {
  const t = useT();

  return (
    <Alert role="note" variant="warning" className="border-border-subtle bg-warning-cream px-4 py-3">
      <AlertDescription className="text-base italic text-ink">{t("prototype.banner")}</AlertDescription>
    </Alert>
  );
}
