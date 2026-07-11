# Jaga · Data and Evaluation Plan

**Document type:** ML data and evaluation plan
**Audience:** ML, backend, product, reviewers, and pitch team
**Status:** Active · a model is built and serving (§11), but the rigorous evidence gate this document specifies was not run against it — the gap is real, not a documentation lag
**Updated:** 2026-07-11
**Canonical for:** Controlled data use, preprocessing, leakage controls, model selection, calibration, evaluation, reproducibility, artifacts, and metric reporting
**Companion documents:** [`evidence-register.md`](evidence-register.md), [`project-architecture.md`](project-architecture.md), [`product-requirements.md`](product-requirements.md), [`implementation-plan.md`](implementation-plan.md)

## How to read this document

Known dataset and published-evidence facts are fixed below. Visible Daffa blocks require project-specific technical decisions or observed results that cannot be inferred from papers. Published CODA numbers are never substituted for Jaga's results. **§11 records what was actually built and evaluated as of 2026-07-11; where it falls short of the standard set in §1–§10, that standard still applies and the shortfall is the thing to fix, not this document.**

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

> **OWNER INPUT REQUIRED — Daffa — originally due 2026-06-29**
>
> **Blocks:** `ML-0`, `ML-1`, schema signing, and reproducible evaluation
>
> **Status (2026-07-11):** still open. `backend/modelServerandTraining/GemmaTraining` contains only `dataPrep/mergedata.py` and one notebook (`notebooks/trainDetector.ipynb`) — no dataset manifest, checksum record, or documented Synapse file list exists in the repository. It is not possible to tell from the repo alone which CODA files/variables the shipped model was actually trained on.
>
> **Required output:** list accessible Synapse entity/file IDs without credentials; confirm file sizes/checksums and variable names; record accepted data-use restrictions; identify solicited versus longitudinal files used; document class counts and missingness by country; define ignored local data paths; confirm how held-out evaluation submissions are performed
>
> **Affected documents:** `data-evaluation-plan.md`, `evidence-register.md`, `project-architecture.md`, `.gitignore` during scaffolding
>
> **Completion rule:** replace this block with a dated dataset manifest and link its non-sensitive path; do not download data into a tracked directory

### 2.2 Digital CXR — Prisma [MVP]

The digital-CXR signal is the **Prisma** module, kept entirely separate from the **Gema** cough-plus-clinical core. Any CXR data comes from different participants and sources than CODA. It receives a separate pipeline, model, calibration, evaluation, result panel, and limitations. Source-specific artifacts are a known leakage risk; photographed films are out of scope.

Prisma and Gema are co-equal MVP pipelines built in parallel; each ships and is evaluated independently and their outputs are never fused.

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
7. **CXR source leakage:** evaluate Prisma by dataset/source and inspect borders, text, compression, and acquisition artifacts; preprocessing reduces but cannot prove removal of leakage.

> **OWNER INPUT REQUIRED — Daffa — originally due 2026-06-29**
>
> **Blocks:** `ML-1`, `ML-3`, and any performance claim
>
> **Status (2026-07-11):** still open for Gema. No split manifest, seed record, or country-fold rule exists in the repository; the shipped XGBoost model's training/validation split is not documented anywhere. Do not present any Gema number as a held-out or participant-grouped result until this is done. (Prisma is closer — §5.3 records the quantum-kernel evaluation actually run on a held-out split, though its exact split/leakage documentation is also still incomplete.)
>
> **Required output:** define train/validation folds; grouped split implementation; random seeds; country-fold eligibility rule; preprocessing-fit boundaries; participant aggregation; missing-data handling; class-imbalance treatment; confidence-interval method; prohibited leakage variables
>
> **Affected documents:** `data-evaluation-plan.md`, `project-architecture.md`, `implementation-plan.md`
>
> **Completion rule:** replace this block with the signed evaluation protocol before viewing or optimizing against final held-out results

## 4. Preprocessing and quality gate

Evaluation and serving must call the same versioned preprocessing package. The package records input format, resampling, segmentation/windowing, amplitude normalization, spectrogram parameters, augmentation, participant aggregation, and rejection logic.

The quality gate returns per-attempt `accepted`, `retryable`, or `system_error` plus a stable reason code. It is evaluated independently from TB prediction; a failed gate cannot produce an estimate.

> **(partly overtaken) OWNER INPUT REQUIRED — Daffa — originally due 2026-06-29**
>
> **Blocks:** `ML-2`, `BE-2`, `FE-3`, and contract tests
>
> **Status (2026-07-11):** the preprocessing half is built and shared — pure-Go DC-offset removal, 80 Hz Butterworth high-pass, silence trim, and peak-normalize (`POST /api/v1/audio/preprocess`, `project-architecture.md` §15.1). The cough-detection/quality-gate half is built as a YAMNet ONNX classifier (`yamnetService`, cough-class confidence against a `COUGH_MINIMUM` env threshold, default 0.25) rather than the numeric quality-feature thresholds (loudness/clipping/noise-floor) this section calls for, and it returns a single accept/reject signal rather than the reason-code enum PRD-04 requires. There is no minimum-accepted-cough-count concept anymore since capture moved to one continuous recording (PRD-03).
>
> **Required output (remaining):** define the reason-code enum (too quiet / clipped / background noise / no detectable cough / unsupported encoding) and wire it out of `yamnetService`'s response instead of a bare pass/fail; define the runtime latency budget; version the preprocessing/quality-gate pair so evaluation and serving can be checked for parity
>
> **Affected documents:** `data-evaluation-plan.md`, `project-architecture.md`, `product-requirements.md` only if behavior changes, `implementation-plan.md`
>
> **Completion rule:** replace this block with the quality/preprocessing contract and sanitized test vectors

## 5. Model-selection evidence gate

### 5.1 Baseline [MVP]

Establish a reproducible log-mel cough model plus a simple clinical branch and participant-level fusion. The baseline exists to create an honest floor, not to guarantee clinical usefulness.

### 5.2 Candidate [Stretch]

Benchmark one pretrained health/audio encoder, such as HeAR, only after confirming license, ROCm compatibility, input alignment, memory, latency, and reproducibility. Candidate promotion must be based on participant-grouped and country-shift evidence rather than one aggregate AUROC.

> **(overtaken by an unevaluated shipped model) OWNER INPUT REQUIRED — Daffa — originally due 2026-06-29**
>
> **Blocks:** `ML-1`, candidate promotion, artifact packaging, and final architecture
>
> **Status (2026-07-11):** the "baseline versus candidate" framing did not happen. What shipped is a single model — XGBoost on a 1036-feature vector (1024-dim WavLM audio embedding from Fireworks + 12 demographic features) — packaged as ONNX and served from `xgboostService` (`project-architecture.md` §15.5). There is no recorded comparison against the log-mel baseline this section describes, no promotion decision, and no fallback artifact. Treat the shipped model as an unvalidated first attempt, not a gate-passed candidate.
>
> **Required output:** name the exact training run that produced the shipped XGBoost checkpoint (data, split, hyperparameters); either retroactively evaluate it against the promotion thresholds below or explicitly document that the hackathon submission ships without a passed evidence gate; define numeric promotion thresholds for discrimination, calibration, country-fold regressions, latency, and memory for any future retraining; define a fallback artifact
>
> **Affected documents:** `data-evaluation-plan.md`, `project-architecture.md`, `evidence-register.md`, `implementation-plan.md`
>
> **Completion rule:** replace this block with the signed gate and the shipped model's evaluation result (or the explicit decision to ship without one)

### 5.3 Prisma CXR models [MVP]

The digital-CXR classifier is a separate model family with its own evidence gate. The implemented research framework (`backend/python/project`) provides interchangeable backbones — **DenseNet121, EfficientNet-B0, BiomedCLIP, and Rad-DINO** — emitting unified `embedding` + `logits`, with **retrieval-augmented inspection** (FAISS k-nearest-neighbour over saved embeddings with evidence aggregation) and **Grad-CAM** overlays. Backbone promotion uses the same source-grouped, leakage-aware evidence standard as Gema; the chosen Prisma backbone, calibration, and thresholds are versioned independently of Gema and never fused with it.

> **(partly overtaken) OWNER INPUT REQUIRED — Daffa — originally due 2026-06-29**
>
> **Blocks:** `ML-5`, Prisma artifact packaging, and the `POST /api/v1/cxr` contract
>
> **Status (2026-07-11):** the serving backbone is decided and shipped — `local_clahe`, a DenseNet121 (`encoder.features` → 1024→256 embedding → single logit) with CLAHE preprocessing, loaded `strict=True` from `best.pt` (`project-architecture.md` §15.4) — not the multi-backbone framework (EfficientNet-B0/BiomedCLIP/Rad-DINO) still described below as the research option set. A post-training quantum-kernel evaluation was actually run and is served live at `GET /api/v1/quantum`: PCA-4 embeddings (98.9% variance retained) classified with a PennyLane `lightning.qubit` 4-qubit Quantum-Kernel-SVM, reaching 98.3% accuracy / 1.00 ROC-AUC, matching a classical RBF-SVM baseline on the same held-out split (§15.4; treat this as a Jaga result per §7.1, not a published benchmark).
>
> **Required output (remaining):** name the exact CXR dataset(s) and source-grouped split used to produce `best.pt` and the quantum-kernel evaluation (not documented in the repository); confirm non-redistribution status; document the calibration partition and band thresholds actually used for the CXR sigmoid output; define retrieval/Grad-CAM inspection limits if those research-tree features are surfaced in the serving path
>
> **Affected documents:** `data-evaluation-plan.md`, `project-architecture.md`, `evidence-register.md`, `implementation-plan.md`
>
> **Completion rule:** replace this block with the signed Prisma model/evaluation gate; Prisma evidence is reported separately from Gema and never combined

## 6. Calibration, bands, and urgency

- Fit calibration on a partition not used to fit model parameters and never on held-out test labels.
- Report calibration curve, Brier score, and expected calibration error alongside AUROC.
- Define **Lower**, **Intermediate**, and **Higher model-estimated risk** as relative research bands, not clinical diagnoses.
- Every band requires confirmatory evaluation; thresholds may change urgency wording only.
- Store calibration and thresholds as versioned artifacts linked to the model and preprocessing versions.

> **OWNER INPUT REQUIRED — Daffa — originally due 2026-06-29**
>
> **Blocks:** `ML-3`, result schema, and PRD-06 implementation
>
> **Status (2026-07-11):** not done for Gema. The shipped `xgboostService` maps its raw probability to Lower/Intermediate/Higher using a hardcoded `< 0.33` / `< 0.66` split (`main.rs`, `riskBand`) — a fixed decision threshold, not a calibration method fit on a held-out partition. No calibration curve, Brier score, ECE, or artifact version exists for Gema. The result is still displayed to users as a probability (PRD-06/§3.6) even though this section's bar for showing one is not met — see `project-architecture.md` §16.2 and `product-requirements.md` §3.6 for the flagged risk.
>
> **Required output:** select a calibration method and fitting partition for Gema; define the numeric band/urgency thresholds and rationale (replacing the current unexplained 0.33/0.66 split); define uncertainty/confidence intervals; define behavior outside calibrated support; define artifact serialization/versioning; define conditions that withhold probability
>
> **Affected documents:** `data-evaluation-plan.md`, `project-architecture.md`, `implementation-plan.md`, deterministic result copy
>
> **Completion rule:** replace this block with signed calibration/threshold policy — until then, the result UI's calibration-status field must say the estimate is uncalibrated rather than imply otherwise

## 7. Metrics and reporting

### 7.0 Actual Jaga results reported so far (2026-07-11)

These are the only numbers currently traceable to this repository's own runs, not to CODA or another paper. Everything else in §7.1 is still outstanding for Gema.

| Result | Value | Source | Scope |
|---|---|---|---|
| Prisma quantum-kernel SVM accuracy | 98.3% | `backend/modelServerandTraining/PrismaServer/app/models/local_clahe/quantum/quantum_metrics.json`, surfaced via `GET /api/v1/quantum` | Held-out split of PCA-4-reduced DenseNet121 embeddings; matches a classical RBF-SVM baseline on the same split. Split/dataset provenance is not documented (§5.3 owner block). |
| Prisma quantum-kernel SVM ROC-AUC | 1.00 | same as above | Same scope and caveat. |
| Gema XGBoost sanity-check probability | 0.494487 (Rust reimplementation matches the Python/ONNX reference within 1e-3) | `xgboostService/src/model.rs` test | This is an implementation-correctness check (Rust preprocessor matches the reference), not a discrimination or calibration metric — do not present it as an accuracy figure. |

No participant-level AUROC, sensitivity/specificity, calibration curve, or country-fold result exists for Gema. Do not let PM-1 sign off a metric sheet that implies otherwise.

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

> **OWNER INPUT REQUIRED — Daffa — originally due 2026-06-29**
>
> **Blocks:** reproducibility sign-off and `ML-4`
>
> **Status (2026-07-11):** still open. Neither `GemmaTraining` nor `PrismaTraining` contains a run manifest, split manifest, model card, or one-command evaluation entrypoint; `PrismaServer`'s bundled `local_clahe/quantum/quantum_metrics.json` is the closest thing to a metric report that exists, and it covers only the quantum-kernel comparison, not the full CXR model.
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

**As of 2026-07-11, none of these are met for Gema** — a model is trained and served (§11), but it shipped without the evidence gate this section requires. This is the single biggest gap between this document and the running system; do not let a working demo substitute for it in any evidence or metrics claim (README, pitch, video, PM-1 sign-off).

## 11. As-built ML status (2026-07-11)

What actually exists in the repository, for anyone deciding what to fix before submission versus what to leave as a known limitation:

| Component | Built? | Evaluated per this document's standard? |
|---|---|---|
| Audio preprocessing (DC-offset, high-pass, silence trim, normalize) | Yes — pure Go, shared by evaluation and serving in principle | Not verified that a matching offline evaluation pipeline exists |
| Cough-quality gate | Yes — YAMNet ONNX cough-class confidence (`yamnetService`) | No reason-code enum, no measured false-accept/false-reject rate |
| Gema TB-probability model | Yes — XGBoost on WavLM embedding + 12 demographic features (`xgboostService`) | No — no split manifest, no discrimination/calibration metrics, no country-fold results |
| Gema risk bands | Yes — fixed 0.33/0.66 cutoffs on the raw probability | No — not a fitted calibration artifact (§6, §16.2 of the architecture doc) |
| Prisma CXR model | Yes — `local_clahe` DenseNet121 with CLAHE preprocessing | Partial — quantum-kernel comparison exists (98.3% / 1.00 ROC-AUC) but its split/dataset provenance is undocumented |
| Prisma quantum-kernel highlight | Yes — PennyLane `lightning.qubit`, served at `GET /api/v1/quantum` | Evaluated against a classical RBF-SVM baseline; both details above still apply |
| Reproducibility artifacts (run/split manifests, model cards) | No | N/A |

Use this table, not the presence of a working demo, to decide what PM-1 can honestly claim.
