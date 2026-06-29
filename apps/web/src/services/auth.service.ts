/**
 * Auth service — PLACEHOLDER ONLY.
 *
 * The MVP triage flow is single-session and has NO user accounts. The backend
 * has no auth middleware; the demo auth/no-auth decision is still open
 * (architecture §8). These functions exist only as scaffolding for a possible
 * future operator/demo gate. They never call an endpoint.
 */
export const authService = {
  async login(): Promise<never> {
    throw new Error("API not connected yet");
  },
  async logout(): Promise<never> {
    throw new Error("API not connected yet");
  },
  async getSession(): Promise<never> {
    throw new Error("API not connected yet");
  },
};
