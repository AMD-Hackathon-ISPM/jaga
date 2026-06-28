# Jaga · Evidence Register

**Document type:** Evidence register
**Audience:** Product, engineering, design, ML, reviewers, and pitch team
**Status:** Active · pre-development
**Canonical for:** Every external factual, medical, dataset, market, hardware, and hackathon claim
**Companion documents:** [`product-brief.md`](product-brief.md), [`product-requirements.md`](product-requirements.md), [`project-architecture.md`](project-architecture.md), [`data-evaluation-plan.md`](data-evaluation-plan.md), [`context-dump.md`](context-dump.md)

## How to read this document

Use the claim IDs when repeating facts in another document or presentation. Prefer the canonical wording and preserve the listed limitation. A new factual claim must be added here before it appears elsewhere. Product behavior and safety live in the PRD; this register supplies evidence but does not create clinical authorization.

## 1. Epidemiology and screening

| ID | Canonical claim | Primary source | Checked | Limitation / permitted wording |
|---|---|---|---|---|
| EPI-01 | TB was the world's leading cause of death from a single infectious agent in 2024. | [WHO Global TB Report 2025 factsheet](https://cdn.who.int/media/docs/default-source/global-tuberculosis-report-2025/global-tb-report-2025_factsheet.pdf) | 2026-06-28 | Prefer WHO's wording; do not imply TB is the leading cause of death overall. |
| EPI-02 | WHO estimated 10.7 million incident TB cases and 8.3 million notified diagnoses in 2024, leaving approximately 2.4 million people undiagnosed or unreported. | [WHO Global TB Report 2025](https://www.who.int/publications/b/81626) | 2026-06-28 | The gap combines underdiagnosis and underreporting. Do not call it “one third missed.” |
| EPI-03 | Indonesia accounted for about 10% of global incident TB cases in 2024, second after India. | [WHO 2025 TB incidence](https://www.who.int/teams/global-programme-on-tuberculosis-and-lung-health/tb-reports/global-tuberculosis-report-2025/tb-disease-burden/1-1-tb-incidence) | 2026-06-28 | “Second-highest burden” and “about 10% of incident cases” are supported. |
| EPI-04 | A positive TB screen is not a diagnosis and should be followed by confirmatory evaluation. | [WHO systematic screening Q&A](https://www.who.int/news-room/questions-and-answers/item/systematic-screening-for-tb) | 2026-06-28 | Jaga is not a WHO-recommended screening test. |
| EPI-05 | WHO's 2025 TPP identifies community health workers as an important target user group for future TB screening tests. | [WHO 2025 screening-test TPP](https://tbksp.who.int/sites/default/files/2025-08/9789240113572-eng.pdf) | 2026-06-28 | A target product profile guides development; it is not approval of Jaga. |

## 2. WHO performance profiles

The 2025 TPP replaced the older universal 90% sensitivity / 70% specificity shorthand with three use-case profiles.

| ID | Test profile | Minimum | Optimal | Product implication |
|---|---|---|---|---|
| WHO-01 | High-sensitivity and high-specificity single-step screen | 90% sensitivity / 80% specificity | 95% / 95% | Comparison only; Jaga does not claim to meet it. |
| WHO-02 | High-sensitivity test used in a two-step screen | 90% sensitivity / 60% specificity | 95% / 85% | Closest aspirational comparison if Jaga is followed by another screen. |
| WHO-03 | Moderate-sensitivity, high-specificity single-step screen | 60% sensitivity / 98% specificity | 70% / 98% | Intended for specific hard-to-reach contexts; not automatically Jaga's profile. |

Source for WHO-01 through WHO-03: [WHO 2025 target product profiles for tuberculosis screening tests](https://tbksp.who.int/sites/default/files/2025-08/9789240113572-eng.pdf).

## 3. CODA dataset and published performance

| ID | Canonical claim | Primary source | Checked | Limitation / permitted wording |
|---|---|---|---|---|
| CODA-01 | CODA contains 733,756 cough events from 2,143 adults across India, Madagascar, the Philippines, South Africa, Tanzania, Uganda, and Vietnam. | [CODA dataset paper](https://www.nature.com/articles/s41597-024-03972-z) | 2026-06-28 | This describes the full dataset, not the downloadable training partition. |
| CODA-02 | Participants were adults aged 18+ with a new or worsening cough lasting at least two weeks, recruited through outpatient clinics. | [CODA dataset paper](https://www.nature.com/articles/s41597-024-03972-z) | 2026-06-28 | Models trained here cannot be claimed for children, asymptomatic screening, or the general population. |
| CODA-03 | The participant-level split is 1,105 training and 1,038 held-out validation participants. | [CODA dataset paper](https://www.nature.com/articles/s41597-024-03972-z) | 2026-06-28 | Held-out data is evaluated through the Synapse process rather than downloaded. |
| CODA-04 | Participants were asked to cough five times, standing 60–90 cm from a clinic phone; participants producing at least three coughs were retained. | [CODA dataset paper](https://www.nature.com/articles/s41597-024-03972-z) | 2026-06-28 | Jaga uses five guided coughs, but field-device and background-noise generalization remains unproven. |
| CODA-05 | The released audio uses 0.5-second cough segments recorded at 44.1 kHz with 32-bit floating-point precision. | [CODA dataset paper](https://www.nature.com/articles/s41597-024-03972-z) | 2026-06-28 | Runtime capture may differ; Daffa must document preprocessing compatibility. |
| CODA-06 | Training data is controlled-access through Synapse: users must be certified and validated, submit intended use, accept terms, and not redistribute data. | [CODA dataset paper](https://www.nature.com/articles/s41597-024-03972-z) · [Synapse project](https://www.synapse.org/Synapse:syn31472953) | 2026-06-28 | Do not call CODA a public download or commit its data/audio to this repository. |
| CODA-07 | In held-out CODA evaluation, cough-only AUROC ranged 0.69–0.74 and cough-plus-clinical AUROC ranged 0.78–0.83; the best combined model reached 73.8% specificity at 80% sensitivity. | [CODA challenge results](https://pubmed.ncbi.nlm.nih.gov/41064697/) | 2026-06-28 | These are published benchmark ranges, not Jaga's results. |
| CODA-08 | External validation in 303 coughing adults in Peru produced AUCs of 0.480–0.615 for the CODA cough-only models, below their internal 0.689–0.743 range. | [2026 Peru external validation](https://www.nature.com/articles/s41598-026-50492-4) | 2026-06-28 | This result concerns cough-only challenge models; it demonstrates generalization risk but does not directly evaluate Jaga or CODA cough-plus-clinical entries. |
| CODA-09 | The documented CODA training variables are sex, age, height, weight, reported cough duration, prior TB diagnosis and type, haemoptysis, heart rate, temperature, weight loss, smoking in the last week, fever, and night sweats. | [CODA dataset paper](https://www.nature.com/articles/s41597-024-03972-z) | 2026-06-28 | Availability does not mean every variable must be predictive; Daffa must declare the exact signed subset and missing-value representation. Known TB contact is not in this documented list. |
| CODA-10 | A 2026 reproducible baseline (Selisios, *Sensors*) trained Logistic Regression and CatBoost on the CODA solicited set (9,772 cough samples from 1,105 adults), comparing cough-audio-only against fused audio-plus-clinical models under cougher-disjoint nested (10×5) cross-validation, with isotonic probability calibration and conformal-prediction uncertainty quantification. | [Selisios 2026 · Sensors 26(4):1223](https://www.mdpi.com/1424-8220/26/4/1223) · DOI [10.3390/s26041223](https://doi.org/10.3390/s26041223) | 2026-06-28 | This is the published fused baseline Jaga mirrors. The paper encodes clinical inputs as continuous (age, height, weight, cough duration, heart rate, temperature) plus 0/1 binaries (sex and yes/no symptoms), reports no missing values in the solicited set, and z-score standardizes on training folds only. It does **not** state a one-hot "prior TB type" expansion or a "16-feature" vector count; Daffa must confirm the exact feature vector against the CODA data dictionary and his training code before that wording is used. Quote exact fused metrics only from the paper's results tables; cross-reference CODA-07 for the published fused AUROC range (0.78–0.83). Do not assert a fused AUROC not taken from the paper. |

## 4. Hardware and model references

| ID | Canonical claim | Primary source | Checked | Limitation / permitted wording |
|---|---|---|---|---|
| AMD-01 | AMD Instinct MI300X has 192 GB HBM3 and 5.3 TB/s peak theoretical memory bandwidth. | [AMD MI300X product page](https://www.amd.com/en/products/accelerators/instinct/mi300.html) | 2026-06-28 | Hardware capacity does not by itself prove product performance. |
| AMD-02 | ROCm supports PyTorch training and inference on MI300X and provides prebuilt PyTorch containers. | [ROCm PyTorch installation](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/install/3rd-party/pytorch-install.html) | 2026-06-28 | Daffa must pin the actual image and verify the selected model. |
| MODEL-01 | HeAR is a ViT-L health-acoustic encoder for two-second 16 kHz clips; its model card says the current model is too large for on-device deployment. | [HeAR model card](https://huggingface.co/google/hear) | 2026-06-28 | HeAR is a candidate, not the selected Jaga model. License, ROCm behavior, latency, and evaluation must pass the evidence gate. |

## 5. Competition and market evidence

| ID | Canonical claim | Primary source | Checked | Limitation / permitted wording |
|---|---|---|---|---|
| COMP-01 | Swaasa has published a cough-plus-symptom TB screening study on 567 participants, reporting 90.36% sensitivity and 84.67% specificity in its study. | [Scientific Reports / PubMed](https://pubmed.ncbi.nlm.nih.gov/36959347/) | 2026-06-28 | Single-study results do not establish universal performance; “cough on a phone” is not Jaga's differentiator. |
| COMP-02 | WHO approved six CAD products in June 2025 for TB screening from chest X-rays in people aged 15+. | [WHO CAD announcement](https://www.who.int/news/item/11-06-2025-who-approves-six-software-products-for-computer-aided-detection-of-tb-on-chest-x-ray) | 2026-06-28 | Do not claim all competing CXR products require radiologist interpretation. |
| FUND-01 | As of June 2025, the Global Fund reported providing 73% of international TB financing and investing US$10.5 billion in TB programmes since 2002. | [Global Fund TB page](https://www.theglobalfund.org/en/tuberculosis/) | 2026-06-28 | Do not repeat the unsupported “US$4B per year” statement. |
| MARKET-01 | Commercial TB-diagnostics market estimates are secondary research and vary by vendor. | [Precedence Research estimate](https://www.precedenceresearch.com/tuberculosis-diagnostics-market) | 2026-06-28 | If used, label it a vendor estimate rather than an authoritative market fact. |

## 6. Hackathon logistics

| ID | Canonical claim | Primary source | Checked | Limitation / permitted wording |
|---|---|---|---|---|
| EVENT-01 | The official event runs 6 July 2026, 15:00 UTC to 11 July 2026, 15:00 UTC. | [ACT II live page](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-ii/live) | 2026-06-28 | Jakarta time is 22:00 WIB on both dates. |
| EVENT-02 | Unicorn Track judging covers creativity and originality, completeness, use of AMD platforms, and product/market potential. | [ACT II event page](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-ii) | 2026-06-28 | Include all four categories in planning and pitch review. |
| EVENT-03 | Submissions must be containerized, use a public repository with setup/usage instructions, and be runnable from those instructions. | [ACT II submission requirements](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-ii) | 2026-06-28 | This is mandatory, not an open question. |
| EVENT-04 | Required submission assets include title/descriptions/tags, cover image, video, slide presentation, public repository, demo platform, and application URL. | [ACT II submission requirements](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-ii) | 2026-06-28 | Fransisco owns the completeness checklist. |

## 7. Removed or prohibited claims

Do not use these statements in current specifications, README copy, or pitch material:

- “Validated product,” “validated core,” or any claim of validated field performance.
- “CODA is public data” or “public CODA corpus.”
- “One third of TB cases are missed.”
- A universal WHO target of 90% sensitivity / 70% specificity.
- “More inputs always increase confidence.”
- “Attention shows the model's reasoning.”
- “No lab is required” without immediately stating that confirmatory evaluation is still required.
- “Cough on a phone is unique.”
- A fused cough-plus-CXR performance number.
- Jaga diagnoses, rules out, clears, or confirms tuberculosis.

## 8. Owner evidence required

> **OWNER INPUT REQUIRED — Daffa — due 2026-06-29**
>
> **Blocks:** completion of `ML-0`, `ML-1`, and the production inference contract
>
> **Required output:** confirm accessible Synapse files and variables; record data-use restrictions accepted by the team; provide the pinned ROCm image; document the baseline and candidate model identifiers; define promotion thresholds; and add actual Jaga metrics only after a reproducible run
>
> **Affected documents:** `evidence-register.md`, `data-evaluation-plan.md`, `project-architecture.md`, `implementation-plan.md`
>
> **Completion rule:** replace this block with dated evidence rows linking the run manifest/model card, then append the decision to `log.md`
