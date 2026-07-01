"use client";

import { useRouter } from "next/navigation";
import {
  Controller,
  useForm,
  type Control,
  type FieldError as RhfFieldError,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { clinicalSchema, type ClinicalFormValues } from "./clinical-schema";
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

export function ClinicalForm() {
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
      <FieldGroup>
        {mutation.isError && !(mutation.error instanceof PatientValidationError) && (
          <Alert variant="destructive">
            <AlertTitle>Could not validate the form</AlertTitle>
            <AlertDescription>Check your connection and try again.</AlertDescription>
          </Alert>
        )}
        <NumberField
          name="age_years"
          label="Age (years)"
          hint="0 to 120"
          register={register}
          error={errors.age_years}
          inputMode="numeric"
        />

        <SexField control={control} error={errors.sex_at_birth} />

        <NumberField
          name="height_cm"
          label="Height (cm)"
          hint="40 to 260"
          register={register}
          error={errors.height_cm}
          step="0.1"
        />
        <NumberField
          name="weight_kg"
          label="Weight (kg)"
          hint="1 to 350"
          register={register}
          error={errors.weight_kg}
          step="0.1"
        />
        <NumberField
          name="cough_duration_days"
          label="Cough duration (days)"
          hint="0 to 365"
          register={register}
          error={errors.cough_duration_days}
          inputMode="numeric"
        />

        <YesNoField name="prior_tb" legend="Prior TB" control={control} error={errors.prior_tb} />
        <YesNoField
          name="hemoptysis"
          legend="Coughing blood (hemoptysis)"
          control={control}
          error={errors.hemoptysis}
        />

        <FieldSet className="rounded-control border border-border-subtle p-4">
          <FieldLegend variant="label" className="px-1 text-ink-muted">
            Vitals (optional)
          </FieldLegend>
          <FieldGroup>
            <NumberField
              name="heart_rate_bpm"
              label="Heart rate (bpm)"
              hint="20 to 250 — optional"
              register={register}
              error={errors.heart_rate_bpm as RhfFieldError | undefined}
              optional
              inputMode="numeric"
            />
            <NumberField
              name="temperature_c"
              label="Temperature (°C)"
              hint="30 to 45 — optional"
              register={register}
              error={errors.temperature_c as RhfFieldError | undefined}
              optional
              step="0.1"
            />
          </FieldGroup>
        </FieldSet>

        <YesNoField
          name="smoked_last_7_days"
          legend="Smoked in the last 7 days"
          control={control}
          error={errors.smoked_last_7_days}
        />
        <YesNoField
          name="fever_last_30_days"
          legend="Fever in the last 30 days"
          control={control}
          error={errors.fever_last_30_days}
        />
        <YesNoField
          name="night_sweats_last_30_days"
          legend="Night sweats in the last 30 days"
          control={control}
          error={errors.night_sweats_last_30_days}
        />
        <YesNoField
          name="weight_loss_last_30_days"
          legend="Weight loss in the last 30 days"
          control={control}
          error={errors.weight_loss_last_30_days}
        />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          Continue
        </Button>
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

function NumberField({
  name,
  label,
  hint,
  register,
  error,
  optional = false,
  inputMode = "decimal",
  step,
}: {
  name: FieldName;
  label: string;
  hint?: string;
  register: UseFormRegister<ClinicalFormValues>;
  error?: RhfFieldError;
  optional?: boolean;
  inputMode?: "numeric" | "decimal";
  step?: string;
}) {
  const id = String(name);

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id} className="text-base font-semibold">
        {label}
      </FieldLabel>
      <Input
        id={id}
        type="number"
        inputMode={inputMode}
        step={step}
        className="font-mono"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...register(name, {
          setValueAs: (value: string) =>
            value === "" ? (optional ? null : Number.NaN) : Number(value),
        })}
      />
      {hint && !error && <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription>}
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
  return (
    <Controller
      name="sex_at_birth"
      control={control}
      render={({ field }) => (
        <FieldSet data-invalid={!!error}>
          <FieldLegend>Sex at birth</FieldLegend>
          <RadioGroup
            name={field.name}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            aria-invalid={!!error}
            className="flex gap-4"
          >
            <RadioOption id="sex_at_birth-male" value="male" label="Male" ariaInvalid={!!error} />
            <RadioOption id="sex_at_birth-female" value="female" label="Female" ariaInvalid={!!error} />
          </RadioGroup>
          {error && <FieldError>Select one.</FieldError>}
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
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FieldSet data-invalid={!!error}>
          <FieldLegend>{legend}</FieldLegend>
          <RadioGroup
            name={field.name}
            value={typeof field.value === "boolean" ? String(field.value) : ""}
            onValueChange={(value) => field.onChange(value === "true")}
            onBlur={field.onBlur}
            ref={field.ref}
            aria-invalid={!!error}
            className="flex gap-4"
          >
            <RadioOption id={`${name}-true`} value="true" label="Yes" ariaInvalid={!!error} />
            <RadioOption id={`${name}-false`} value="false" label="No" ariaInvalid={!!error} />
          </RadioGroup>
          {error && <FieldError>Select one.</FieldError>}
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
    <FieldLabel htmlFor={id} className="min-h-11 gap-2 text-base">
      <RadioGroupItem id={id} value={value} aria-invalid={ariaInvalid} />
      {label}
    </FieldLabel>
  );
}
