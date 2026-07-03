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
import { CXR_ACCEPT, CXR_MAX_BYTES, validateCxrFile } from "@/lib/integration";
import { cxrService } from "@/services/cxr.service";
import { JagaApiError } from "@/services/api-error";
import { usePrismaStore } from "@/store/prisma.store";

const FILE_ERRORS = {
  UNSUPPORTED_MEDIA_TYPE: "Choose a PNG or JPEG image.",
  PAYLOAD_TOO_LARGE: `The image must be no larger than ${CXR_MAX_BYTES / 1024 / 1024} MiB.`,
  INVALID_CXR_SOURCE: "The image could not be decoded. Choose a valid digital CXR export.",
};

export function CxrScreen() {
  const router = useRouter();
  const image = usePrismaStore((state) => state.image);
  const setImage = usePrismaStore((state) => state.setImage);
  const setResult = usePrismaStore((state) => state.setResult);
  const setSubmitState = usePrismaStore((state) => state.setSubmitState);
  const [confirmed, setConfirmed] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!image || !confirmed) throw new Error("Select and confirm a digital CXR export.");
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

  // MODEL_UNAVAILABLE + retryable:false means the Prisma model is not wired yet
  // (distinct from transient/network failures which fall back to retryable:true).
  const submitError = mutation.error;
  const modelUnavailable =
    submitError instanceof JagaApiError &&
    submitError.detail.code === "MODEL_UNAVAILABLE" &&
    submitError.detail.retryable === false;

  async function selectFile(file: File | undefined) {
    setFileError(null);
    setImage(null);
    if (!file) return;
    const validation = await validateCxrFile(file);
    if (!validation.ok) {
      setFileError(FILE_ERRORS[validation.code]);
      return;
    }
    setImage(file);
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-serif text-2xl font-semibold">Upload a chest X-ray</h1>
      <p className="text-ink-muted">
        Prisma accepts one digital chest X-ray export. It produces a separate research estimate and
        is not combined with the cough result.
      </p>

      <Field data-invalid={!!fileError}>
        <FieldLabel htmlFor="cxr-image">Digital CXR image</FieldLabel>
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
          <FieldDescription id="cxr-image-description">PNG or JPEG, up to 10 MiB.</FieldDescription>
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
          I confirm this is a digital CXR export, not a photo of a screen or film.
        </FieldLabel>
      </Field>

      {mutation.isError && (
        <Alert variant={modelUnavailable ? "warning" : "destructive"}>
          <AlertTitle>
            {modelUnavailable ? "Prisma analysis is not available yet" : "Prisma submission failed"}
          </AlertTitle>
          <AlertDescription>
            {modelUnavailable
              ? "The chest X-ray model is still being prepared, so no result can be produced yet. Your image is kept — continue with the standard clinical pathway."
              : "The selected image remains available. Try again."}
          </AlertDescription>
        </Alert>
      )}

      <Button
        disabled={!image || !confirmed || mutation.isPending || modelUnavailable}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending && <Spinner />}
        Submit for Prisma analysis
      </Button>
    </div>
  );
}
