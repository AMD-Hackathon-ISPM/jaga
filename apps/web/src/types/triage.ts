/**
 * Gema triage result types — PROVISIONAL.
 *
 * The `POST /api/v1/triage` contract is NOT signed yet (gated on Daffa's
 * ARCH-1, see project-architecture.md §6). These shapes are inferred from
 * design-guidelines.md §3.3/§8 ONLY to let the UI compile against mock data.
 * Replace with the machine-validated contract once ARCH-1 lands. Do not treat
 * any field here as final, and do not invent endpoint URLs around it.
 */
import type { PatientIntakeRequest } from "./patient";

/** Relative urgency band (design §4.4). Color is never the sole signal. */
export type RiskBand = "lower" | "intermediate" | "higher";

/** Per-cough quality outcome from the quality gate (design §3.3). */
export type CoughQuality = "accepted" | "retryable" | "system_error";

export interface CoughAttemptResult {
  index: number; // 1..5
  quality: CoughQuality;
  /** Reason-code key for retryable failures; resolved to copy via the string bundle. */
  reasonCode?: string;
}

/** Calibrated estimate. Shown only when calibration metadata is present (PRD-06). */
export interface TriageEstimate {
  probability: number; // 0..1
  band: RiskBand;
  calibrated: boolean;
  calibrationStatus: string;
}

export interface ModelMetadata {
  modelVersion: string;
  contractVersion: string;
  schemaVersion: string;
  cohort: string;
  limitations: string[];
}

/** Provisional triage request payload (multipart in practice: clinical + 5 audio). */
export interface TriageRequest {
  clinical: PatientIntakeRequest;
  /** Five decoded cough buffers in practice; placeholder reference only here. */
  coughs: unknown[];
}

export interface TriageResult {
  requestId: string;
  quality: CoughAttemptResult[];
  estimate: TriageEstimate | null; // null = withheld (failure policy §12)
  /** Always present, identical across bands (design §8 locked hierarchy). */
  mandatoryNextStep: string;
  metadata: ModelMetadata;
  /** Optional non-causal inspection artifact reference. */
  inspection?: {
    spectrogramUrl?: string;
    available: boolean;
    label: string; // "model inspection; not a clinical explanation"
  };
}
