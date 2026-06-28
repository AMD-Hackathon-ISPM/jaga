"use client";

/**
 * ClinicalCaptureForm — Jaga MVP
 * =================================================================
 * SCHEMA STATUS: schema-pending-signature
 *   Implements PRD-01 (eligibility/consent) + PRD-02 (supported clinical capture).
 *   Field set = CODA-09 candidate set, mirroring the published fused baseline
 *   (evidence-register CODA-10, Selisios 2026, Sensors 26(4):1223).
 *
 *   This is PROVISIONAL. The rendered fields and their required/optional flags
 *   are NOT final until Daffa signs the inference contract (owner block due
 *   2026-06-29). Per PRD-02: render only fields in the signed contract; never
 *   invent defaults; unsupported fields must never reach the model.
 *
 * CONTRACT EMITTED (clinical-v1) — 14 form fields, validated FE + BE on the
 *   same schema_version. The backend derives any model-vector expansion of
 *   prior_tb / prior_tb_type; the frontend does NOT bake in a "16-feature"
 *   encoding (unverified against the paper — see CODA-10 note).
 *
 *   The five cough recordings are submitted SEPARATELY from this clinical
 *   payload (PRD-03 / architecture rule). This component handles clinical only.
 *
 * SAFETY: copy never claims diagnosis, rule-out, clearance, or reassurance.
 * =================================================================
 */

import { useState, useRef } from "react";

const SCHEMA_VERSION = "clinical-v1";

/* ------------------------------------------------------------------ */
/* Bilingual copy. Bahasa Indonesia is the default field language;     */
/* English is always available. Switching language preserves step and */
/* entered values (PRD-11).                                            */
/* ------------------------------------------------------------------ */
const T = {
  id: {
    langName: "Bahasa Indonesia",
    langToggle: "English",
    pendingBanner:
      "Skema sementara — menunggu kontrak inferensi ditandatangani. Bidang dapat berubah.",
    // Eligibility gate (PRD-01)
    gateTitle: "Kelayakan dan persetujuan",
    gateIntro:
      "Jaga adalah prototipe riset. Jaga tidak mendiagnosis, menyingkirkan, atau memastikan tuberkulosis. Setiap peserta dengan gejala tetap diarahkan ke evaluasi konfirmasi.",
    gateAdult: "Saya mengonfirmasi peserta adalah orang dewasa berusia 18 tahun ke atas.",
    gateCough: "Saya mengonfirmasi peserta memiliki gejala batuk.",
    gateConsent:
      "Peserta memahami bahwa ini adalah alat riset dan menyetujui pengambilan data untuk sesi ini.",
    gateContinue: "Lanjut ke isian klinis",
    gateBlocked:
      "Semua konfirmasi harus dicentang sebelum melanjutkan. Jika peserta di bawah 18 tahun atau tanpa gejala, ikuti panduan klinis standar.",
    // Form
    formTitle: "Isian klinis",
    formIntro: "Isi semua bidang. Nilai harus berasal dari pengukuran atau jawaban peserta.",
    required: "wajib",
    submit: "Tinjau dan kirim",
    fixErrors: "Perbaiki bidang yang ditandai sebelum mengirim.",
    yes: "Ya",
    no: "Tidak",
    selectOne: "Pilih salah satu",
    back: "Kembali",
    submittedTitle: "Payload klinis siap (clinical-v1)",
    submittedNote:
      "Ini hanya bagian klinis. Lima rekaman batuk dikirim terpisah. Jaga tidak mendiagnosis TB.",
    errRequired: "Bidang ini wajib diisi.",
    errInteger: "Masukkan bilangan bulat.",
    errNumber: "Masukkan angka yang valid.",
    errRange: (min, max, unit) => `Nilai harus antara ${min} dan ${max} ${unit}.`,
    sexMale: "Laki-laki",
    sexFemale: "Perempuan",
    ptNone: "Tidak ada",
    ptPulmonary: "Paru",
    ptExtrapulmonary: "Luar paru",
    ptUnknown: "Tidak diketahui",
  },
  en: {
    langName: "English",
    langToggle: "Bahasa Indonesia",
    pendingBanner:
      "Provisional schema — pending signed inference contract. Fields may change.",
    gateTitle: "Eligibility and consent",
    gateIntro:
      "Jaga is a research prototype. It does not diagnose, rule out, or confirm tuberculosis. Every symptomatic participant is still directed to confirmatory evaluation.",
    gateAdult: "I confirm the participant is an adult aged 18 or older.",
    gateCough: "I confirm the participant has cough symptoms.",
    gateConsent:
      "The participant understands this is a research tool and consents to data capture for this session.",
    gateContinue: "Continue to clinical inputs",
    gateBlocked:
      "All confirmations must be checked to continue. If the participant is under 18 or asymptomatic, follow standard clinical guidance.",
    formTitle: "Clinical inputs",
    formIntro: "Complete every field. Values must come from a measurement or the participant's answer.",
    required: "required",
    submit: "Review and submit",
    fixErrors: "Fix the highlighted fields before submitting.",
    yes: "Yes",
    no: "No",
    selectOne: "Select one",
    back: "Back",
    submittedTitle: "Clinical payload ready (clinical-v1)",
    submittedNote:
      "This is the clinical part only. The five cough recordings are sent separately. Jaga does not diagnose TB.",
    errRequired: "This field is required.",
    errInteger: "Enter a whole number.",
    errNumber: "Enter a valid number.",
    errRange: (min, max, unit) => `Value must be between ${min} and ${max} ${unit}.`,
    sexMale: "Male",
    sexFemale: "Female",
    ptNone: "None",
    ptPulmonary: "Pulmonary",
    ptExtrapulmonary: "Extrapulmonary",
    ptUnknown: "Unknown",
  },
};

/* ------------------------------------------------------------------ */
/* Field contract. Ranges are plausibility bounds for local + server  */
/* validation (PRD-02). `kind` drives rendering.                      */
/* ------------------------------------------------------------------ */
const FIELDS = [
  { key: "age_years", kind: "integer", unit: "years", min: 18, max: 120,
    label: { id: "Usia", en: "Age" } },
  { key: "sex_at_birth", kind: "enum", options: ["male", "female"],
    label: { id: "Jenis kelamin saat lahir", en: "Sex at birth" } },
  { key: "height_cm", kind: "number", unit: "cm", min: 80, max: 250,
    label: { id: "Tinggi badan", en: "Height" } },
  { key: "weight_kg", kind: "number", unit: "kg", min: 20, max: 300,
    label: { id: "Berat badan", en: "Weight" } },
  { key: "cough_duration_days", kind: "integer", unit: "days", min: 0, max: 3650,
    label: { id: "Durasi batuk", en: "Cough duration" } },
  { key: "prior_tb", kind: "boolean",
    label: { id: "Riwayat TB sebelumnya", en: "Prior TB diagnosis" } },
  { key: "prior_tb_type", kind: "enum",
    options: ["none", "pulmonary", "extrapulmonary", "unknown"],
    dependsOn: "prior_tb",
    label: { id: "Jenis TB sebelumnya", en: "Prior TB type" } },
  { key: "hemoptysis", kind: "boolean",
    label: { id: "Batuk berdarah (hemoptisis)", en: "Coughing up blood (haemoptysis)" } },
  { key: "heart_rate_bpm", kind: "integer", unit: "bpm", min: 30, max: 220,
    label: { id: "Denyut jantung", en: "Heart rate" } },
  { key: "temperature_c", kind: "number", unit: "°C", min: 30, max: 45,
    label: { id: "Suhu tubuh", en: "Temperature" } },
  { key: "smoked_last_7_days", kind: "boolean",
    label: { id: "Merokok dalam 7 hari terakhir", en: "Smoked in the last 7 days" } },
  { key: "fever_last_30_days", kind: "boolean",
    label: { id: "Demam dalam 30 hari terakhir", en: "Fever in the last 30 days" } },
  { key: "night_sweats_last_30_days", kind: "boolean",
    label: { id: "Keringat malam dalam 30 hari terakhir", en: "Night sweats in the last 30 days" } },
  { key: "weight_loss_last_30_days", kind: "boolean",
    label: { id: "Penurunan berat badan dalam 30 hari terakhir", en: "Weight loss in the last 30 days" } },
];

function enumOptionLabel(fieldKey, opt, t) {
  if (fieldKey === "sex_at_birth") return opt === "male" ? t.sexMale : t.sexFemale;
  if (fieldKey === "prior_tb_type")
    return { none: t.ptNone, pulmonary: t.ptPulmonary, extrapulmonary: t.ptExtrapulmonary, unknown: t.ptUnknown }[opt];
  return opt;
}

function isVisible(field, values) {
  if (!field.dependsOn) return true;
  // prior_tb_type only applies once prior_tb is answered; if prior_tb === false
  // it is forced to "none" and hidden (consistency rule).
  return values[field.dependsOn] === true;
}

/* Validate one field. Returns an error key/string or null. */
function validateField(field, values, t) {
  const visible = isVisible(field, values);
  let v = values[field.key];

  // prior_tb_type with prior_tb === false is auto-"none": always valid.
  if (field.key === "prior_tb_type" && values.prior_tb === false) return null;
  if (!visible) return null;

  if (v === undefined || v === null || v === "") return t.errRequired;

  if (field.kind === "integer") {
    if (!/^-?\d+$/.test(String(v).trim())) return t.errInteger;
    const n = Number(v);
    if (n < field.min || n > field.max) return t.errRange(field.min, field.max, field.unit);
  }
  if (field.kind === "number") {
    const n = Number(v);
    if (String(v).trim() === "" || Number.isNaN(n)) return t.errNumber;
    if (n < field.min || n > field.max) return t.errRange(field.min, field.max, field.unit);
  }
  if (field.kind === "enum" && !field.options.includes(v)) return t.errRequired;
  if (field.kind === "boolean" && typeof v !== "boolean") return t.errRequired;

  return null;
}

/* Build the clinical-v1 payload from validated values. */
function buildPayload(values) {
  const out = { schema_version: SCHEMA_VERSION };
  for (const f of FIELDS) {
    if (f.key === "prior_tb_type" && values.prior_tb === false) {
      out.prior_tb_type = "none";
      continue;
    }
    let v = values[f.key];
    if (f.kind === "integer") v = parseInt(v, 10);
    else if (f.kind === "number") v = Number(v);
    out[f.key] = v;
  }
  return out;
}

export default function ClinicalCaptureForm({ onSubmit = () => {} }) {
  const [lang, setLang] = useState("id");
  const [step, setStep] = useState("gate"); // gate | form | done
  const [gate, setGate] = useState({ adult: false, cough: false, consent: false });
  const [gateError, setGateError] = useState(false);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [payload, setPayload] = useState(null);
  const errorSummaryRef = useRef(null);

  const t = T[lang];
  const toggleLang = () => setLang((l) => (l === "id" ? "en" : "id"));

  /* ---- Eligibility gate ---- */
  const gateComplete = gate.adult && gate.cough && gate.consent;
  function submitGate() {
    if (!gateComplete) {
      setGateError(true);
      return;
    }
    setGateError(false);
    setStep("form");
  }

  /* ---- Field changes ---- */
  function setValue(key, val) {
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      // Consistency: clearing prior_tb to false resets the type to "none".
      if (key === "prior_tb" && val === false) next.prior_tb_type = "none";
      if (key === "prior_tb" && val === true && prev.prior_tb_type === "none")
        next.prior_tb_type = undefined;
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function submitForm() {
    const nextErrors = {};
    for (const f of FIELDS) {
      const e = validateField(f, values, t);
      if (e) nextErrors[f.key] = e;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      // Move focus to the error summary for screen-reader users.
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }
    const p = buildPayload(values);
    setPayload(p);
    setStep("done");
    onSubmit(p);
  }

  /* ---- Shared control styles (≥44px targets, visible focus) ---- */
  const focusRing = "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-600";
  const inputBase =
    "w-full min-h-[44px] rounded-lg border px-3 py-2 text-base " + focusRing;
  const choiceBase =
    "inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 py-2 text-base cursor-pointer " +
    focusRing;

  return (
    <div className="mx-auto max-w-xl p-4 text-slate-900">
      {/* Header: language toggle + provisional banner */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Jaga
        </span>
        <button
          type="button"
          onClick={toggleLang}
          className={"min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium " + focusRing}
          aria-label={"Switch language to " + t.langToggle}
        >
          {t.langToggle}
        </button>
      </div>

      <div
        role="note"
        className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
      >
        {t.pendingBanner}
      </div>

      {/* ---------------- Eligibility gate ---------------- */}
      {step === "gate" && (
        <section aria-labelledby="gate-title">
          <h1 id="gate-title" className="mb-2 text-xl font-bold">{t.gateTitle}</h1>
          <p className="mb-4 text-sm text-slate-700">{t.gateIntro}</p>

          <fieldset className="space-y-3">
            {[
              ["adult", t.gateAdult],
              ["cough", t.gateCough],
              ["consent", t.gateConsent],
            ].map(([key, label]) => (
              <label key={key} className="flex items-start gap-3 rounded-lg border border-slate-300 p-3">
                <input
                  type="checkbox"
                  checked={gate[key]}
                  onChange={(e) => setGate((g) => ({ ...g, [key]: e.target.checked }))}
                  className={"mt-0.5 h-6 w-6 shrink-0 " + focusRing}
                />
                <span className="text-sm leading-relaxed">{label}</span>
              </label>
            ))}
          </fieldset>

          {gateError && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              {t.gateBlocked}
            </p>
          )}

          <button
            type="button"
            onClick={submitGate}
            aria-disabled={!gateComplete}
            className={
              "mt-5 min-h-[44px] w-full rounded-lg px-4 py-3 text-base font-semibold text-white " +
              focusRing +
              (gateComplete ? " bg-blue-700 hover:bg-blue-800" : " bg-slate-400 cursor-not-allowed")
            }
          >
            {t.gateContinue}
          </button>
        </section>
      )}

      {/* ---------------- Clinical form ---------------- */}
      {step === "form" && (
        <section aria-labelledby="form-title">
          <h1 id="form-title" className="mb-2 text-xl font-bold">{t.formTitle}</h1>
          <p className="mb-4 text-sm text-slate-700">{t.formIntro}</p>

          {Object.keys(errors).length > 0 && (
            <div
              ref={errorSummaryRef}
              tabIndex={-1}
              role="alert"
              className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
            >
              {t.fixErrors}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); submitForm(); }}
            noValidate
            className="space-y-5"
          >
            {FIELDS.filter((f) => isVisible(f, values)).map((f) => {
              const err = errors[f.key];
              const errId = err ? f.key + "-error" : undefined;
              const labelText = f.label[lang];
              return (
                <div key={f.key}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <label htmlFor={f.key} className="text-sm font-semibold">
                      {labelText}
                      {f.unit && <span className="ml-1 font-normal text-slate-500">({f.unit})</span>}
                    </label>
                    <span className="text-xs uppercase tracking-wide text-slate-400">{t.required}</span>
                  </div>

                  {/* Numeric / integer inputs */}
                  {(f.kind === "integer" || f.kind === "number") && (
                    <input
                      id={f.key}
                      name={f.key}
                      type="number"
                      inputMode={f.kind === "integer" ? "numeric" : "decimal"}
                      step={f.kind === "integer" ? "1" : "any"}
                      min={f.min}
                      max={f.max}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValue(f.key, e.target.value)}
                      aria-invalid={!!err}
                      aria-describedby={errId}
                      className={inputBase + (err ? " border-red-500 bg-red-50" : " border-slate-300")}
                    />
                  )}

                  {/* Enum (radio group) */}
                  {f.kind === "enum" && (
                    <div role="radiogroup" aria-label={labelText} aria-invalid={!!err} className="flex flex-wrap gap-2">
                      {f.options.map((opt) => {
                        const selected = values[f.key] === opt;
                        return (
                          <label
                            key={opt}
                            className={
                              choiceBase +
                              (selected ? " border-blue-700 bg-blue-50 font-semibold" : " border-slate-300") +
                              (err ? " ring-1 ring-red-400" : "")
                            }
                          >
                            <input
                              type="radio"
                              name={f.key}
                              value={opt}
                              checked={selected}
                              onChange={() => setValue(f.key, opt)}
                              className="h-5 w-5"
                            />
                            {enumOptionLabel(f.key, opt, t)}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Boolean (Yes / No) */}
                  {f.kind === "boolean" && (
                    <div role="radiogroup" aria-label={labelText} aria-invalid={!!err} className="flex gap-2">
                      {[true, false].map((b) => {
                        const selected = values[f.key] === b;
                        return (
                          <label
                            key={String(b)}
                            className={
                              choiceBase + " min-w-[88px] justify-center" +
                              (selected ? " border-blue-700 bg-blue-50 font-semibold" : " border-slate-300") +
                              (err ? " ring-1 ring-red-400" : "")
                            }
                          >
                            <input
                              type="radio"
                              name={f.key}
                              checked={selected}
                              onChange={() => setValue(f.key, b)}
                              className="h-5 w-5"
                            />
                            {b ? t.yes : t.no}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {err && (
                    <p id={errId} role="alert" className="mt-1 text-sm font-medium text-red-700">
                      {err}
                    </p>
                  )}
                </div>
              );
            })}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("gate")}
                className={"min-h-[44px] rounded-lg border border-slate-300 px-4 py-3 text-base font-medium " + focusRing}
              >
                {t.back}
              </button>
              <button
                type="submit"
                className={"min-h-[44px] flex-1 rounded-lg bg-blue-700 px-4 py-3 text-base font-semibold text-white hover:bg-blue-800 " + focusRing}
              >
                {t.submit}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ---------------- Confirmation / payload ---------------- */}
      {step === "done" && payload && (
        <section aria-labelledby="done-title">
          <h1 id="done-title" className="mb-2 text-xl font-bold">{t.submittedTitle}</h1>
          <p className="mb-4 text-sm text-slate-700">{t.submittedNote}</p>
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{JSON.stringify(payload, null, 2)}
          </pre>
          <button
            type="button"
            onClick={() => setStep("form")}
            className={"mt-4 min-h-[44px] rounded-lg border border-slate-300 px-4 py-3 text-base font-medium " + focusRing}
          >
            {t.back}
          </button>
        </section>
      )}
    </div>
  );
}
