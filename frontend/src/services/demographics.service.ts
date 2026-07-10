import { demographicsErrorSchema, demographicsSchema, demographicsSuccessSchema } from "@/contracts/api";
import { config } from "@/lib/config";
import { http } from "@/lib/http";
import type { ServiceFactoryOptions } from "./transport";

export interface Demographics {
  ageYears: number;
  sexAtBirth: "male" | "female";
  heightCm: number;
  weightKg: number;
}

export class DemographicsValidationError extends Error {
  readonly errors: Array<{ field: string; message: string }>;

  constructor(errors: Array<{ field: string; message: string }>) {
    super("Demographics validation failed.");
    this.name = "DemographicsValidationError";
    this.errors = errors;
  }
}

export function createDemographicsService({ mode, client }: ServiceFactoryOptions) {
  return {
    async submit(payload: Demographics, signal?: AbortSignal): Promise<Demographics> {
      if (mode === "fixture") return demographicsSchema.parse(payload);

      try {
        const response = await client.post("/api/v1/demographics", payload, {
          signal,
          timeout: 15_000,
        });
        return demographicsSuccessSchema.parse(response.data).demographics;
      } catch (error) {
        const data =
          typeof error === "object" && error !== null && "response" in error
            ? (error as { response?: { data?: unknown } }).response?.data
            : undefined;
        const parsed = demographicsErrorSchema.safeParse(data);
        if (parsed.success) throw new DemographicsValidationError(parsed.data.errors);
        throw error;
      }
    },
  };
}

export const demographicsService = createDemographicsService({ mode: config.apiMode, client: http });
