import { clinicalSchema, type ClinicalFormValues } from "./clinical-schema";

const OPTIONAL_VITAL_KEYS = ["heart_rate_bpm", "temperature_c"] as const;

/** True when all required clinical fields pass schema validation. */
export function isClinicalComplete(values: Partial<ClinicalFormValues>): boolean {
  const normalized = { ...values } as Record<string, unknown>;

  for (const key of OPTIONAL_VITAL_KEYS) {
    const value = normalized[key];
    if (
      value === null ||
      value === undefined ||
      (typeof value === "number" && Number.isNaN(value))
    ) {
      delete normalized[key];
    }
  }

  return clinicalSchema.safeParse(normalized).success;
}
