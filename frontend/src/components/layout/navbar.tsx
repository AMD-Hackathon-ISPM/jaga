/**
 * Navbar — OPERATOR-AREA SCAFFOLDING ONLY.
 *
 * The public triage flow uses <Header>, not this navbar. This is a placeholder
 * for a possible future authenticated operator/demo area (paired with the
 * route guards). No links are wired.
 */
export function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-border-subtle bg-surface px-4 py-3">
      <span className="font-serif font-semibold text-brand">Jaga · Operator</span>
      <span className="text-sm text-ink-muted">Placeholder — not used by the capture flow</span>
    </nav>
  );
}
