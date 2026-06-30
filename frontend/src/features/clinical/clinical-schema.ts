import { z } from "zod";
import { PATIENT_BOUNDS } from "@/types/patient";

/**
 * Clinical Zod schema — kept in SYNC with the live Go validator
 * (backend/go/internal/validation/patient.go). Same bounds → the UI rejects the
 * same values the backend would. Field names match the wire contract (snake_case).
 */
const b = PATIENT_BOUNDS;

const radioBoolean = z.boolean({ required_error: "Select one." });

export const clinicalSchema = z.object({
  age_years: z.number().int().min(b.age_years.min).max(b.age_years.max),
  sex_at_birth: z.enum(["male", "female"]),
  height_cm: z.number().min(b.height_cm.min).max(b.height_cm.max),
  weight_kg: z.number().min(b.weight_kg.min).max(b.weight_kg.max),
  cough_duration_days: z
    .number()
    .int()
    .min(b.cough_duration_days.min)
    .max(b.cough_duration_days.max),
  prior_tb: radioBoolean,
  hemoptysis: radioBoolean,
  // Optional vitals — validated only when provided.
  heart_rate_bpm: z
    .number()
    .int()
    .min(b.heart_rate_bpm.min)
    .max(b.heart_rate_bpm.max)
    .nullable()
    .optional(),
  temperature_c: z
    .number()
    .min(b.temperature_c.min)
    .max(b.temperature_c.max)
    .nullable()
    .optional(),
  smoked_last_7_days: radioBoolean,
  fever_last_30_days: radioBoolean,
  night_sweats_last_30_days: radioBoolean,
  weight_loss_last_30_days: radioBoolean,
});

export type ClinicalFormValues = z.infer<typeof clinicalSchema>;
