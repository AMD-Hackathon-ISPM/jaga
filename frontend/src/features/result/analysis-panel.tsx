import { Fragment } from "react";

type MetaRow = { label: string; value: string };

/**
 * AnalysisPanel — "What the model looked at" (design §C2.4). A quiet card that
 * frames the estimate: which signal was read, the reference cohort, calibration
 * status, and a short plain-language description of what the model examined.
 *
 * Copy is locked-safe: it describes what the model compared (patterns vs. a
 * reference cohort), never a performance claim, personal probability, or a
 * diagnosis (evidence-register §7). It sits below the dominant next-step panel
 * and never competes with it — smaller heading, muted body.
 */
export function AnalysisPanel({
  title,
  signal,
  metadata,
}: {
  title: string;
  signal: MetaRow;
  metadata: {
    cohort: MetaRow;
    calibration: MetaRow;
    description: string;
  };
}) {
  const rows: MetaRow[] = [signal, metadata.cohort, metadata.calibration];

  return (
    <section className="rounded-control border border-border-subtle bg-card p-5">
      <h2 className="font-heading text-base font-semibold text-ink">{title}</h2>
      <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
        {rows.map((row) => (
          <Fragment key={row.label}>
            <dt className="text-ink-muted">{row.label}</dt>
            <dd className="min-w-0 text-ink">{row.value}</dd>
          </Fragment>
        ))}
      </dl>
      <p className="mt-3 border-t border-border-subtle pt-3 text-sm leading-relaxed text-ink-muted text-pretty">
        {metadata.description}
      </p>
    </section>
  );
}
