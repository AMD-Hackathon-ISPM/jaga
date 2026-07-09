/**
 * NextStepPanel — the visually dominant block on the result (design §8.2).
 * Teal hairline + 6px radius (Figma page 5), heaviest heading, safety copy at the
 * 1rem floor. Identical for every band; never de-emphasized for Lower. Renders
 * immediately and unconditionally (not gated behind motion).
 */
export function NextStepPanel({
  title,
  instruction,
}: {
  title: string;
  instruction: string;
}) {
  return (
    <section className="rounded-control border border-brand bg-surface p-5">
      <h2 className="mb-1.5 font-heading text-lg font-semibold text-ink">{title}</h2>
      <p className="text-base leading-relaxed text-ink">{instruction}</p>
    </section>
  );
}
