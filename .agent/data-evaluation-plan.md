# Jaga · Data and Evaluation Plan

**Document type:** ML data and evaluation plan
**Audience:** ML, backend, product, reviewers, and pitch team
**Status:** Active · Daffa inputs required before model implementation
**Canonical for:** Controlled data use, preprocessing, leakage controls, model selection, calibration, evaluation, reproducibility, artifacts, and metric reporting
**Companion documents:** [`evidence-register.md`](evidence-register.md), [`project-architecture.md`](project-architecture.md), [`product-requirements.md`](product-requirements.md), [`implementation-plan.md`](implementation-plan.md)

## How to read this document

Known dataset and published-evidence facts are fixed below. Visible Daffa blocks require project-specific technical decisions or observed results that cannot be inferred from papers. Published CODA numbers are never substituted for Jaga's results.

## 1. Research framing

Jaga is an investigational prototype for symptomatic adults aged 18+ with cough. It is not evaluated for children, asymptomatic screening, the general population, or real clinical deployment. Every symptomatic participant is directed to confirmatory evaluation regardless of model output.

Primary risks are selection bias, device/environment shift, country/site shift, repeated-cough leakage, clinical-feature confounding, calibration failure, and optimistic reporting under a short deadline.

## 2. Dataset inventory

### 2.1 CODA core [MVP]

- Full study: 2,143 adults, seven countries, 733,756 cough events (CODA-01).
- Cohort: adults 18+ with new/worsening cough for at least two weeks (CODA-02).
- Split: 1,105 training and 1,038 held-out validation participants (CODA-03).
- Guided collection: five coughs requested; at least three required for retention; controlled clinic positioning (CODA-04).
- Audio representation: 0.5-second segments, 44.1 kHz, 32-bit float in the released data (CODA-05).
- Access: controlled Synapse access with non-redistribution obligations (CODA-06).
- Candidate clinical variables are listed in PRD-02; the signed model contract determines which are actually used.

> **OWNER INPUT REQUIRED — Daffa — due 2026-06-29**
>
> **Blocks:** `ML-0`, `ML-1`, schema signing, and reproducible evaluation
>
> **Required output:** list accessible Synapse entity/file IDs without credentials; confirm file sizes/checksums and variable names; record accepted data-use restrictions; identify solicited versus longitudinal files used; document class counts and missingness by country; define ignored local data paths; confirm how held-out evaluation submissions are performed
>
> **Affected documents:** `data-evaluation-plan.md`, `evidence-register.md`, `project-architecture.md`, `.gitignore` during scaffolding
>
> **Completion rule:** replace this block with a dated dataset manifest and link its non-sensitive path; do not download data into a tracked directory

### 2.2 Digital CXR — Prisma [Stretch]

The digital-CXR signal is the **Prisma** module, kept entirely separate from the **Gema** cough-plus-clinical core. Any CXR data comes from different participants and sources than CODA. It receives a separate pipeline, model, calibration, evaluation, result panel, and limitations. Source-specific artifacts are a known leakage risk; photographed films are out of scope.

No Prisma work starts before the P0 Gema (cough-plus-clinical) loop passes.

### 2.3 Demo fixtures [MVP]

- Synthetic clinical records cover valid, boundary, missing-optional, and invalid cases.
- Audio fixtures are generated or explicitly consented non-patient recordings.
- Fixtures have no disease truth claim and are labelled synthetic.
- Controlled CODA audio/metadata is not redistributed in the repository, video, screenshots, or public deployment.

## 3. Split and leakage policy

1. **Participant grouping:** all coughs from one participant stay in one split and one fold.
2. **Preprocessing fit:** normalization, feature selection, imputation, calibration, and threshold selection fit only on allowed training/validation partitions.
3. **Country shift:** run leave-one-country-out evaluation when per-country class counts permit meaningful reporting; publish unsupported folds rather than silently dropping them.
4. **Repeated segments:** participant aggregation occurs before participant-level scoring; segment count cannot overweight a participant without an explicit documented rule.
5. **Site/country feature:** site/country is excluded as a predictive feature unless the decision and external-validity consequence are documented.
6. **Clinical leakage:** exclude variables derived from reference-standard testing, diagnosis, treatment, or post-enrolment information.
7. **CXR source leakage:** if stretch work begins, evaluate by dataset/source and inspect borders, text, compression, and acquisition artifacts; preprocessing reduces but cannot prove removal of leakage.

> **OWNER INPUT REQUIRED — Daffa — due 2026-06-29**
>
> **Blocks:** `ML-1`, `ML-3`, and any performance claim
>
> **Required output:** define train/validation folds; grouped split implementation; random seeds; country-fold eligibility rule; preprocessing-fit boundaries; participant aggregation; missing-data handling; class-imbalance treatment; confidence-interval method; prohibited leakage variables
>
> **Affected documents:** `data-evaluation-plan.md`, `project-architecture.md`, `implementation-plan.md`
>
> **Completion rule:** replace this block with the signed evaluation protocol before viewing or optimizing against final held-out results

## 4. Preprocessing and quality gate

Evaluation and serving must call the same versioned preprocessing package. The package records input format, resampling, segmentation/windowing, amplitude normalization, spectrogram parameters, augmentation, participant aggregation, and rejection logic.

The quality gate returns per-attempt `accepted`, `retryable`, or `system_error` plus a stable reason code. It is evaluated independently from TB prediction; a failed gate cannot produce an estimate.

> **OWNER INPUT REQUIRED — Daffa — due 2026-06-29**
>
> **Blocks:** `ML-2`, `BE-2`, `FE-3`, and contract tests
>
> **Required output:** define accepted audio formats; resampling/windowing; cough detection or segmentation; minimum accepted coughs; quality features and numeric thresholds; reason-code enum; treatment of extra/short/long recordings; deterministic preprocessing version; runtime latency budget
>
> **Affected documents:** `data-evaluation-plan.md`, `project-architecture.md`, `product-requirements.md` only if behavior changes, `implementation-plan.md`
>
> **Completion rule:** replace this block with the quality/preprocessing contract and sanitized test vectors

## 5. Model-selection evidence gate

### 5.1 Baseline [MVP]

Establish a reproducible log-mel cough model plus a simple clinical branch and participant-level fusion. The baseline exists to create an honest floor, not to guarantee clinical usefulness.

### 5.2 Candidate [Stretch]

Benchmark one pretrained health/audio encoder, such as HeAR, only after confirming license, ROCm compatibility, input alignment, memory, latency, and reproducibility. Candidate promotion must be based on participant-grouped and country-shift evidence rather than one aggregate AUROC.

> **OWNER INPUT REQUIRED — Daffa — due 2026-06-29**
>
> **Blocks:** `ML-1`, candidate promotion, artifact packaging, and final architecture
>
> **Required output:** name exact baseline/candidate checkpoints and licenses; define clinical branch and fusion; define loss/optimizer/training schedule/early stopping; define hyperparameter-search budget; define participant aggregation; set numeric promotion thresholds for discrimination, calibration, country-fold regressions, latency, and memory; define tie-break rule; specify fallback artifact
>
> **Affected documents:** `data-evaluation-plan.md`, `project-architecture.md`, `evidence-register.md`, `implementation-plan.md`
>
> **Completion rule:** replace this block with the signed gate before candidate training; ties default to the simpler baseline

## 6. Calibration, bands, and urgency

- Fit calibration on a partition not used to fit model parameters and never on held-out test labels.
- Report calibration curve, Brier score, and expected calibration error alongside AUROC.
- Define **Lower**, **Intermediate**, and **Higher model-estimated risk** as relative research bands, not clinical diagnoses.
- Every band requires confirmatory evaluation; thresholds may change urgency wording only.
- Store calibration and thresholds as versioned artifacts linked to the model and preprocessing versions.

> **OWNER INPUT REQUIRED — Daffa — due 2026-06-29**
>
> **Blocks:** `ML-3`, result schema, and PRD-06 implementation
>
> **Required output:** select calibration method and fitting partition; define numeric band/urgency thresholds and rationale; define uncertainty/confidence intervals; define behavior outside calibrated support; define artifact serialization/versioning; define conditions that withhold probability
>
> **Affected documents:** `data-evaluation-plan.md`, `project-architecture.md`, `implementation-plan.md`, deterministic result copy
>
> **Completion rule:** replace this block with signed calibration/threshold policy before the result UI displays a probability

## 7. Metrics and reporting

### 7.1 Required actual Jaga results

- Participant-level AUROC and area under the precision-recall curve with confidence intervals.
- Sensitivity, specificity, PPV, and NPV at each displayed threshold with prevalence stated.
- Calibration curve, Brier score, and expected calibration error.
- Per-country results and leave-one-country-out results where sample sizes permit.
- Subgroups by sex and predeclared age bands where sample sizes permit.
- Quality-gate rejection rate and reason distribution.
- Inference latency and memory on the deployed AMD environment.

### 7.2 Reporting rules

- Label published CODA results as published benchmarks and Jaga results as Jaga results.
- Report sample size and confidence intervals; do not publish a metric without its evaluation scope.
- Publish negative and inconclusive results.
- State that CODA's Peru external validation exposed cough-only generalization limits (CODA-08).
- Do not claim WHO-profile attainment unless the exact profile, cohort, reference standard, thresholds, and confidence intervals support it.

## 8. Artifacts and reproducibility

Every evaluated run records:

- source commit and dirty/clean status;
- dataset manifest/checksums without restricted data;
- split/fold manifest by participant identifier hash;
- environment and pinned ROCm container digest;
- preprocessing and quality versions;
- model checkpoint/configuration/license;
- calibration and threshold artifacts;
- metric report and plots;
- random seeds and command used;
- known limitations and promotion decision.

> **OWNER INPUT REQUIRED — Daffa — due 2026-06-29**
>
> **Blocks:** reproducibility sign-off and `ML-4`
>
> **Required output:** define repository paths and machine-readable formats for run manifest, split manifest, model card, metric report, plots, and release artifact; define naming/version convention; provide the one-command evaluation entrypoint expected after implementation
>
> **Affected documents:** `data-evaluation-plan.md`, `project-architecture.md`, `implementation-plan.md`, final README usage section
>
> **Completion rule:** replace this block with the artifact contract and verify one baseline run can be reproduced from a clean environment

## 9. Privacy and data governance

- Keep controlled data only in the approved environment and ignored paths.
- Never commit data, participant identifiers, credentials, signed agreements, or raw evaluation payloads.
- Use non-reversible participant identifier hashes in split manifests only when allowed by the data terms.
- Production inference is transient and separate from the research dataset environment.
- Do not use real patient inputs in the public demo.

## 10. Evaluation acceptance

The model track is ready for integration only when:

- all Daffa owner-input blocks are replaced;
- the controlled-access manifest and restrictions are recorded;
- splits are participant-grouped and leakage checks pass;
- preprocessing is identical in evaluation and serving;
- a baseline run is reproducible in the pinned ROCm environment;
- calibration and band artifacts are versioned;
- actual metrics and published benchmarks are clearly separated;
- limitations include cohort and Peru generalization evidence;
- the release model card identifies the selected or fallback artifact.
