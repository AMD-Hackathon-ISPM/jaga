import { ClinicalForm } from "./clinical-form";

/** Clinical (step 1) — PLACEHOLDER wrapper around the clinical form. */
export function ClinicalScreen() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-2xl font-semibold">Clinical information</h1>
      <p className="text-ink-muted">Only fields supported by the approved model contract are collected.</p>
      <ClinicalForm />
    </div>
  );
}
