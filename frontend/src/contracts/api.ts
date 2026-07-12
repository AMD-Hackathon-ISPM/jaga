import { z } from "zod";

const capabilitySchema = z.object({
  ready: z.boolean(),
  contract_version: z.string().min(1),
});

export const serviceStatusSchema = z.object({
  service: z.string().min(1),
  python_project_root: z.string().optional(),
  ready: z.boolean(),
  capabilities: z.object({
    patient_intake: capabilitySchema,
    gema: capabilitySchema,
    prisma: capabilitySchema,
    assistant: capabilitySchema,
  }),
});

export const apiErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "CONTRACT_MISMATCH",
  "UNSUPPORTED_MEDIA_TYPE",
  "PAYLOAD_TOO_LARGE",
  "COUGH_QUALITY_REJECTED",
  "INVALID_CXR_SOURCE",
  "MODEL_UNAVAILABLE",
  "UPSTREAM_TIMEOUT",
]);

export const apiErrorSchema = z.object({
  code: apiErrorCodeSchema,
  message: z.string().min(1),
  request_id: z.string().min(1),
  retryable: z.boolean(),
  field_errors: z
    .array(z.object({ field: z.string().min(1), message: z.string().min(1) }))
    .optional(),
  attempt_errors: z
    .array(z.object({ index: z.number().int().min(1).max(1), reason_code: z.string().min(1) }))
    .optional(),
});

export const patientIntakeSchema = z.object({
  age_years: z.number().int(),
  sex_at_birth: z.enum(["male", "female"]),
  height_cm: z.number(),
  weight_kg: z.number(),
  cough_duration_days: z.number().int(),
  prior_tb: z.boolean(),
  hemoptysis: z.boolean(),
  heart_rate_bpm: z.number().int().nullable().optional(),
  temperature_c: z.number().nullable().optional(),
  smoked_last_7_days: z.boolean(),
  fever_last_30_days: z.boolean(),
  night_sweats_last_30_days: z.boolean(),
  weight_loss_last_30_days: z.boolean(),
});

export const patientIntakeSuccessSchema = z.object({
  status: z.literal("validated"),
  patient: patientIntakeSchema,
});

export const patientIntakeErrorSchema = z.object({
  status: z.literal("invalid"),
  errors: z.array(z.object({ field: z.string(), message: z.string() })),
});

export const demographicsSchema = z.object({
  ageYears: z.number().int().min(18).max(120),
  sexAtBirth: z.enum(["male", "female"]),
  heightCm: z.number().min(40).max(260),
  weightKg: z.number().min(1).max(350),
});

export const demographicsSuccessSchema = z.object({
  status: z.literal("validated"),
  demographics: demographicsSchema,
});

export const demographicsErrorSchema = z.object({
  status: z.literal("invalid"),
  errors: z.array(z.object({ field: z.string(), message: z.string() })),
});

const riskBandSchema = z.enum(["lower", "intermediate", "higher"]);

const estimateSchema = z.object({
  probability: z.number().min(0).max(1),
  band: riskBandSchema,
  calibrated: z.literal(true),
  calibration_status: z.string().min(1),
});

const inspectionSchema = z.object({
  url: z.string().url().optional(),
  available: z.boolean(),
  label: z.string().min(1),
});

export const gemaResultSchema = z.object({
  request_id: z.string().min(1),
  signal: z.literal("gema"),
  contract_version: z.literal("triage-v1"),
  schema_version: z.literal("clinical-v1"),
  quality: z
    .array(
      z.object({
        index: z.number().int().min(1).max(1),
        quality: z.enum(["accepted", "retryable", "system_error"]),
        reason_code: z.string().optional(),
      }),
    )
    .length(1),
  estimate: estimateSchema.nullable(),
  mandatory_next_step: z.string().min(1),
  metadata: z.object({
    model_version: z.string().min(1),
    contract_version: z.literal("triage-v1"),
    schema_version: z.literal("clinical-v1"),
    cohort: z.string().min(1),
    limitations: z.array(z.string().min(1)),
  }),
  inspection: inspectionSchema.optional(),
  detected_coughs: z.number().int().min(0).optional(),
});

export const cxrResultSchema = z.object({
  request_id: z.string().min(1),
  signal: z.literal("prisma"),
  contract_version: z.literal("cxr-v1"),
  schema_version: z.literal("cxr-image-v1"),
  estimate: estimateSchema.nullable(),
  mandatory_next_step: z.string().min(1),
  metadata: z.object({
    model_version: z.string().min(1),
    contract_version: z.literal("cxr-v1"),
    cohort: z.string().min(1),
    limitations: z.array(z.string().min(1)),
  }),
  inspection: inspectionSchema.optional(),
});

export const assistantRoleSchema = z.enum(["user", "assistant"]);
export const assistantScreenSchema = z.enum([
  "gate",
  "clinical",
  "coughs",
  "review",
  "result",
  "cxr",
  "cxr_result",
]);

export const assistantRequestSchema = z.object({
  contract_version: z.literal("assistant-v1"),
  locale: z.enum(["en", "id"]),
  screen: assistantScreenSchema,
  field_key: z.string().min(1).optional(),
  messages: z
    .array(z.object({ role: assistantRoleSchema, content: z.string().min(1).max(500) }))
    .min(1)
    .max(8),
});

export const assistantResponseSchema = z.object({
  request_id: z.string().min(1),
  reply: z.string().min(1),
  disposition: z.enum(["answer", "safety_redirect"]),
  provider: z.string().min(1),
  model: z.string().min(1),
  contract_version: z.literal("assistant-v1"),
});

export type ServiceStatus = z.infer<typeof serviceStatusSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type GemaWireResult = z.infer<typeof gemaResultSchema>;
export type CxrWireResult = z.infer<typeof cxrResultSchema>;
export type AssistantRequest = z.infer<typeof assistantRequestSchema>;
export type AssistantResponse = z.infer<typeof assistantResponseSchema>;
export type AssistantScreen = z.infer<typeof assistantScreenSchema>;
