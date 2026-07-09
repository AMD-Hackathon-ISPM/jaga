import { FigureImage } from "./figure-image";

/**
 * SpectrogramFigure — optional model inspection artifact, last in the hierarchy
 * (design §8). Labelled non-causal; always paired with a text alternative. Can
 * be hidden without changing the next step. When a spectrogram URL is present
 * the image loads behind a Skeleton and fades in; otherwise a labelled
 * placeholder is shown.
 */
export function SpectrogramFigure({ label, src }: { label: string; src?: string }) {
  return (
    <figure className="flex flex-col gap-2">
      {src ? (
        <FigureImage src={src} alt="Model inspection figure" className="h-32 lg:h-48" />
      ) : (
        <div
          className="flex h-32 items-center justify-center rounded-control bg-surface-sunken lg:h-48"
          role="img"
          aria-label="Model inspection figure placeholder"
        >
          <span className="text-ink-muted">Spectrogram placeholder</span>
        </div>
      )}
      <figcaption className="text-sm text-ink-muted">{label}</figcaption>
    </figure>
  );
}
