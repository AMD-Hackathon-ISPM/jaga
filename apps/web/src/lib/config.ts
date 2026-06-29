/**
 * Runtime config. The API base is intentionally empty until the triage/cxr
 * contracts are signed (ARCH-1). Nothing in the app should build a URL yet.
 */
export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  appEnv: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
  /** Idle timeout before reset (design §3.2; pin on ARCH-2). */
  sessionTimeoutMs: 15 * 60 * 1000,
} as const;
