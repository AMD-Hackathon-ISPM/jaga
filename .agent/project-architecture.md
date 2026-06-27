# Jaga · Project Architecture

**Status:** Active · **Updated:** 2026-06-27 · **Owner:** Daffa

> System architecture, data, models, pipeline, and build ownership.
> Companions: `product-brief.md` · `product-requirements.md` · `design-guidelines.md` · `context-dump.md`.

---

## Design philosophy
- **Cloud-served, online.** Inference runs in the cloud on **AMD (Dev Cloud, MI300X)**; the phone/browser is a thin client. (We are *not* claiming on-device/offline — see `context-dump.md` §Set-Aside.)
- **AMD is load-bearing through training.** We **train + fine-tune** the model on **MI300X via ROCm/PyTorch** — that is the real, defensible AMD usage — and serve it on AMD.
- **Privacy posture (honest):** patient inputs are transmitted to the cloud for *transient* inference and **not retained**; de-identify what we can. We do **not** claim "nothing leaves the device."
- **Validated core, honest metrics.** The validated product is **cough + structured clinical inputs**. Chest X-ray is an **independent optional module (stretch)**, never fused into a single validated score without paired data. All metrics reported against the WHO triage target as an *aspiration*, not an expected result.

## Architecture (layers)
1. **Capture** — phone mic (cough) + a short structured form (demographics + symptoms). Optional: a digital chest X-ray (stretch module). PWA, online.
2. **Preprocess** — cough → mel-spectrogram + compact audio embeddings (distilled/HeAR-style — *not* full HeAR; HeAR's own card says it's too large for on-device, and we run server-side anyway); structured inputs normalized.
3. **AI inference on AMD (the core)** — **cough + clinical model** producing one **calibrated** TB-risk probability. Trained in **PyTorch on ROCm (MI300X)**, served on AMD Dev Cloud. **[Stretch] CXR module** = a *separate* TB-likelihood from a digital-CXR model, shown alongside (not blended into the validated score).
4. **Explain / Compose** — mel-spectrogram + **model-attention overlay** (labelled "where the model focused," not "the reason"); calibrated probability + threshold; **deterministic, templated bilingual (Bahasa/English) referral copy** (no runtime LLM needed). *Optional, online:* Fireworks generates a richer plain-language note.
5. **Presentation** — Next.js/PWA capture journey + result dashboard. Docker-containerized (per the original brief; confirm requirement).

## Tech stack
Next.js / PWA · FastAPI (Python) · **PyTorch on ROCm (MI300X)** · cough+clinical model (compact audio model + structured features) · mel-spectrogram + model-attention (e.g. Grad-CAM-style) · calibration (Platt/isotonic) · deterministic referral templates · Fireworks API (optional note) · Docker.

## Datasets (public — no scraping)
- [CODA TB cough](https://www.nature.com/articles/s41597-024-03972-z) — 700k+ cough sounds, 2,143 adults across 7 countries, **with paired clinical data** → this is our cough+clinical core.
- **[Stretch] digital CXR:** [Kaggle TB CXR](https://www.kaggle.com/datasets/scipygaurav/tuberculosis-tb-chest-x-ray-cleaned-database), Shenzhen/Montgomery — **different patients from CODA**, so used only for an independent CXR signal, never a fused metric. Use digital CXR images, **not photographed films**.

## Models, metrics & evaluation
- Train the cough+clinical model on **MI300X via ROCm**; calibrate the output probability.
- **Honest target metrics** (from the [CODA challenge](https://pmc.ncbi.nlm.nih.gov/articles/PMC12502651/)): cough-only AUROC ~**0.69–0.74**; **cough+clinical AUROC ~0.78–0.83** (our goal); best published cough+clinical hit ~73.8% specificity at 80% sensitivity. The **WHO triage target (≥90% sens / ≥70% spec)** is the aspiration we measure against, not a promised result.
- **Evaluation:** subject-level and, where possible, **country/site-held-out** splits; report calibration and **subgroup metrics**; state limitations plainly.

## Cost
Training + inference on the **$100 AMD Dev Cloud** credit; **Fireworks $50** covers optional notes. Cloud inference cost per screen is modest; quantify at build.

## Deployment
Online: containerized service on **AMD Dev Cloud (MI300X)**; PWA client over the internet; public app URL for the submission. (Offline/on-prem edge is a *future roadmap idea*, not built or claimed for the MVP.)

## Technical risks & mitigations
- **Accuracy honesty** → reproduce CODA cough+clinical methods; report real numbers vs the WHO aspiration; never claim a fused tri-modal metric.
- **Liability** → triage-not-diagnosis; always refer for confirmatory test; show limitations + subgroup performance.
- **Field generalization** → frame as triage to prioritize testing; CODA includes uncontrolled recordings; add an audio-quality gate before scoring.
- **CXR validity** → optional only; digital CXR, not photographed film; shown as a separate signal.
- **ROCm/serving fit** → use AMD office hours early; pick a backbone that trains+serves comfortably in the window.
- **Scope (≈5-day sprint)** → MVP = cough+clinical model + capture journey + explainable result + deterministic referral, served online on AMD. CXR only if time remains.

## Build ownership
- **Daffa** — train cough+clinical model on MI300X; calibration; explainability; (stretch) CXR module.
- **Zeddin** — data pipeline, **API contract**, containerization, cloud serving, optional Fireworks note.
- **Kei** — capture + result frontend (PWA).
- **Billy** — design system, signature result visuals, bilingual UX copy.
- **Fransisco** — PM, deck/presentation, demo video.

## Open items
- Confirm cough+clinical backbone that trains/serves on MI300X within the window (Daffa).
- Confirm CODA dataset access terms.
- Define the **API contract** (so frontend + ML proceed independently).
- Confirm the actual event window (start date / sprint length) and whether containerization is required.
