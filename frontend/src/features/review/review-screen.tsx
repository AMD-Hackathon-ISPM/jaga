"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { clinicalSchema } from "@/features/clinical/clinical-schema";
import { useT } from "@/hooks/use-t";
import { triageService } from "@/services/triage.service";
import { isModelUnavailable } from "@/services/api-error";
import { useSessionStore } from "@/store/session.store";

const FIELD_LABEL_KEYS: Record<string, string> = {
  age_years: "review.fields.age_years",
  sex_at_birth: "review.fields.sex_at_birth",
  height_cm: "review.fields.height_cm",
  weight_kg: "review.fields.weight_kg",
  cough_duration_days: "review.fields.cough_duration_days",
  prior_tb: "review.fields.prior_tb",
  hemoptysis: "review.fields.hemoptysis",
  heart_rate_bpm: "review.fields.heart_rate_bpm",
  temperature_c: "review.fields.temperature_c",
  smoked_last_7_days: "review.fields.smoked_last_7_days",
  fever_last_30_days: "review.fields.fever_last_30_days",
  night_sweats_last_30_days: "review.fields.night_sweats_last_30_days",
  weight_loss_last_30_days: "review.fields.weight_loss_last_30_days",
};

function formatClinicalValue(
  key: string,
  value: unknown,
  t: (key: string) => string,
): { text: string; mono: boolean } {
  if (value === null || value === undefined || value === "") {
    return { text: t("review.notMeasured"), mono: false };
  }

  if (typeof value === "boolean") {
    return { text: value ? t("review.boolean.true") : t("review.boolean.false"), mono: false };
  }

  if (key === "sex_at_birth" && (value === "male" || value === "female")) {
    return { text: t(`review.sex.${value}`), mono: false };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    switch (key) {
      case "age_years":
        return { text: t("review.values.ageYears").replace("{n}", String(value)), mono: true };
      case "height_cm":
        return { text: t("review.values.heightCm").replace("{n}", String(value)), mono: true };
      case "weight_kg":
        return { text: t("review.values.weightKg").replace("{n}", String(value)), mono: true };
      case "cough_duration_days":
        return {
          text: t("review.values.coughDurationDays").replace("{n}", String(value)),
          mono: true,
        };
      case "heart_rate_bpm":
        return { text: t("review.values.heartRateBpm").replace("{n}", String(value)), mono: true };
      case "temperature_c":
        return {
          text: t("review.values.temperatureC").replace("{n}", String(value)),
          mono: true,
        };
      default:
        return { text: String(value), mono: true };
    }
  }

  return { text: String(value), mono: false };
}

export function ReviewScreen() {
  const router = useRouter();
  const t = useT();
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

  const modelUnavailable = isModelUnavailable(mutation.error);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-xl font-semibold text-ink">{t("review.title")}</h1>

      {!parsedClinical.success && (
        <Alert variant="warning">
          <AlertTitle>{t("review.clinicalIncompleteTitle")}</AlertTitle>
          <AlertDescription>{t("review.clinicalIncompleteBody")}</AlertDescription>
        </Alert>
      )}

      <section className="rounded-control border border-brand bg-card py-4">
        <h2 className="px-4 text-lg font-semibold text-ink">{t("review.clinicalTitle")}</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 px-4 min-[480px]:grid-cols-2">
          {Object.entries(clinical).map(([key, value]) => {
            const labelKey = FIELD_LABEL_KEYS[key];
            const label = labelKey ? t(labelKey) : key;
            const formatted = formatClinicalValue(key, value, t);
            return (
              <div key={key} className="min-w-0">
                <dt className="text-sm text-ink-muted">{label}</dt>
                <dd
                  className={
                    formatted.mono
                      ? "font-mono text-base tabular-nums text-ink"
                      : "text-base text-ink"
                  }
                >
                  {formatted.text}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section className="rounded-control border border-brand bg-card py-4">
        <h2 className="px-4 text-lg font-semibold text-ink">{t("review.coughsTitle")}</h2>
        <ul className="mt-3 flex flex-col gap-2 px-4">
          {coughFiles.map((file, index) => (
            <li key={index} className="flex min-h-11 items-center justify-between gap-4">
              <span className="text-base text-ink">
                {t("review.coughLabel").replace("{n}", String(index + 1))}
              </span>
              <span className="font-mono text-base tabular-nums text-ink">
                {file
                  ? t("review.coughMeta")
                      .replace("{size}", String(Math.max(1, Math.round(file.size / 1024))))
                      .replace("{format}", "WebM")
                  : t("review.coughMissing")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {mutation.isError && (
        <Alert variant={modelUnavailable ? "warning" : "destructive"}>
          <AlertTitle>
            {modelUnavailable ? t("review.error.modelUnavailableTitle") : t("review.error.submitFailedTitle")}
          </AlertTitle>
          <AlertDescription>
            {modelUnavailable
              ? t("review.error.modelUnavailableBody")
              : t("review.error.submitFailedBody")}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button asChild variant="return" className="min-h-11 flex-1">
          <Link href="/coughs">
            <IconChevronLeft data-icon="inline-start" aria-hidden="true" />
            {t("review.return")}
          </Link>
        </Button>
        <Button
          className="min-h-11 flex-1 whitespace-normal px-3 text-center leading-snug"
          disabled={!ready || mutation.isPending || modelUnavailable}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending && <Spinner />}
          <span>{t("review.submit")}</span>
          {!mutation.isPending && (
            <IconChevronRight data-icon="inline-end" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}
