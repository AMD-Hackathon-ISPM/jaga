# Jaga · Data & Evaluation Plan

**Type:** ML methodology · **Audience:** ML/eng
**Canonical for:** datasets, splits, leakage controls, model selection, calibration, and how we report results.
> Companions: `evidence-register.md` · `project-architecture.md` · `product-requirements.md`.

This is how we stay scientifically honest under time pressure. All numeric claims trace to `evidence-register.md`.

---

## 1. Framing
Jaga is an **investigational research prototype**, not a cleared medical device. The model outputs a **calibrated TB-risk estimate that prioritizes who should get a confirmatory test** (GeneXpert/sputum). Every symptomatic user is directed to confirmatory evaluation regardless of score. We never claim diagnosis or validated field performance.

## 2. Datasets
- **Core — CODA TB (cough + clinical).** Controlled-access via Synapse; **Daffa has access via ORCID**. Training 1,105 participants; separate held-out validation; ~2,143 adults, 7 countries; cohort = **adults 18+ with ≥2 weeks of cough (symptomatic)**; solicited/guided cough protocol. Don't redistribute; honor the data-use terms.
- **Stretch — TB CXR (digital).** [Kaggle cleaned TB CXR](https://www.kaggle.com/datasets/scipygaurav/tuberculosis-tb-chest-x-ray-cleaned-database) + Shenzhen/Montgomery. **Different patients from CODA.**

## 3. Documented MVP cohort (scope of validity)
- **Symptomatic adults (18+)** with cough — matches CODA enrollment. We do **not** claim performance for children, asymptomatic screening, or general population; state this as a limitation.
- Capture follows the CODA protocol: **guided/solicited coughs** (exact count to confirm on Synapse), plus the clinical fields CODA actually collected (align inputs to available CODA variables — no invented features).

## 4. Leakage controls (non-negotiable)
- **Subject-level splits** — never let the same participant appear in both train and test.
- **Leave-one-country-out** evaluation where feasible (CODA spans 7 countries) → estimates out-of-distribution behavior.
- **CXR source-leakage guard:** because TB and normal CXR come from different sources, split/evaluate **by source** and strip borders/annotations, so the model learns pathology, not scanner artifacts. Treat any high CXR AUROC as suspect until source-controlled.
- Honor an **audio-quality gate** before scoring (reject unusable recordings) so eval reflects usable inputs.

## 5. Model-selection evidence gate
1. **Baseline:** log-mel + a small classifier on cough + clinical. Establishes an honest floor.
2. **Candidate:** a pretrained audio encoder (e.g. HeAR-style) in the **pinned ROCm container**.
3. **Promotion criteria — promote the candidate over the baseline only if it passes ALL:** acceptable **license**, **reproducible** run, acceptable **latency**, gains hold under **participant-grouped** and **leave-one-country-out** evaluation. **Ties favor the simpler model.**
- HeAR note: too large for on-device — irrelevant since we serve in the cloud, but use distilled embeddings / a smaller encoder if size/latency is a problem.

## 6. Calibration & thresholds
- Calibrate the probability (Platt/isotonic) so the displayed estimate is meaningful.
- Set the referral threshold against the **2025 WHO TPP** profiles (tiered; see `evidence-register.md`) as the **aspiration we measure against**, not a promised result. Report the operating point (sensitivity/specificity) we actually achieve.

## 7. Reporting (what we publish in the demo + repo)
- AUROC with confidence intervals; sensitivity/specificity at the chosen threshold; calibration curve.
- **Subgroup metrics** (by country, sex, age band where N allows).
- A plain **limitations** section: symptomatic-adult cohort only, internal benchmark, expected out-of-distribution drop (external-validation studies show performance falls on new populations — cite the specific paper once located), triage-not-diagnosis.
- **CXR (if built):** reported as a **separate, independent** TB-likelihood (its own metrics) — **never** a fused cough+X-ray number (no paired data exists).

## 8. Privacy
Inputs are processed for **transient cloud inference and not retained**; no request-body logging; no patient-data persistence; de-identify what we can. (See API rules in `project-architecture.md`.)

## Open items
- Confirm CODA held-out count + exact guided-cough count (Daffa, on Synapse).
- Locate the specific external-validation (out-of-distribution) paper to cite.
- Decide final audio backbone after the evidence gate.
