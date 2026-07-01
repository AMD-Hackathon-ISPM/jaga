import { patientIntakeErrorSchema, patientIntakeSchema, patientIntakeSuccessSchema } from "@/contracts/api";
import { config } from "@/lib/config";
import { http } from "@/lib/http";
import type { PatientIntake, PatientIntakeRequest, ValidationError } from "@/types";
import type { ServiceFactoryOptions } from "./transport";

export class PatientValidationError extends Error {
  readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super("Patient intake validation failed.");
    this.name = "PatientValidationError";
    this.errors = errors;
  }
}

export function createPatientService({ mode, client }: ServiceFactoryOptions) {
  return {
    async submitIntake(payload: PatientIntakeRequest, signal?: AbortSignal): Promise<PatientIntake> {
      if (mode === "fixture") {
        return patientIntakeSchema.parse(payload);
      }

      try {
        const response = await client.post("/api/v1/patient/intake", payload, {
          signal,
          timeout: 15_000,
        });
        return patientIntakeSuccessSchema.parse(response.data).patient;
      } catch (error) {
        const data =
          typeof error === "object" && error !== null && "response" in error
            ? (error as { response?: { data?: unknown } }).response?.data
            : undefined;
        const parsed = patientIntakeErrorSchema.safeParse(data);
        if (parsed.success) throw new PatientValidationError(parsed.data.errors);
        throw error;
      }
    },
  };
}

export const patientService = createPatientService({ mode: config.apiMode, client: http });
