"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type FieldError as RhfFieldError,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { IconChevronRight } from "@tabler/icons-react";
import { clinicalSchema, type ClinicalFormValues } from "./clinical-schema";
import { isClinicalComplete } from "./clinical-form-utils";
import { useSessionStore } from "@/store/session.store";
import { patientService, PatientValidationError } from "@/services/patient.service";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "min-h-11 border-ink/50 bg-canvas font-mono tabular-nums focus-visible:border-brand";

export function ClinicalForm() {
  const t = useT();
  const router = useRouter();
  const setClinical = useSessionStore((s) => s.setClinical);
  const clinical = useSessionStore((s) => s.clinical);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<ClinicalFormValues>({
    resolver: zodResolver(clinicalSchema),
    mode: "onBlur",
    defaultValues: clinical,
  });

  const mutation = useMutation({
    mutationFn: (values: ClinicalFormValues) => patientService.submitIntake(values),
    onSuccess: (patient) => {
      setClinical(patient);
      router.push("/coughs");
    },
    onError: (error, values) => {
      if (!(error instanceof PatientValidationError)) return;
      const fields = error.errors.filter((item) => item.field in clinicalSchema.shape);
      fields.forEach((item) =>
        setError(item.field as keyof ClinicalFormValues, {
          type: "server",
          message: item.message,
        }),
      );
      const first = fields[0]?.field as keyof ClinicalFormValues | undefined;
      if (first && first in values) setFocus(first);
    },
  });

  const onSubmit = (values: ClinicalFormValues) => mutation.mutate(values);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-4">
        {mutation.isError && !(mutation.error instanceof PatientValidationError) && (
          <Alert variant="destructive">
            <AlertTitle>{t("clinical.validateFailedTitle")}</AlertTitle>
            <AlertDescription>{t("clinical.validateFailedBody")}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-x-3 gap-y-4 min-[480px]:grid-cols-2">
          <NumberField
            name="age_years"
            label={t("clinical.ageYears")}
            required
            register={register}
            error={errors.age_years}
            inputMode="numeric"
          />
          <SexField control={control} error={errors.sex_at_birth} />
          <NumberField
            name="height_cm"
            label={t("clinical.heightCm")}
            required
            register={register}
            error={errors.height_cm}
            step="0.1"
          />
          <NumberField
            name="weight_kg"
            label={t("clinical.weightKg")}
            required
            register={register}
            error={errors.weight_kg}
            step="0.1"
          />
        </div>

        <NumberField
          name="cough_duration_days"
          label={t("clinical.coughDurationDays")}
          required
          register={register}
          error={errors.cough_duration_days}
          inputMode="numeric"
        />

        <div className="grid grid-cols-1 gap-x-3 gap-y-4 min-[480px]:grid-cols-2">
          <YesNoField
            name="prior_tb"
            legend={t("clinical.priorTb")}
            control={control}
            error={errors.prior_tb}
          />
          <YesNoField
            name="hemoptysis"
            legend={t("clinical.coughingBlood")}
            control={control}
            error={errors.hemoptysis}
          />
        </div>

        <FieldSet className="rounded-control border border-ink/50 px-3 pb-3 pt-0">
          <FieldLegend
            variant="label"
            className="mb-2 bg-canvas px-1.5 text-base font-medium text-ink"
          >
            {t("clinical.vitalsOptional")}
          </FieldLegend>
          <div className="grid grid-cols-1 gap-x-3 gap-y-3 min-[480px]:grid-cols-2">
            <NumberField
              name="heart_rate_bpm"
              label={t("clinical.heartRateBpm")}
              hint={t("clinical.heartRateHint")}
              register={register}
              error={errors.heart_rate_bpm as RhfFieldError | undefined}
              optional
              inputMode="numeric"
            />
            <NumberField
              name="temperature_c"
              label={t("clinical.temperatureC")}
              hint={t("clinical.temperatureHint")}
              register={register}
              error={errors.temperature_c as RhfFieldError | undefined}
              optional
              step="0.1"
            />
          </div>
        </FieldSet>

        <YesNoField
          name="smoked_last_7_days"
          legend={t("clinical.smokedLast7Days")}
          control={control}
          error={errors.smoked_last_7_days}
        />
        <YesNoField
          name="fever_last_30_days"
          legend={t("clinical.feverLast30Days")}
          control={control}
          error={errors.fever_last_30_days}
        />
        <YesNoField
          name="night_sweats_last_30_days"
          legend={t("clinical.nightSweatsLast30Days")}
          control={control}
          error={errors.night_sweats_last_30_days}
        />
        <YesNoField
          name="weight_loss_last_30_days"
          legend={t("clinical.weightLossLast30Days")}
          control={control}
          error={errors.weight_loss_last_30_days}
        />

        <ClinicalFormActions control={control} isPending={mutation.isPending} />
      </FieldGroup>
    </form>
  );
}

type FieldName = keyof ClinicalFormValues;

type BooleanFieldName =
  | "prior_tb"
  | "hemoptysis"
  | "smoked_last_7_days"
  | "fever_last_30_days"
  | "night_sweats_last_30_days"
  | "weight_loss_last_30_days";

function ClinicalFormActions({
  control,
  isPending,
}: {
  control: Control<ClinicalFormValues>;
  isPending: boolean;
}) {
  const t = useT();
  const values = useWatch({ control });
  const formValid = isClinicalComplete(values);

  return (
    <div className="flex flex-col gap-3">
      {!formValid && !isPending && (
        <p className="text-base text-ink-muted" role="status">
          {t("clinical.incompleteHint")}
        </p>
      )}
      <div className="flex gap-3">
      <Button asChild variant="return" className="min-h-11 flex-1">
        <Link href="/">{t("clinical.return")}</Link>
      </Button>
      <Button type="submit" className="min-h-11 flex-1" disabled={!formValid || isPending}>
        {isPending && <Spinner />}
        <span>{t("common.continue")}</span>
        {!isPending && <IconChevronRight data-icon="inline-end" aria-hidden="true" />}
      </Button>
      </div>
    </div>
  );
}

function RequiredMark() {
  return (
    <span className="text-error" aria-hidden="true">
      *
    </span>
  );
}

function NumberField({
  name,
  label,
  hint,
  register,
  error,
  optional = false,
  required = false,
  inputMode = "decimal",
  step,
}: {
  name: FieldName;
  label: string;
  hint?: string;
  register: UseFormRegister<ClinicalFormValues>;
  error?: RhfFieldError;
  optional?: boolean;
  required?: boolean;
  inputMode?: "numeric" | "decimal";
  step?: string;
}) {
  const id = String(name);

  return (
    <Field data-invalid={!!error} className="gap-1.5">
      <FieldLabel htmlFor={id} className="gap-0 text-base font-medium text-ink">
        <span>
          {label}
          {required ? <RequiredMark /> : null}
        </span>
      </FieldLabel>
      <Input
        id={id}
        type="number"
        inputMode={inputMode}
        step={step}
        className={INPUT_CLASS}
        aria-invalid={!!error}
        aria-required={required}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...register(name, {
          setValueAs: (value: string) =>
            value === "" ? (optional ? null : Number.NaN) : Number(value),
        })}
      />
      {hint && !error && (
        <FieldDescription id={`${id}-hint`} className="font-mono text-sm text-ink-muted">
          {hint}
        </FieldDescription>
      )}
      {error && (
        <FieldError id={`${id}-error`}>
          {error.message || `Enter a valid value (${hint ?? "see range"}).`}
        </FieldError>
      )}
    </Field>
  );
}

function SexField({
  control,
  error,
}: {
  control: Control<ClinicalFormValues>;
  error?: RhfFieldError;
}) {
  const t = useT();

  return (
    <Controller
      name="sex_at_birth"
      control={control}
      render={({ field }) => (
        <FieldSet data-invalid={!!error} className="gap-1.5">
          <FieldLegend className="mb-0 text-base font-medium text-ink">
            {t("clinical.gender")}
            <RequiredMark />
          </FieldLegend>
          <RadioGroup
            name={field.name}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            aria-invalid={!!error}
            aria-required="true"
            className="flex flex-wrap gap-x-4 gap-y-1"
          >
            <RadioOption
              id="sex_at_birth-male"
              value="male"
              label={t("clinical.male")}
              ariaInvalid={!!error}
            />
            <RadioOption
              id="sex_at_birth-female"
              value="female"
              label={t("clinical.female")}
              ariaInvalid={!!error}
            />
          </RadioGroup>
          {error && <FieldError>{t("clinical.selectOne")}</FieldError>}
        </FieldSet>
      )}
    />
  );
}

function YesNoField({
  name,
  legend,
  control,
  error,
}: {
  name: BooleanFieldName;
  legend: string;
  control: Control<ClinicalFormValues>;
  error?: RhfFieldError;
}) {
  const t = useT();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FieldSet data-invalid={!!error} className="gap-1.5">
          <FieldLegend className="mb-0 text-base font-medium text-ink">
            {legend}
            <RequiredMark />
          </FieldLegend>
          <RadioGroup
            name={field.name}
            value={typeof field.value === "boolean" ? String(field.value) : ""}
            onValueChange={(value) => field.onChange(value === "true")}
            onBlur={field.onBlur}
            ref={field.ref}
            aria-invalid={!!error}
            aria-required="true"
            className="flex flex-wrap gap-x-4 gap-y-1"
          >
            <RadioOption
              id={`${name}-true`}
              value="true"
              label={t("clinical.yes")}
              ariaInvalid={!!error}
            />
            <RadioOption
              id={`${name}-false`}
              value="false"
              label={t("clinical.no")}
              ariaInvalid={!!error}
            />
          </RadioGroup>
          {error && <FieldError>{t("clinical.selectOne")}</FieldError>}
        </FieldSet>
      )}
    />
  );
}

function RadioOption({
  id,
  value,
  label,
  ariaInvalid,
}: {
  id: string;
  value: string;
  label: string;
  ariaInvalid: boolean;
}) {
  return (
    <FieldLabel
      htmlFor={id}
      className={cn(
        "min-h-11 cursor-pointer items-center gap-2 text-base font-normal text-ink",
      )}
    >
      <RadioGroupItem id={id} value={value} aria-invalid={ariaInvalid} />
      {label}
    </FieldLabel>
  );
}
