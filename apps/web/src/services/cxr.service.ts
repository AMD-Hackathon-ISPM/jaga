/**
 * Prisma digital-CXR service — PLACEHOLDER ONLY.
 *
 * `POST /api/v1/cxr` is a SEPARATE, unsigned signal (ARCH-1). Never fused with
 * triage. No URL, no calls here.
 */
export const cxrService = {
  async submitCxr(_image: unknown): Promise<never> {
    throw new Error("API not connected yet");
  },
};
