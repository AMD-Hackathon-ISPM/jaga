import { describe, expect, it } from "vitest";

import {
  apiErrorSchema,
  assistantResponseSchema,
  cxrResultSchema,
  gemaResultSchema,
  serviceStatusSchema,
} from "@/contracts/api";

describe("backend contract schemas", () => {
  it("accepts versioned capability status", () => {
    expect(
      serviceStatusSchema.parse({
        service: "jaga-backend",
        python_project_root: "/models",
        ready: true,
        capabilities: {
          patient_intake: { ready: true, contract_version: "patient-v1" },
          gema: { ready: false, contract_version: "triage-v1" },
          prisma: { ready: false, contract_version: "cxr-v1" },
          assistant: { ready: false, contract_version: "assistant-v1" },
        },
      }).capabilities.patient_intake.ready,
    ).toBe(true);
  });

  it("rejects partial Gema estimates without calibration metadata", () => {
    expect(() =>
      gemaResultSchema.parse({
        request_id: "req-1",
        signal: "gema",
        contract_version: "triage-v1",
        schema_version: "clinical-v1",
        quality: [],
        estimate: { probability: 0.42, band: "intermediate", calibrated: true },
        mandatory_next_step: "Receive confirmatory evaluation.",
        metadata: {
          model_version: "gema-1",
          contract_version: "triage-v1",
          schema_version: "clinical-v1",
          cohort: "symptomatic adults 18+",
          limitations: [],
        },
      }),
    ).toThrow();
  });

  it("keeps Prisma results explicitly separate", () => {
    const result = cxrResultSchema.parse({
      request_id: "req-cxr-1",
      signal: "prisma",
      contract_version: "cxr-v1",
      schema_version: "cxr-image-v1",
      estimate: {
        probability: 0.31,
        band: "lower",
        calibrated: true,
        calibration_status: "calibrated",
      },
      mandatory_next_step: "Receive confirmatory evaluation.",
      metadata: {
        model_version: "prisma-1",
        contract_version: "cxr-v1",
        cohort: "digital CXR research cohort",
        limitations: ["Research estimate only."],
      },
    });

    expect(result.signal).toBe("prisma");
    expect(result).not.toHaveProperty("gema");
  });

  it("accepts structured assistant and API error responses", () => {
    expect(
      assistantResponseSchema.parse({
        request_id: "req-chat-1",
        reply: "I can explain what this field asks for.",
        disposition: "answer",
        provider: "featherless",
        model: "Qwen/Qwen2.5-7B-Instruct",
        contract_version: "assistant-v1",
      }).disposition,
    ).toBe("answer");

    expect(
      apiErrorSchema.parse({
        code: "MODEL_UNAVAILABLE",
        message: "The model is unavailable.",
        request_id: "req-error-1",
        retryable: true,
      }).retryable,
    ).toBe(true);
  });

  it("accepts a CXR inspection whose url is a PNG data URL", () => {
    const parsed = cxrResultSchema.parse({
      request_id: "prisma-1",
      signal: "prisma",
      contract_version: "cxr-v1",
      schema_version: "cxr-image-v1",
      estimate: {
        probability: 0.42,
        band: "intermediate",
        calibrated: true,
        calibration_status: "densenet121-clahe-v1",
      },
      mandatory_next_step: "Refer for radiological review.",
      metadata: {
        model_version: "prisma-densenet121-clahe-v1",
        contract_version: "cxr-v1",
        cohort: "tb-chest-radiography-clahe",
        limitations: ["Screening aid only; not a diagnostic test."],
      },
      inspection: {
        available: true,
        url: "data:image/png;base64,QUJD",
        label: "Model inspection; not a clinical explanation.",
      },
    });
    expect(parsed.inspection?.url).toMatch(/^data:image\/png;base64,/);
  });
});
