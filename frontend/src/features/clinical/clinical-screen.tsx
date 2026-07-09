"use client";

import { ClinicalForm } from "./clinical-form";
import { useT } from "@/hooks/use-t";

export function ClinicalScreen() {
  const t = useT();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-sans text-xl font-semibold text-ink">{t("clinical.title")}</h1>
        <p className="text-base text-ink-muted">{t("clinical.lead")}</p>
      </div>
      <ClinicalForm />
    </div>
  );
}
