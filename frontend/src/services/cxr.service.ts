import cxrFixture from "@/contracts/fixtures/cxr-result.json";
import { cxrResultSchema, type CxrWireResult } from "@/contracts/api";
import { config } from "@/lib/config";
import { http } from "@/lib/http";
import { createCxrFormData } from "@/lib/integration";
import type { CxrResult } from "@/types";
import { toJagaApiError } from "./api-error";
import type { ServiceFactoryOptions } from "./transport";

function mapCxrResult(result: CxrWireResult): CxrResult {
  return {
    requestId: result.request_id,
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
      cohort: result.metadata.cohort,
      limitations: result.metadata.limitations,
    },
    inspection: result.inspection
      ? {
          gradcamUrl: result.inspection.url,
          available: result.inspection.available,
          label: result.inspection.label,
        }
      : undefined,
  };
}

export function createCxrService({ mode, client }: ServiceFactoryOptions) {
  return {
    async submitCxr(
      image: File,
      options: { signal?: AbortSignal; onUploadProgress?: (progress: number) => void } = {},
    ): Promise<CxrResult> {
      const form = createCxrFormData(image);
      if (mode === "fixture") {
        options.onUploadProgress?.(1);
        return mapCxrResult(cxrResultSchema.parse(cxrFixture));
      }

      try {
        const response = await client.post("/api/v1/cxr", form, {
          signal: options.signal,
          timeout: 120_000,
          onUploadProgress: (event) => {
            if (event.total) options.onUploadProgress?.(event.loaded / event.total);
          },
        });
        return mapCxrResult(cxrResultSchema.parse(response.data));
      } catch (error) {
        throw toJagaApiError(error, "Prisma is temporarily unavailable.");
      }
    },
  };
}

export const cxrService = createCxrService({ mode: config.apiMode, client: http });
