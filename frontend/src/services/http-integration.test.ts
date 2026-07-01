import axios from "axios";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createPatientService } from "./patient.service";

const patient = {
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
  night_sweats_last_30_days: false,
  weight_loss_last_30_days: false,
};

const server = setupServer(
  http.post("http://localhost/api/v1/patient/intake", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ status: "validated", patient: body });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("live HTTP adapter", () => {
  it("sends the signed snake_case intake without component coupling", async () => {
    const client = axios.create({ baseURL: "http://localhost" });
    const service = createPatientService({ mode: "live", client });
    await expect(service.submitIntake(patient)).resolves.toEqual(patient);
  });
});
