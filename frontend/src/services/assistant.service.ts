import assistantFixture from "@/contracts/fixtures/assistant.json";
import {
  assistantRequestSchema,
  assistantResponseSchema,
  type AssistantRequest,
  type AssistantResponse,
} from "@/contracts/api";
import { config } from "@/lib/config";
import { http } from "@/lib/http";
import { toJagaApiError } from "./api-error";
import type { ServiceFactoryOptions } from "./transport";

const SAFETY_PATTERN = /\b(diagnos|do i have|positive|negative|treat|medicine|medication|drug|my risk)\b/i;

function fixtureResponse(request: AssistantRequest): AssistantResponse {
  const latest = request.messages.at(-1)?.content ?? "";
  if (SAFETY_PATTERN.test(latest)) {
    return {
      request_id: "synthetic-assistant-safety",
      reply:
        "I cannot diagnose TB, interpret an individual risk result, or recommend treatment. Please continue with the standard clinical pathway and confirmatory evaluation.",
      disposition: "safety_redirect",
      provider: "fixture",
      model: "deterministic-safety-redirect",
      contract_version: "assistant-v1",
    };
  }
  return assistantResponseSchema.parse(assistantFixture);
}

export function createAssistantService({ mode, client }: ServiceFactoryOptions) {
  return {
    async send(request: AssistantRequest, signal?: AbortSignal): Promise<AssistantResponse> {
      const payload = assistantRequestSchema.parse(request);
      if (mode === "fixture") return fixtureResponse(payload);

      try {
        const response = await client.post("/api/v1/assistant/messages", payload, {
          signal,
          timeout: 20_000,
        });
        return assistantResponseSchema.parse(response.data);
      } catch (error) {
        throw toJagaApiError(error, "The guidance assistant is temporarily unavailable.");
      }
    },
  };
}

export const assistantService = createAssistantService({ mode: config.apiMode, client: http });
