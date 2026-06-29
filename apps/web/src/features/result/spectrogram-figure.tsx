/**
 * SpectrogramFigure — PLACEHOLDER. Optional, last in the hierarchy (design §8).
 * Labelled non-causal; always paired with a text alternative. Can be hidden
 * without changing the next step.
 */
export function SpectrogramFigure({ label }: { label: string }) {
  return (
    <figure className="space-y-2">
      <div
        className="flex h-32 items-center justify-center rounded-control bg-surface-sunken"
        role="img"
        aria-label="Model inspection figure placeholder"
      >
        <span className="text-ink-muted">Spectrogram placeholder</span>
      </div>
      <figcaption className="text-sm text-ink-muted">{label}</figcaption>
    </figure>
  );
}
