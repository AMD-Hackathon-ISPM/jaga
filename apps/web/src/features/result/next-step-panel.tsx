/**
 * NextStepPanel — the visually dominant block on the result (design §8.2).
 * Identical for every band; never de-emphasized for Lower. Renders immediately
 * and unconditionally (not gated behind motion).
 */
export function NextStepPanel({ instruction }: { instruction: string }) {
  return (
    <section className="rounded-control border border-border-strong bg-surface p-5">
      <h2 className="mb-2 font-serif text-xl font-semibold">Next step</h2>
      <p className="text-base">{instruction}</p>
    </section>
  );
}
