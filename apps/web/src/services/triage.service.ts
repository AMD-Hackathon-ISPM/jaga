/**
 * Gema triage service — PLACEHOLDER ONLY.
 *
 * `POST /api/v1/triage` is unsigned (ARCH-1). No URL, no multipart assembly,
 * no calls here. Returns never until the contract lands.
 */
import type { TriageRequest } from "@/types";

export const triageService = {
  async submitTriage(_payload: TriageRequest): Promise<never> {
    throw new Error("API not connected yet");
  },
};
