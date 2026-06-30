/**
 * Patient intake service — PLACEHOLDER ONLY.
 *
 * The live backend route is `POST /api/v1/patient/intake` (validate/normalize,
 * no persistence). The URL is deliberately NOT written here. When ARCH-1 is
 * signed, wire this through `http` (lib/http.ts).
 */
import type { PatientIntakeRequest } from "@/types";

export const patientService = {
  async submitIntake(_payload: PatientIntakeRequest): Promise<never> {
    throw new Error("API not connected yet");
  },
};
