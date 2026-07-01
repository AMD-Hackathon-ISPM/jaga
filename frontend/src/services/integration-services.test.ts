import { describe, expect, it, vi } from "vitest";

import type { AssistantRequest } from "@/contracts/api";
import { createAssistantService } from "@/services/assistant.service";
import { createCxrService } from "@/services/cxr.service";
import { createHealthService } from "@/services/health.service";
import { createPatientService, PatientValidationError } from "@/services/patient.service";
import { createTriageService } from "@/services/triage.service";

const clinical = {
  age_years: 35,
  sex_at_birth: "female" as const,
  height_cm: 165,
  weight_kg: 60,
  cough_duration_days: 14,
  prior_tb: false,
  hemoptysis: false,
  heart_rate_bpm: null,
  temperature_c: null,
  smoked_last_7_days: false,
  fever_last_30_days: true,
  night_sweats_last_30_days: true,
  weight_loss_last_30_days: false,
};

function fakeClient() {
  return {
    get: vi.fn(),
    post: vi.fn(),
  };
}

describe("backend integration services", () => {
  it("reads backend capability readiness", async () => {
    const client = fakeClient();
    const status = (await import("@/contracts/fixtures/status.json")).default;
    client.get.mockResolvedValue({ data: status });

    await expect(createHealthService({ mode: "live", client }).checkReadiness()).resolves.toEqual(status);
    expect(client.get).toHaveBeenCalledWith("/api/v1/status", expect.objectContaining({ timeout: 10_000 }));
  });

  it("posts patient intake and returns normalized server values", async () => {
    const client = fakeClient();
    client.post.mockResolvedValue({ data: { status: "validated", patient: clinical } });
    const service = createPatientService({ mode: "live", client });

    await expect(service.submitIntake(clinical)).resolves.toEqual(clinical);
    expect(client.post).toHaveBeenCalledWith(
      "/api/v1/patient/intake",
      clinical,
      expect.objectContaining({ timeout: 15_000 }),
    );
  });

  it("turns patient field errors into a typed validation error", async () => {
    const client = fakeClient();
    client.post.mockRejectedValue({
      response: {
        data: {
          status: "invalid",
          errors: [{ field: "age_years", message: "must be at least 18" }],
        },
      },
    });
    const service = createPatientService({ mode: "live", client });

    const error = await service.submitIntake(clinical).catch((reason) => reason);
    expect(error).toBeInstanceOf(PatientValidationError);
    expect(error.errors).toEqual([{ field: "age_years", message: "must be at least 18" }]);
  });

  it("submits Gema and Prisma to separate endpoints", async () => {
    const client = fakeClient();
    const gemaFixture = (await import("@/contracts/fixtures/gema-result.json")).default;
    const cxrFixture = (await import("@/contracts/fixtures/cxr-result.json")).default;
    client.post.mockResolvedValueOnce({ data: gemaFixture }).mockResolvedValueOnce({ data: cxrFixture });

    const coughs = Array.from(
      { length: 5 },
      (_, index) => new File([String(index)], `cough-${index + 1}.webm`, { type: "audio/webm" }),
    );
    const image = new File(["png"], "cxr.png", { type: "image/png" });

    await createTriageService({ mode: "live", client }).submitTriage({ clinical, coughs });
    await createCxrService({ mode: "live", client }).submitCxr(image);

    expect(client.post.mock.calls[0][0]).toBe("/api/v1/triage");
    expect(client.post.mock.calls[1][0]).toBe("/api/v1/cxr");
  });

  it("returns a deterministic safety redirect in assistant fixture mode", async () => {
    const client = fakeClient();
    const request: AssistantRequest = {
      contract_version: "assistant-v1",
      locale: "en",
      screen: "clinical",
      messages: [{ role: "user", content: "Do I have TB and what medicine should I take?" }],
    };

    const response = await createAssistantService({ mode: "fixture", client }).send(request);

    expect(response.disposition).toBe("safety_redirect");
    expect(response.reply).toContain("cannot diagnose");
    expect(client.post).not.toHaveBeenCalled();
  });
});
