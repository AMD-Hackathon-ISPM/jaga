"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useT } from "@/hooks/use-t";
import { CXR_ACCEPT, CXR_MAX_BYTES, validateCxrFile } from "@/lib/integration";
import { cxrService } from "@/services/cxr.service";
import { isModelUnavailable } from "@/services/api-error";
import { usePrismaStore } from "@/store/prisma.store";

type FileErrorCode = "UNSUPPORTED_MEDIA_TYPE" | "PAYLOAD_TOO_LARGE" | "INVALID_CXR_SOURCE";

export function CxrScreen() {
  const t = useT();
  const router = useRouter();
  const image = usePrismaStore((state) => state.image);
  const setImage = usePrismaStore((state) => state.setImage);
  const setResult = usePrismaStore((state) => state.setResult);
  const setSubmitState = usePrismaStore((state) => state.setSubmitState);
  const [confirmed, setConfirmed] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const fileErrors: Record<FileErrorCode, string> = {
    UNSUPPORTED_MEDIA_TYPE: t("cxr.errors.unsupportedMedia"),
    PAYLOAD_TOO_LARGE: t("cxr.errors.payloadTooLarge").replace(
      "{maxMiB}",
      String(CXR_MAX_BYTES / 1024 / 1024),
    ),
    INVALID_CXR_SOURCE: t("cxr.errors.invalidSource"),
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!image || !confirmed) throw new Error(t("cxr.errors.missingSelection"));
      setSubmitState("uploading");
      return cxrService.submitCxr(image, {
        onUploadProgress: (progress) => setSubmitState(progress < 1 ? "uploading" : "processing"),
      });
    },
    onSuccess: (result) => {
      setResult(result);
      setSubmitState("success");
      router.push("/cxr/result");
    },
    onError: () => setSubmitState("retryable_error"),
  });

  const modelUnavailable = isModelUnavailable(mutation.error);

  async function selectFile(file: File | undefined) {
    setFileError(null);
    setImage(null);
    if (!file) return;
    const validation = await validateCxrFile(file);
    if (!validation.ok) {
      setFileError(fileErrors[validation.code]);
      return;
    }
    setImage(file);
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-2xl font-semibold">{t("cxr.title")}</h1>
      <p className="text-ink-muted">{t("cxr.lead")}</p>

      <Field data-invalid={!!fileError}>
        <FieldLabel htmlFor="cxr-image">{t("cxr.imageLabel")}</FieldLabel>
        <Input
          id="cxr-image"
          type="file"
          accept={CXR_ACCEPT}
          aria-invalid={!!fileError}
          aria-describedby={fileError ? "cxr-image-error" : "cxr-image-description"}
          onChange={(event) => void selectFile(event.target.files?.[0])}
        />
        {fileError ? (
          <FieldError id="cxr-image-error">{fileError}</FieldError>
        ) : (
          <FieldDescription id="cxr-image-description">{t("cxr.imageHint")}</FieldDescription>
        )}
      </Field>

      {image && <p className="font-mono text-sm text-ink-muted">{image.name}</p>}

      <Field orientation="horizontal">
        <Checkbox
          id="cxr-source"
          checked={confirmed}
          onCheckedChange={(checked) => setConfirmed(checked === true)}
        />
        <FieldLabel htmlFor="cxr-source" className="min-h-11">
          {t("cxr.confirmLabel")}
        </FieldLabel>
      </Field>

      {mutation.isError && (
        <Alert variant={modelUnavailable ? "warning" : "destructive"}>
          <AlertTitle>
            {modelUnavailable ? t("cxr.error.modelUnavailableTitle") : t("cxr.error.submitFailedTitle")}
          </AlertTitle>
          <AlertDescription>
            {modelUnavailable
              ? t("cxr.error.modelUnavailableBody")
              : t("cxr.error.submitFailedBody")}
          </AlertDescription>
        </Alert>
      )}

      <Button
        disabled={!image || !confirmed || mutation.isPending || modelUnavailable}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending && <Spinner />}
        {t("cxr.submit")}
      </Button>
    </div>
  );
}
