import { describe, expect, it } from "vitest";

import assistant from "@/contracts/fixtures/assistant.json";
import cxr from "@/contracts/fixtures/cxr-result.json";
import error from "@/contracts/fixtures/error.json";
import gema from "@/contracts/fixtures/gema-result.json";
import status from "@/contracts/fixtures/status.json";
import {
  apiErrorSchema,
  assistantResponseSchema,
  cxrResultSchema,
  gemaResultSchema,
  serviceStatusSchema,
} from "@/contracts/api";

describe("synthetic contract fixtures", () => {
  it("parses every fixture through its wire schema", () => {
    expect(serviceStatusSchema.parse(status).capabilities.assistant.ready).toBe(true);
    expect(gemaResultSchema.parse(gema).signal).toBe("gema");
    expect(cxrResultSchema.parse(cxr).signal).toBe("prisma");
    expect(assistantResponseSchema.parse(assistant).contract_version).toBe("assistant-v1");
    expect(apiErrorSchema.parse(error).code).toBe("MODEL_UNAVAILABLE");
  });

  it("labels model fixtures as synthetic", () => {
    expect(gema.metadata.limitations.join(" ").toLowerCase()).toContain("synthetic");
    expect(cxr.metadata.limitations.join(" ").toLowerCase()).toContain("synthetic");
  });
});
