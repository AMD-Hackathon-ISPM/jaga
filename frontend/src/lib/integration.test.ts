import { describe, expect, it, vi } from "vitest";

import {
  createAssistantRequest,
  createTriageFormData,
  validateCxrFile,
} from "@/lib/integration";

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

describe("integration request builders", () => {
  it("serializes the signed Gema multipart names and a single cough file", async () => {
    const cough = new File(["cough-audio"], "cough.webm", { type: "audio/webm" });

    const form = createTriageFormData({ clinical, cough });

    expect(form.get("contract_version")).toBe("triage-v1");
    expect(form.get("schema_version")).toBe("clinical-v1");
    const clinicalPart = form.get("clinical") as File;
    expect(clinicalPart.type).toBe("application/json");
    expect(JSON.parse(await clinicalPart.text())).toEqual(clinical);
    const coughPart = form.get("cough");
    expect(coughPart).toBeInstanceOf(File);
    expect((coughPart as File).name).toBe("cough.webm");
    expect((coughPart as File).type).toBe("audio/webm");
  });

  it("throws when the cough file is missing", () => {
    expect(() =>
      createTriageFormData({ clinical, cough: undefined as unknown as File }),
    ).toThrow("cough recording file is required");
  });

  it("accepts a decodable PNG digital export", async () => {
    const decode = vi.fn().mockResolvedValue(undefined);
    const file = new File(["png"], "digital-cxr.png", { type: "image/png" });

    await expect(validateCxrFile(file, decode)).resolves.toEqual({ ok: true });
    expect(decode).toHaveBeenCalledWith(file);
  });

  it("rejects unsupported and oversized CXR files before decoding", async () => {
    const decode = vi.fn().mockResolvedValue(undefined);
    const dicom = new File(["dcm"], "scan.dcm", { type: "application/dicom" });
    const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "scan.png", {
      type: "image/png",
    });

    await expect(validateCxrFile(dicom, decode)).resolves.toEqual({
      ok: false,
      code: "UNSUPPORTED_MEDIA_TYPE",
    });
    await expect(validateCxrFile(oversized, decode)).resolves.toEqual({
      ok: false,
      code: "PAYLOAD_TOO_LARGE",
    });
    expect(decode).not.toHaveBeenCalled();
  });

  it("builds bounded assistant requests without patient values", () => {
    const messages = Array.from({ length: 10 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `message ${index}`,
    }));

    const request = createAssistantRequest({
      locale: "en",
      screen: "clinical",
      fieldKey: "cough_duration_days",
      messages,
    });

    expect(request.messages).toHaveLength(8);
    expect(request.messages[0].content).toBe("message 2");
    expect(request).not.toHaveProperty("clinical");
    expect(request).not.toHaveProperty("result");
  });

  it("rejects assistant messages over 500 characters", () => {
    expect(() =>
      createAssistantRequest({
        locale: "en",
        screen: "clinical",
        messages: [{ role: "user", content: "x".repeat(501) }],
      }),
    ).toThrow("500 characters");
  });
});
