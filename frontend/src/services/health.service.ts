/**
 * Health/status service — PLACEHOLDER ONLY.
 *
 * The Go API exposes GET /health, /healthz, /api/v1/status. URLs are not wired
 * here yet; this is scaffolding for a future readiness check.
 */
export const healthService = {
  async checkHealth(): Promise<never> {
    throw new Error("API not connected yet");
  },
  async checkReadiness(): Promise<never> {
    throw new Error("API not connected yet");
  },
};
