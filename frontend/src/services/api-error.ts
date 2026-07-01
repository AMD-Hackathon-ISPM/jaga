import { apiErrorSchema, type ApiError } from "@/contracts/api";

export class JagaApiError extends Error {
  readonly detail: ApiError;

  constructor(detail: ApiError) {
    super(detail.message);
    this.name = "JagaApiError";
    this.detail = detail;
  }
}

export function toJagaApiError(error: unknown, fallbackMessage: string) {
  const data =
    typeof error === "object" && error !== null && "response" in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined;
  const parsed = apiErrorSchema.safeParse(data);
  if (parsed.success) return new JagaApiError(parsed.data);

  return new JagaApiError({
    code: "MODEL_UNAVAILABLE",
    message: fallbackMessage,
    request_id: "unavailable",
    retryable: true,
  });
}
