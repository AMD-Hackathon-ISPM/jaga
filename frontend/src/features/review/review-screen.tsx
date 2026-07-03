"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { clinicalSchema } from "@/features/clinical/clinical-schema";
import { triageService } from "@/services/triage.service";
import { JagaApiError } from "@/services/api-error";
import { useSessionStore } from "@/store/session.store";

export function ReviewScreen() {
  const router = useRouter();
  const clinical = useSessionStore((state) => state.clinical);
  const coughFiles = useSessionStore((state) => state.coughFiles);
  const setResult = useSessionStore((state) => state.setResult);
  const setSubmitState = useSessionStore((state) => state.setSubmitState);
  const parsedClinical = clinicalSchema.safeParse(clinical);
  const coughs = coughFiles.filter((file): file is File => file !== null);
  const ready = parsedClinical.success && coughs.length === 5;

  const mutation = useMutation({
    mutationFn: () => {
      if (!parsedClinical.success || coughs.length !== 5) {
        throw new Error("Complete the clinical form and five cough recordings first.");
      }
      setSubmitState("uploading");
      return triageService.submitTriage(
        { clinical: parsedClinical.data, coughs },
        { onUploadProgress: (progress) => setSubmitState(progress < 1 ? "uploading" : "processing") },
      );
    },
    onSuccess: (result) => {
      setResult(result);
      setSubmitState("success");
      router.push("/result");
    },
    onError: () => setSubmitState("retryable_error"),
  });

  // The backend returns MODEL_UNAVAILABLE + retryable:false while the Gema model
  // is not wired yet. Distinguish that from transient/network failures (which
  // fall back to retryable:true) so the copy is not misleadingly "try again".
  const submitError = mutation.error;
  const modelUnavailable =
    submitError instanceof JagaApiError &&
    submitError.detail.code === "MODEL_UNAVAILABLE" &&
    submitError.detail.retryable === false;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-2xl font-semibold">Review and submit</h1>

      <Card>
        <CardHeader>
          <CardTitle>Clinical inputs</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          {Object.entries(clinical).map(([key, value]) => (
            <div key={key}>
              <div className="text-ink-muted">{key}</div>
              <div className="font-mono tabular-nums">{String(value ?? "Not measured")}</div>
            </div>
          ))}
          {!parsedClinical.success && (
            <Alert variant="warning" className="col-span-2">
              <AlertTitle>Clinical inputs incomplete</AlertTitle>
              <AlertDescription>Return to the form before submitting.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cough attempts</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {coughFiles.map((file, index) => (
            <div key={index} className="flex justify-between gap-4">
              <span>Cough {index + 1}</span>
              <span className="font-mono text-ink-muted">
                {file ? `${Math.max(1, Math.round(file.size / 1024))} KiB · WebM` : "Missing"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {mutation.isError && (
        <Alert variant={modelUnavailable ? "warning" : "destructive"}>
          <AlertTitle>
            {modelUnavailable ? "Gema analysis is not available yet" : "Submission failed"}
          </AlertTitle>
          <AlertDescription>
            {modelUnavailable
              ? "The cough triage model is still being prepared, so no result can be produced yet. Your recordings are kept — continue with the standard clinical pathway."
              : "The recordings are still available. Try again."}
          </AlertDescription>
        </Alert>
      )}

      <Button
        disabled={!ready || mutation.isPending || modelUnavailable}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending && <Spinner />}
        Submit for Gema analysis
      </Button>
      <div>
        <Button asChild variant="tertiary">
          <Link href="/coughs">Back to recordings</Link>
        </Button>
      </div>
    </div>
  );
}
