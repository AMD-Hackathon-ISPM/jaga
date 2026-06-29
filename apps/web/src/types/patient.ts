/**
 * Patient intake types — mirrored EXACTLY from the signed Go contract:
 *   backend/go/internal/models/patient.go
 *   backend/go/internal/validation/patient.go
 *
 * This is the one part of the wire contract that already exists and is live
 * (`POST /api/v1/patient/intake`). Field names are snake_case to match the Go
 * `json` tags on the wire. Do not rename without changing the backend.
 */

export type SexAtBirth = "male" | "female";

/** Request body for POST /api/v1/patient/intake. All required fields validated server-side. */
export interface PatientIntakeRequest {
  age_years: number;
  sex_at_birth: SexAtBirth;
  height_cm: number;
  weight_kg: number;
  cough_duration_days: number;
  prior_tb: boolean;
  hemoptysis: boolean;
  /** Optional vitals. Omit (or null) when not measured. */
  heart_rate_bpm?: number | null;
  temperature_c?: number | null;
  smoked_last_7_days: boolean;
  fever_last_30_days: boolean;
  night_sweats_last_30_days: boolean;
  weight_loss_last_30_days: boolean;
  // NOTE: prior_tb_type is intentionally disabled in the backend pending the
  // CODA dataset schema. Do not add it here until the backend re-enables it.
}

/** Normalized patient echoed back on success (models.PatientIntake). */
export type PatientIntake = PatientIntakeRequest;

export interface ValidationError {
  field: string;
  message: string;
}

export interface PatientIntakeSuccessResponse {
  status: "validated";
  patient: PatientIntake;
}

export interface PatientIntakeErrorResponse {
  status: "invalid";
  errors: ValidationError[];
}

/**
 * Validation bounds copied from backend/go/internal/validation/patient.go.
 * The clinical Zod schema (features/clinical/clinical-schema.ts) must stay in
 * sync with these so the frontend rejects the same values the backend would.
 */
export const PATIENT_BOUNDS = {
  age_years: { min: 0, max: 120 },
  height_cm: { min: 40, max: 260 },
  weight_kg: { min: 1, max: 350 },
  cough_duration_days: { min: 0, max: 365 },
  heart_rate_bpm: { min: 20, max: 250 },
  temperature_c: { min: 30, max: 45 },
} as const;
