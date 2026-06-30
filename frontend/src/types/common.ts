/** Cross-cutting shared types. */

/** Default English; one-tap Bahasa Indonesia (design §10). */
export type Language = "en" | "id";

/** Fixed logical steps of the single-session flow (design §3). */
export type FlowStep = "gate" | "clinical" | "coughs" | "review" | "result";

/** Submission lifecycle (design §3.2 state machine). */
export type SubmitState =
  | "idle"
  | "preparing"
  | "uploading"
  | "processing"
  | "success"
  | "retryable_error"
  | "terminal_error";

export interface SessionMeta {
  /** Server-issued request id; cleared on reset/timeout (PRD-08). */
  requestId: string | null;
  /** FE schema version negotiated with BE (architecture §1.5). */
  schemaVersion: string;
}
