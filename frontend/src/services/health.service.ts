import statusFixture from "@/contracts/fixtures/status.json";
import { serviceStatusSchema, type ServiceStatus } from "@/contracts/api";
import { config } from "@/lib/config";
import { http } from "@/lib/http";
import { toJagaApiError } from "./api-error";
import type { ServiceFactoryOptions } from "./transport";

export function createHealthService({ mode, client }: ServiceFactoryOptions) {
  return {
    async checkHealth(signal?: AbortSignal): Promise<boolean> {
      if (mode === "fixture") return true;
      try {
        await client.get("/healthz", { signal, timeout: 10_000 });
        return true;
      } catch (error) {
        throw toJagaApiError(error, "The Jaga API is unavailable.");
      }
    },
    async checkReadiness(signal?: AbortSignal): Promise<ServiceStatus> {
      if (mode === "fixture") return serviceStatusSchema.parse(statusFixture);
      try {
        const response = await client.get("/api/v1/status", { signal, timeout: 10_000 });
        return serviceStatusSchema.parse(response.data);
      } catch (error) {
        throw toJagaApiError(error, "Backend capabilities are unavailable.");
      }
    },
  };
}

export const healthService = createHealthService({ mode: config.apiMode, client: http });
