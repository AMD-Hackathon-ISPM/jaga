"use client";

import { useRouter } from "next/navigation";
import { useForm, type UseFormRegister, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clinicalSchema, type ClinicalFormValues } from "./clinical-schema";
import { useSessionStore } from "@/store/session.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * ClinicalForm — full field set mirrored from the live Go contract
 * (models/patient.go + validation/patient.go). RHF + Zod; the Zod bounds match
 * the server's so the UI rejects the same values.
 *
 * Placeholder behavior: submit writes to the in-memory session store and
 * advances the step. NO API call is made (the triage contract is unsigned).
 * Field labels are English inline for now; they move to the keyed EN/ID bundle
 * (src/locales) once UX-1 signs the paired strings.
 */
export function ClinicalForm() {
  const router = useRouter();
  const setClinical = useSessionStore((s) => s.setClinical);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClinicalFormValues>({
    resolver: zodResolver(clinicalSchema),
    mode: "onBlur",
  });

  const onSubmit = (values: ClinicalFormValues) => {
    setClinical(values); // in-memory only — never persisted
    router.push("/coughs");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <NumberField
        name="age_years"
        label="Age (years)"
        hint="0 to 120"
        register={register}
        error={errors.age_years}
        inputMode="numeric"
      />

      <BooleanLikeRadio
        name="sex_at_birth"
        legend="Sex at birth"
        options={[
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
        ]}
        register={register}
        error={errors.sex_at_birth}
      />

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

      <YesNoField name="prior_tb" legend="Prior TB" register={register} error={errors.prior_tb} />
      <YesNoField
        name="hemoptysis"
        legend="Coughing blood (hemoptysis)"
        register={register}
        error={errors.hemoptysis}
      />

      <fieldset className="space-y-4 rounded-control border border-border-subtle p-4">
        <legend className="px-1 text-sm text-ink-muted">Vitals (optional)</legend>
        <NumberField
          name="heart_rate_bpm"
          label="Heart rate (bpm)"
          hint="20 to 250 — optional"
          register={register}
          error={errors.heart_rate_bpm as FieldError | undefined}
          optional
          inputMode="numeric"
        />
        <NumberField
          name="temperature_c"
          label="Temperature (°C)"
          hint="30 to 45 — optional"
          register={register}
          error={errors.temperature_c as FieldError | undefined}
          optional
          step="0.1"
        />
      </fieldset>

      <YesNoField
        name="smoked_last_7_days"
        legend="Smoked in the last 7 days"
        register={register}
        error={errors.smoked_last_7_days}
      />
      <YesNoField
        name="fever_last_30_days"
        legend="Fever in the last 30 days"
        register={register}
        error={errors.fever_last_30_days}
      />
      <YesNoField
        name="night_sweats_last_30_days"
        legend="Night sweats in the last 30 days"
        register={register}
        error={errors.night_sweats_last_30_days}
      />
      <YesNoField
        name="weight_loss_last_30_days"
        legend="Weight loss in the last 30 days"
        register={register}
        error={errors.weight_loss_last_30_days}
      />

      <Button type="submit">Continue</Button>
    </form>
  );
}

/* ---------- field primitives (placeholder; will read labels from locale bundle) ---------- */

type FieldName = keyof ClinicalFormValues;

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
  error?: FieldError;
  optional?: boolean;
  inputMode?: "numeric" | "decimal";
  step?: string;
}) {
  const id = String(name);
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-semibold">
        {label}
      </label>
      <Input
        id={id}
        type="number"
        inputMode={inputMode}
        step={step}
        className="font-mono"
        invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...register(name, {
          // Optional vitals: empty -> null; required numbers -> Number (NaN fails Zod).
          setValueAs: (v: string) =>
            v === "" ? (optional ? null : Number.NaN) : Number(v),
        })}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-error">
          Enter a valid value ({hint ?? "see range"}).
        </p>
      )}
    </div>
  );
}

function YesNoField({
  name,
  legend,
  register,
  error,
}: {
  name: FieldName;
  legend: string;
  register: UseFormRegister<ClinicalFormValues>;
  error?: FieldError;
}) {
  return (
    <BooleanLikeRadio
      name={name}
      legend={legend}
      options={[
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ]}
      register={register}
      error={error}
    />
  );
}

function BooleanLikeRadio({
  name,
  legend,
  options,
  register,
  error,
}: {
  name: FieldName;
  legend: string;
  options: { value: string; label: string }[];
  register: UseFormRegister<ClinicalFormValues>;
  error?: FieldError;
}) {
  return (
    <fieldset>
      <legend className="mb-1 font-semibold">{legend}</legend>
      <div className="flex gap-4">
        {options.map((opt) => (
          <label key={opt.value} className="inline-flex min-h-[44px] items-center gap-2">
            <input
              type="radio"
              value={opt.value}
              {...register(name)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-error">Select one.</p>}
    </fieldset>
  );
}
