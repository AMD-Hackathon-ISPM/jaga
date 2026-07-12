import gemaFixture from "@/contracts/fixtures/gema-result.json";
import { gemaResultSchema, type GemaWireResult } from "@/contracts/api";
import { config } from "@/lib/config";
import { http } from "@/lib/http";
import { createTriageFormData } from "@/lib/integration";
import type { PatientIntakeRequest, TriageResult } from "@/types";
import { toJagaApiError } from "./api-error";
import type { ServiceFactoryOptions } from "./transport";

function mapGemaResult(result: GemaWireResult): TriageResult {
  return {
    requestId: result.request_id,
    quality: result.quality.map((attempt) => ({
      index: attempt.index,
      quality: attempt.quality,
      reasonCode: attempt.reason_code,
    })),
    estimate: result.estimate
      ? {
          probability: result.estimate.probability,
          band: result.estimate.band,
          calibrated: result.estimate.calibrated,
          calibrationStatus: result.estimate.calibration_status,
        }
      : null,
    mandatoryNextStep: result.mandatory_next_step,
    metadata: {
      modelVersion: result.metadata.model_version,
      contractVersion: result.metadata.contract_version,
      schemaVersion: result.metadata.schema_version,
      cohort: result.metadata.cohort,
      limitations: result.metadata.limitations,
    },
    detectedCoughs: result.detected_coughs,
    inspection: result.inspection
      ? {
          spectrogramUrl: result.inspection.url,
          available: result.inspection.available,
          label: result.inspection.label,
        }
      : undefined,
  };
}

export function createTriageService({ mode, client }: ServiceFactoryOptions) {
  return {
    async submitTriage(
      payload: { clinical: PatientIntakeRequest; cough: File },
      options: { signal?: AbortSignal; onUploadProgress?: (progress: number) => void } = {},
    ): Promise<TriageResult> {
      const form = createTriageFormData(payload);
      if (mode === "fixture") {
        options.onUploadProgress?.(1);
        return mapGemaResult(gemaResultSchema.parse(gemaFixture));
      }

      try {
        const response = await client.post("/api/v1/triage", form, {
          signal: options.signal,
          timeout: 120_000,
          onUploadProgress: (event) => {
            if (event.total) options.onUploadProgress?.(event.loaded / event.total);
          },
        });
        return mapGemaResult(gemaResultSchema.parse(response.data));
      } catch (error) {
        throw toJagaApiError(error, "Gema is temporarily unavailable.");
      }
    },
  };
}

export const triageService = createTriageService({ mode: config.apiMode, client: http });
