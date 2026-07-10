import { assistantRequestSchema, type AssistantRequest, type AssistantScreen } from "@/contracts/api";
import type { Language, PatientIntakeRequest } from "@/types";

export const CXR_MAX_BYTES = 10 * 1024 * 1024;
export const CXR_ACCEPT = "image/png,image/jpeg";

const CXR_TYPES = new Set(["image/png", "image/jpeg"]);
const CXR_EXTENSIONS = new Set(["png", "jpg", "jpeg"]);

export function createTriageFormData({
  clinical,
  cough,
}: {
  clinical: PatientIntakeRequest;
  cough: File;
}) {
  if (!cough) {
    throw new Error("A cough recording file is required.");
  }

  const form = new FormData();
  form.set("contract_version", "triage-v1");
  form.set("schema_version", "clinical-v1");
  form.set(
    "clinical",
    new Blob([JSON.stringify(clinical)], { type: "application/json" }),
    "clinical.json",
  );
  form.set("cough", cough);
  return form;
}

export function createCxrFormData(file: File) {
  const form = new FormData();
  form.set("contract_version", "cxr-v1");
  form.set("schema_version", "cxr-image-v1");
  form.set("source_type", "digital_export");
  form.set("image", file);
  return form;
}

async function decodeBrowserImage(file: File) {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    bitmap.close();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image decode failed."));
    };
    image.src = url;
  });
}

export async function validateCxrFile(
  file: File,
  decode: (file: File) => Promise<void> = decodeBrowserImage,
): Promise<
  | { ok: true }
  | { ok: false; code: "UNSUPPORTED_MEDIA_TYPE" | "PAYLOAD_TOO_LARGE" | "INVALID_CXR_SOURCE" }
> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!CXR_TYPES.has(file.type) || !CXR_EXTENSIONS.has(extension)) {
    return { ok: false, code: "UNSUPPORTED_MEDIA_TYPE" };
  }
  if (file.size > CXR_MAX_BYTES) {
    return { ok: false, code: "PAYLOAD_TOO_LARGE" };
  }
  try {
    await decode(file);
    return { ok: true };
  } catch {
    return { ok: false, code: "INVALID_CXR_SOURCE" };
  }
}

export function createAssistantRequest({
  locale,
  screen,
  fieldKey,
  messages,
}: {
  locale: Language;
  screen: AssistantScreen;
  fieldKey?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}): AssistantRequest {
  if (messages.some((message) => message.content.length > 500)) {
    throw new Error("Assistant messages are limited to 500 characters.");
  }

  return assistantRequestSchema.parse({
    contract_version: "assistant-v1",
    locale,
    screen,
    field_key: fieldKey,
    messages: messages.slice(-8),
  });
}
