type IntegrationEnvironment = Partial<
  Record<
    | "NODE_ENV"
    | "NEXT_PUBLIC_API_BASE_URL"
    | "NEXT_PUBLIC_APP_ENV"
    | "NEXT_PUBLIC_API_MODE"
    | "NEXT_PUBLIC_ENABLE_ASSISTANT"
    | "NEXT_PUBLIC_ENABLE_PRISMA",
    string
  >
>;

function parseFlag(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return value === "true";
}

export function getIntegrationConfig(env: IntegrationEnvironment) {
  const production = env.NODE_ENV === "production";
  const apiMode = env.NEXT_PUBLIC_API_MODE ?? (production ? "live" : "fixture");

  if (apiMode !== "fixture" && apiMode !== "live") {
    throw new Error("NEXT_PUBLIC_API_MODE must be fixture or live.");
  }
  if (production && apiMode === "fixture") {
    throw new Error("Fixture API mode is not allowed in production.");
  }

  return {
    apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL ?? "",
    appEnv: env.NEXT_PUBLIC_APP_ENV ?? "development",
    apiMode,
    enableAssistant: parseFlag(env.NEXT_PUBLIC_ENABLE_ASSISTANT, true),
    enablePrisma: parseFlag(env.NEXT_PUBLIC_ENABLE_PRISMA, true),
    sessionTimeoutMs: 15 * 60 * 1000,
  } as const;
}

export const config = getIntegrationConfig({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_API_MODE: process.env.NEXT_PUBLIC_API_MODE,
  NEXT_PUBLIC_ENABLE_ASSISTANT: process.env.NEXT_PUBLIC_ENABLE_ASSISTANT,
  NEXT_PUBLIC_ENABLE_PRISMA: process.env.NEXT_PUBLIC_ENABLE_PRISMA,
});
