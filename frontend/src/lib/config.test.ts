import { describe, expect, it } from "vitest";

import { getIntegrationConfig } from "@/lib/config";

describe("integration configuration", () => {
  it("defaults development to labelled fixtures", () => {
    expect(getIntegrationConfig({ NODE_ENV: "development" }).apiMode).toBe("fixture");
  });

  it("rejects fixture mode in production", () => {
    expect(() =>
      getIntegrationConfig({ NODE_ENV: "production", NEXT_PUBLIC_API_MODE: "fixture" }),
    ).toThrow("Fixture API mode is not allowed in production");
  });

  it("parses capability flags explicitly", () => {
    expect(
      getIntegrationConfig({
        NODE_ENV: "development",
        NEXT_PUBLIC_API_MODE: "live",
        NEXT_PUBLIC_ENABLE_ASSISTANT: "true",
        NEXT_PUBLIC_ENABLE_PRISMA: "false",
      }),
    ).toMatchObject({ apiMode: "live", enableAssistant: true, enablePrisma: false });
  });
});
