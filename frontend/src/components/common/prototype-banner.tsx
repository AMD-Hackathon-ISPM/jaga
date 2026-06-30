/**
 * PrototypeBanner — required research-prototype warning (design §2.1, §8 locked
 * hierarchy item 1). Renders immediately and unconditionally; never gated behind
 * motion. Calm warning surface, no alarm.
 */
export function PrototypeBanner() {
  return (
    <div
      role="note"
      className="rounded-control border border-border-subtle bg-warning-surface px-4 py-3 text-sm text-ink"
    >
      Jaga is a research prototype. It does not diagnose or rule out TB.
    </div>
  );
}
