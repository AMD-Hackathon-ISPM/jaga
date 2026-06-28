# Jaga · Product Requirements (PRD)

> Roles, scope, user flow, features, and acceptance criteria.
> Companions: `product-brief.md` · `project-architecture.md` · `design-guidelines.md` · `context-dump.md`.

---

## Scope tags (read first)
Every feature carries a tag. **If it isn't `[MVP]`, do not build it for the hackathon — that's scope creep.** The MVP *is* the demo.
- **[MVP]** — must ship for **11 Jul 2026**.
- **[V1]** — after the hackathon. Document, don't build now.
- **[OUT]** — explicitly never; listed so no one speculatively builds it.

**Product invariants (non-negotiable, do not drift):** triage-not-diagnosis · **evidence-backed core = cough + clinical inputs** (CXR is optional/stretch, never a fused metric) · **trained on AMD MI300X (ROCm), served online on AMD** · **minimize + don't retain patient data** (transient cloud inference; no scraping) · honest metrics (no overclaiming vs the CODA/WHO evidence) · ships by 11 Jul. A change touching any of these is out of scope unless explicitly re-decided and logged in `context-dump.md` + `log.md`.

---

## Users / roles
- **Community health worker (CHW)** — primary user. Screens people in the field with a phone; needs a clear "who to refer" answer. (Demo persona: *Ibu Sri, rural Central Java*.)
- **Clinic / district TB program lead** — deploys the AMD edge appliance; owns case-finding targets; views aggregate results. (Persona: *Dr. Adi*.)
- **NGO field coordinator** — runs mobile screening camps; needs triage at point of contact. (Persona: *Maria*.)

## Scope — MVP (≈5-day sprint, 6–11 Jul)
Capture (cough + structured clinical form) → **online inference on AMD (cloud)** → explainable, calibrated TB-risk triage + referral. One clean end-to-end loop. **Evidence-backed core = cough + clinical.** Chest X-ray = optional/stretch module only.
**Documented cohort:** **symptomatic adults (18+) with cough** — matches the CODA evidence base. We do not claim performance for children, asymptomatic screening, or the general population (stated as a limitation). **Investigational research prototype**, not a cleared device.

## User journey
1. **Demographics + risk factors** (required) — age, sex, region, known TB contact.
2. **Symptoms** (required-lite) — symptom chips (cough duration, fever, night sweats, weight loss) feed the clinical model.
3. **Cough** (required) — record **a few guided coughs (~10s, per the CODA solicited-cough protocol)**; live waveform; an **audio-quality gate** rejects unusable recordings.
4. **Chest X-ray** (optional / stretch) — upload a *digital* X-ray for a separate, independent TB-likelihood signal. Skippable.
5. **Analysis** — sent to the AMD cloud model; processed transiently, not retained.
6. **Result** — calibrated risk band + explainability + deterministic bilingual referral.

**Design principle:** the score is a **calibrated probability** — adding inputs can raise *or* lower it, and conflicting signals can reduce certainty. We never mechanically inflate confidence with more input.

## Features
- **[MVP] Listen** — a few guided coughs (~10s) → mel-spectrogram + compact audio embeddings (with audio-quality gate).
- **[MVP] Combine** — cough + demographics + symptoms → **one calibrated TB-risk probability** (the evidence-backed cough+clinical core).
- **[MVP] Decide** — triage band (**Low / Elevated / High → refer for confirmatory test**), explainable (spectrogram + **model-attention** overlay, calibrated score, key contributing factors), with **deterministic** bilingual (Bahasa/English) referral copy.
- **[Stretch] See (CXR module)** — optional *digital* chest X-ray → an **independent** TB-likelihood + model-attention heatmap, shown *alongside* the cough+clinical score (not fused into it).
- **[Stretch/V1] Richer note** — optional online Fireworks-generated plain-language explanation (deterministic copy is the default).
- **[V1] Program admin view** — where cases cluster, who to refer.

## Result screen (required panels)
Calibrated risk band/score · cough mel-spectrogram + **model-attention** overlay · key contributing clinical factors · deterministic bilingual referral · limitations note. **(Stretch:** independent CXR likelihood + heatmap, shown separately.)

## Acceptance criteria / target metrics
- End-to-end flow runs **online**, served on AMD (Dev Cloud), reachable at a public app URL.
- **Cough + clinical form required;** flow produces a calibrated triage band; CXR optional and clearly separate.
- Every result is **explainable** (spectrogram + model-attention + contributing factors) and shows **limitations**.
- Accuracy reported **honestly** vs the published evidence: cough-only AUROC ~**0.69–0.74**, **cough+clinical ~0.78–0.83** ([CODA challenge](https://pmc.ncbi.nlm.nih.gov/articles/PMC12502651/)); the **WHO 2025 screening TPP** (tiered targets — see `evidence-register.md`) is the *aspiration we measure against, not a promised number*. Eval is **subject-level / leave-one-country-out**, with calibration + subgroup metrics (full method in `data-evaluation-plan.md`).
- Containerized; deployed online for the demo. (Confirm containerization requirement.)

## Safety / non-negotiables
- **Triage, NOT diagnosis.** Output is "who should get a confirmatory test (GeneXpert/sputum)," never a diagnosis. Human always in the loop.
- **Honest metrics** — report real numbers + limitations + subgroup performance; never claim a fused tri-modal metric (no paired data exists).
- **Minimize + don't retain patient data**; transient cloud inference only; no scraping.
- No real patient data in the demo — public + synthetic only.

## Do not build (explicit)
If you have time for these, spend it polishing the MVP instead.
- **[OUT] Diagnosis / any definitive TB call** — Jaga only triages; safety invariant, never build it.
- **[OUT] A "fused" cough+X-ray validated metric** — no paired data exists; scientifically indefensible.
- **[OUT] Claiming offline / on-device / "nothing leaves the device"** — the MVP is online cloud inference; don't claim otherwise.
- **[OUT] Retaining patient data or live web scraping.**
- **[OUT] Scoring a photographed X-ray film** as if it were a digital CXR.
- **[V1] Drug-resistance typing · treatment guidance · EHR/lab integration · multi-disease (COPD/asthma/pneumonia) · national-program dashboard · accounts/multi-tenant · native mobile apps · offline/on-prem edge deployment.**

## Pricing tiers
Free tier for community health workers · per-program / per-screen cloud license for TB programs and NGOs. (Detail in `product-brief.md`.)
