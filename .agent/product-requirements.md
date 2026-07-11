# Jaga · Product Requirements Document

**Document type:** Product requirements document
**Audience:** Product, design, frontend, backend, ML, QA, and demo team
**Status:** Active · behavior largely implemented; see `project-architecture.md` §16 for where the shipped backend has not yet closed the gap (quality-gate reason codes, calibrated bands)
**Updated:** 2026-07-11
**Canonical for:** User-visible behavior, safety, feature scope, failure states, localization, and acceptance criteria
**Companion documents:** [`product-brief.md`](product-brief.md), [`project-architecture.md`](project-architecture.md), [`data-evaluation-plan.md`](data-evaluation-plan.md), [`design-guidelines.md`](design-guidelines.md), [`implementation-plan.md`](implementation-plan.md), [`evidence-register.md`](evidence-register.md)

## How to read this document

Requirement IDs are stable and map to architecture sections and implementation tickets. Product behavior and safety here override summaries elsewhere. Implementation details owned by Daffa or Billy are defined in their visible owner-input blocks, but those blocks may not weaken these requirements.

## 1. Scope language

- **[MVP]** required for submission.
- **[V1]** documented post-hackathon work; do not build now.
- **[Stretch]** begins only after every P0 acceptance criterion passes.
- **[OUT]** prohibited.

### 1.1 Non-negotiable invariants

1. Jaga is an investigational research prototype, not a diagnostic or rule-out device.
2. The documented cohort is symptomatic adults aged 18+.
3. Every participant is directed to confirmatory evaluation regardless of the estimate or band.
4. The MVP core is cough plus model-supported clinical inputs.
5. CXR (Prisma) is an independent co-equal signal and is never fused with the cough score.
6. Patient inputs are processed transiently and are not retained or request-body logged.
7. Published evidence and actual Jaga results are labelled separately.
8. Attention/saliency is described as model inspection, not reasoning or causal explanation.

## 2. Users and roles

| Role | MVP need | MVP capability |
|---|---|---|
| Community health worker | Complete guided capture reliably on a phone | Start a case, enter supported fields, record/retry coughs, submit, explain the next step |
| Symptomatic adult participant | Understand the process and avoid false reassurance | Receive plain-language limitations and confirmatory-evaluation guidance in Bahasa Indonesia or English |
| Demo operator | Demonstrate the complete workflow safely | Select synthetic fixtures, trigger success/failure paths, and reset without retained data |
| Programme/research reviewer | Inspect evidence and limitations | View model version, calibration status, actual metrics, cohort scope, and limitations |

Programme dashboards, accounts, and longitudinal records are `[V1]`.

## 3. MVP feature specification

### 3.1 Eligibility and consent [MVP] · PRD-01

**Behavior**

- State that Jaga is a research prototype and not medical advice.
- Require confirmation that the demo case represents an adult aged 18+ with cough symptoms.
- Require acknowledgement that confirmatory evaluation is the next step regardless of the result.
- Provide Bahasa Indonesia and English before any capture begins.

**Validation and failure states**

- Under-18, asymptomatic, or unconfirmed cases cannot proceed to inference; show the cohort limitation and direct the user to standard clinical guidance.
- Consent/acknowledgement must not be preselected.

**Acceptance**

- A user cannot reach clinical capture without completing all acknowledgements.
- Copy never claims clinical clearance, diagnosis, or rule-out.

### 3.2 Supported clinical capture [MVP] · PRD-02

**Behavior**

- Render only fields present in the signed inference contract.
- The allowed CODA-derived candidate set is: age, sex, height, weight, reported cough duration, prior TB diagnosis/type, haemoptysis, heart rate, temperature, recent weight loss, smoking in the last week, fever, and night sweats (CODA-09).
- Country/site may be collected for evaluation only if Daffa's contract explicitly permits it; it must not silently become a predictive feature.
- Known TB contact is not part of the documented CODA variable list and is excluded from MVP inference.
- Mark each field required, optional, or unavailable according to the signed contract; never invent defaults.

**Validation and failure states**

- Validate type, range, unit, and requiredness locally and on the server.
- Preserve entered values when a field error occurs.
- Missing optional values are sent only using the contract's explicit representation.

**Acceptance**

- Frontend and backend validation use the same schema version.
- Unsupported fields never reach the model.

### 3.3 Single-recording guided capture [MVP] · PRD-03

**Behavior**

- Ask for one guided recording of up to 90 seconds in which the participant coughs naturally several times.
- Show positioning guidance, remaining recording time, and a live detected-cough count.
- Request microphone permission only when capture begins.
- Allow the user to stop early or let the recording stop automatically at 90 seconds. “Record again” discards the whole capture and restarts from zero; there is no pause flow.
- Briefly pulse the live waveform orange when the detector registers a cough; when reduced motion is requested, update the count without the pulse.
- Label client-side cough detection as an illustrative prototype energy heuristic, not model output, model evidence, or server-side quality acceptance.
- Do not claim the phone capture reproduces CODA's controlled clinic setup.

**Failure states**

- Permission denied: explain how to enable access and provide retry.
- Interrupted recording: discard the incomplete recording and allow a fresh capture.
- Unsupported browser/device: block inference and show a clear compatibility message.

**Acceptance**

- Continue is unavailable until a recording longer than two seconds is captured.
- The frontend proposal sends one WebM file in the `cough` multipart field. The backend contract and quality gate are unchanged and remain pending explicit alignment.
- No fixed “10-second” performance claim appears in the UI.

### 3.4 Audio-quality gate [MVP] · PRD-04

**Behavior**

- Evaluate the recording using Daffa's signed quality contract once the backend aligns with the one-file proposal.
- Return `accepted`, `retryable`, or `system_error` with reason codes mapped to user guidance.
- Quality failure never produces a TB-risk estimate.

**Required user guidance categories**

- Too quiet / microphone too far.
- Clipped / too loud.
- Excess background noise.
- No detectable cough event.
- Unsupported encoding or duration.

**Acceptance**

- Every reason code has deterministic Bahasa Indonesia and English copy.
- Retrying the recording does not erase valid clinical inputs.

### 3.5 Inference submission [MVP] · PRD-05

**Behavior**

- Submit only after eligibility, clinical validation, and quality acceptance pass.
- Show `preparing`, `uploading`, `processing`, `success`, `retryable_error`, and `terminal_error` states.
- Prevent duplicate submission while a request is active.
- Expose model version and contract version in the result.

**Failure states**

- Offline before submit: preserve local form state and allow retry; do not claim queued secure upload.
- Timeout/service unavailable: show no estimate and offer retry.
- Contract/version mismatch: stop and show a technical error; never coerce the payload.

**Acceptance**

- An error cannot leave a stale estimate visible.
- The API and UI use the same request identifier without exposing patient data.

### 3.6 Research result [MVP] · PRD-06

**Required content, in order**

1. “Research prototype—not a diagnosis” banner.
2. Calibrated probability only if the model artifact is actually calibrated.
3. Relative band labelled **Lower**, **Intermediate**, or **Higher model-estimated risk**, not Low/Elevated/High clinical risk.
4. Follow-up urgency derived from the signed model contract.
5. Mandatory confirmatory-evaluation instruction for every band.
6. Optional local-recording summary labelled as illustrative and explicitly not model output.
7. One collapsed “About this estimate” disclosure containing signal type, model version, evaluation cohort, calibration status, contract version, and limitations.
8. Optional genuine attention/saliency labelled “model inspection; not a clinical explanation.”
9. Supported contributing inputs without causal wording.

**Safety behavior**

- Lower model-estimated risk must not use green “clear,” checkmarks, reassurance, or copy that discourages evaluation.
- No result uses “negative,” “positive,” “healthy,” “TB detected,” or “TB absent.”
- If calibration or model metadata is missing, withhold the probability and show an unavailable-result error.

**Acceptance**

- Every result band displays the same confirmatory-evaluation requirement.
- Model inspection can be hidden without changing the clinical next step.
- Technical metadata and limitations remain keyboard-accessible without interrupting the participant-facing result flow.

> **Open gap (2026-07-11):** the shipped Gema pipeline maps its XGBoost probability to a band using a fixed 0.33/0.66 cutoff, not a calibration curve fitted on held-out data (`project-architecture.md` §16.2, `data-evaluation-plan.md` §6). This requirement — "calibrated probability only if the model artifact is actually calibrated" — is not yet met in the strict sense; the "About this estimate" disclosure's calibration-status field must say so rather than imply a fitted calibration exists.

### 3.7 Localization [MVP] · PRD-07

- English is the default field language; Bahasa Indonesia is always available via a one-tap toggle. Both are complete, reviewed, and equivalent. *(Changed 2026-06-28 for the English-judged hackathon demo; supersedes the earlier "Bahasa default".)*
- Safety, consent, validation, quality, result, and error copy must be deterministic and reviewed as paired strings.
- Changing language preserves the current step and entered values.
- Do not machine-generate the mandatory referral or limitation copy at runtime.

**Acceptance**

- Every mandatory string key has a reviewed Bahasa Indonesia and English value.
- Switching language at every flow step preserves entered values and the active state.
- A missing mandatory translation fails the frontend test/build contract rather than displaying a raw key.

### 3.8 Privacy and reset [MVP] · PRD-08

- Do not store patient inputs in application databases, analytics, browser persistence, or request logs.
- Keep capture state in memory only for the active flow.
- Clear audio, form data, result, and request identifiers on reset, success acknowledgement, or session timeout.
- Do not include real patient data in fixtures, screenshots, video, or repository history.

**Acceptance**

- Automated checks find no patient input in browser persistence, application storage, analytics, or request logs.
- Reset, acknowledgement, and session timeout each remove form, audio, result, and request-identifier state.

### 3.9 Independent CXR — Prisma [MVP] · PRD-09

- The CXR `[MVP]` module is named **Prisma**; the cough-plus-clinical `[MVP]` core is named **Gema**. The two are co-equal, separate signals and are never fused.
- Prisma and Gema are delivered in parallel; neither blocks the other, and either may degrade independently without affecting the other.
- Display a separate Prisma (CXR) research estimate, model/version, metrics, limitations, and inspection heatmap.
- Never combine scores, bands, calibration, or referral language with the Gema (cough-plus-clinical) result.
- Photographed films are rejected.

**Acceptance**

- Prisma can fail or be removed without changing the Gema request, result, or next step.
- Its evaluation, calibration, metadata, limitations, and panel remain visibly separate.

### 3.10 Fireworks richer note [Stretch] · PRD-10

- Generate optional explanatory prose only from sanitized, non-identifying structured outputs.
- Keep deterministic safety/referral copy visible even when the generated note fails.
- Generated copy cannot introduce diagnosis, treatment, or unsupported causal claims.

**Acceptance**

- A Fireworks timeout or invalid response leaves deterministic bilingual result and referral copy unchanged.
- Safety tests reject generated diagnosis, rule-out, treatment, or causal language.

## 4. Demo fixtures [MVP] · PRD-11

- Repository fixtures contain synthetic clinical values and generated or explicitly consented non-patient audio only.
- Fixtures exercise: accepted capture, each quality error category, service timeout, lower/intermediate/higher bands, and missing model metadata.
- Fixture results are labelled synthetic and must not be presented as evidence of model performance.
- Controlled CODA audio and participant records are never committed or redistributed.

**Acceptance**

- Every fixture validates against the signed request, response, or error schema and is exercised by the contract suite.
- A repository scan finds no CODA participant record, controlled audio, credential, or real patient identifier.

## 5. Accessibility and field constraints [MVP] · PRD-12

- Meet WCAG 2.2 AA contrast for text and controls.
- Minimum touch target is 44×44 CSS pixels.
- Color is never the sole signal.
- All controls, progress, errors, charts, and result states have accessible names or text alternatives.
- Respect reduced motion and support keyboard operation.
- Preserve critical copy and controls at 320 CSS-pixel width.
- Provide useful progress and retry behavior on slow or intermittent networks.

**Acceptance**

- QA records passing keyboard, focus, status-announcement, contrast, reduced-motion, 200% zoom, 320 CSS-pixel width, and 44×44 target checks.
- Waveform, spectrogram, inspection, progress, error, and result content each have a useful text or programmatic alternative.

## 6. Out of MVP

### 6.1 [V1]

Accounts, multi-tenancy, programme dashboard, longitudinal patient records, offline/on-prem deployment, EHR/lab integration, prospective validation tooling, regulatory workflow, and additional respiratory diseases.

### 6.2 [OUT]

Diagnosis; treatment advice; drug-resistance typing; real-patient demo data; persistent patient storage; live patient-data scraping; unsupported children/asymptomatic/general-population claims; photographed X-ray scoring; fused CXR+cough metrics; fabricated or inherited benchmark results.

## 7. MVP acceptance summary

The MVP is done only when:

- PRD-01 through PRD-08 and PRD-11 through PRD-12 pass end to end.
- The deployed service runs on AMD and is containerized.
- Actual Jaga evaluation is reported separately from published CODA evidence.
- Participant-grouped evaluation, calibration, and permitted subgroup results are documented.
- All success and failure states work in both languages.
- No patient data is retained or logged.
- A clean public checkout can follow README instructions to run the application.
- Video, slides, cover image, descriptions, tags, repository, platform, and URL are ready before 11 July 15:00 UTC.

## 8. Traceability

| Requirement | Architecture | Primary ticket |
|---|---|---|
| PRD-01 Eligibility/consent | Frontend contract · privacy | FE-1 |
| PRD-02 Clinical capture | Shared schema · API | ARCH-1 · FE-2 · BE-1 |
| PRD-03 Guided coughs | Frontend capture · upload contract | FE-3 |
| PRD-04 Quality gate | AI pipeline · quality response | ML-2 · BE-2 · FE-3 |
| PRD-05 Submission | API · serving · observability | BE-2 · BE-3 · FE-4 |
| PRD-06 Result | Model metadata · result schema | ML-3 · BE-3 · FE-5 |
| PRD-07 Localization | Frontend string contract | UX-1 · FE-1–FE-5 |
| PRD-08 Privacy/reset | Security · logging · state model | ARCH-2 · BE-4 · FE-4 |
| PRD-09 CXR (Prisma) | Independent co-equal pipeline | ML-5 · FE-7 |
| PRD-10 Fireworks stretch | Sanitized generation boundary | BE-6 |
| PRD-11 Fixtures | Test data strategy | QA-1 |
| PRD-12 Accessibility | Frontend/design specification | UX-1 · QA-2 |
