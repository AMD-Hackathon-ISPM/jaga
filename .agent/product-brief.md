# Jaga · Product Brief

**Document type:** Product brief
**Audience:** Team, hackathon judges, prospective programme partners, and reviewers
**Status:** Active · pre-development
**Canonical for:** Product thesis, target customer, positioning, business hypothesis, phased scope, pitch, and demo narrative
**Companion documents:** [`product-requirements.md`](product-requirements.md), [`project-architecture.md`](project-architecture.md), [`data-evaluation-plan.md`](data-evaluation-plan.md), [`evidence-register.md`](evidence-register.md), [`implementation-plan.md`](implementation-plan.md), [`design-guidelines.md`](design-guidelines.md)

## How to read this document

This brief explains why Jaga should exist and how it is positioned. It does not define clinical authorization, feature acceptance, or technical implementation. Use the PRD for behavior and safety, the evidence register for facts, and the architecture/data plans for implementation.

## 1. One-sentence pitch

> **Jaga is an investigational, phone-first TB triage prototype that combines five guided coughs with supported clinical inputs to produce a calibrated research estimate for prioritizing follow-up urgency—while directing every symptomatic adult to confirmatory evaluation.**

**Tagline:** Catch it early. Guard your community.

## 2. Problem

TB caused an estimated 10.7 million incident cases in 2024, while 8.3 million people were diagnosed and notified, leaving approximately 2.4 million undiagnosed or unreported (EPI-01, EPI-02). Indonesia represented about 10% of incident cases, the second-highest country burden (EPI-03).

Access to effective screening and confirmatory diagnostics remains uneven. Smartphone cough research is attractive because microphones are widely available, but the evidence is not yet sufficient for unsupervised clinical use. CODA's internal results improved when clinical information was added, while external cough-only validation in Peru exposed substantial generalization risk (CODA-07, CODA-08).

**Product problem:** Can a transparent, reproducible cough-plus-clinical research workflow help TB programmes study accessible triage while clearly exposing calibration, limitations, and the need for confirmatory evaluation?

## 3. Product

The MVP follows one loop:

1. Confirm the participant is a symptomatic adult within the documented research cohort.
2. Collect supported clinical inputs.
3. Record five guided coughs and run an audio-quality gate.
4. Send accepted inputs for transient cloud inference on AMD.
5. Return a calibrated research estimate, relative urgency band, and non-causal model-inspection artifacts.
6. Direct every participant to confirmatory evaluation and show limitations.

Jaga does not diagnose TB, rule TB out, decide whether someone deserves testing, or replace a national screening algorithm.

## 4. Phased scope

| Phase | Included | Explicit boundary |
|---|---|---|
| **[MVP] Hackathon** | Adult eligibility; supported clinical form; five guided coughs; quality gate; AMD-hosted cough-plus-clinical inference (**Gema**); calibration; bilingual result; limitations; mandatory confirmatory-evaluation copy; containerized public demo | Research prototype only; no real patient-care use |
| **[Stretch]** | Independent digital-CXR estimate (**Prisma**); Fireworks-generated richer explanation; result-reveal polish | Separate metrics and panel; never fused with cough score; deterministic copy remains default |
| **[V1]** | Prospective Indonesian validation plan; programme administration; accounts; audit trail; deployment hardening; offline/on-prem feasibility; regulatory and ethics work | Requires partners, representative data, prospective evaluation, privacy review, and regulatory strategy |
| **[OUT]** | Diagnosis, treatment advice, drug-resistance typing, real-patient demo, data retention, photographed-film scoring, unsupported cohorts, fused CXR+cough claim | Must not be implemented |

## 5. Target users and customer hypothesis

### 5.1 MVP user

The demo user is a community health worker conducting guided data capture for symptomatic adults. The user needs an understandable workflow, explicit audio retry guidance, and an unambiguous next step.

### 5.2 Initial programme customer

The initial customer hypothesis is an Indonesian TB programme or NGO running active case-finding research. The programme—not the participant—would evaluate whether the workflow improves reach, consistency, or prioritization.

### 5.3 Buyer and adoption gate

Likely buyers or sponsors include programme directors, NGOs, research institutions, and public-health funders. This remains a hypothesis. Adoption requires representative prospective evidence, clinical/programme governance, privacy review, integration planning, and any applicable regulatory clearance.

## 6. Business hypothesis

- A free or subsidized CHW workflow maximizes access and field learning.
- Programmes or research partners could fund deployments, evaluation, support, and per-screen infrastructure.
- The Global Fund's TB investments demonstrate an active funding ecosystem (FUND-01), but do not validate Jaga's pricing or demand.
- Commercial market estimates are secondary evidence and must be labelled as such (MARKET-01).

No revenue, willingness-to-pay, or procurement claim is treated as validated before interviews and partner evidence exist.

## 7. Competition and differentiation

- **Swaasa:** demonstrates that cough-plus-symptom phone screening already exists (COMP-01). Jaga cannot claim novelty from phone capture alone.
- **CXR CAD products:** several WHO-evaluated products already support TB screening from digital CXR (COMP-02). “No radiologist” is not a reliable differentiator.
- **Jaga's hackathon differentiation:** transparent evidence boundaries, AMD-native reproducibility, visible calibration and limitations, bilingual field UX, and honest treatment of external generalization risk.

“Open,” “explainable,” or “accessible” should be used only when the implementation proves the claim.

## 8. Research-to-product boundary

The hackathon demonstrates a technical and UX hypothesis. It does not demonstrate safety, effectiveness, programme impact, or clinical validity. Moving beyond prototype status requires:

- representative prospective data from the intended Indonesian context;
- pre-registered performance and subgroup evaluation;
- human-factors and field-usability testing;
- privacy, ethics, and regulatory review;
- integration with confirmatory-testing pathways;
- monitoring for drift, bias, and harm.

## 9. Why Jaga fits the Unicorn Track

| Criterion | Jaga response |
|---|---|
| Creativity and originality | Treat model limitations, calibration, and evidence provenance as visible product features rather than hiding uncertainty |
| Completeness | Ship one end-to-end capture → quality → inference → result → referral loop with tested failure states |
| Use of AMD platforms | Train/evaluate and serve the model through a reproducible ROCm/MI300X pipeline |
| Product/market potential | Address an important global-health workflow while clearly distinguishing the research prototype from a deployable medical product |

## 10. Timed demo narrative

| Time | Beat |
|---|---|
| 0:00–0:40 | Establish the global detection gap and Indonesia context using EPI-01 through EPI-03 |
| 0:40–1:10 | State the research boundary: symptomatic adults, five coughs, confirmatory evaluation for everyone |
| 1:10–2:20 | Complete clinical capture and guided cough recording; demonstrate a failed quality check and retry |
| 2:20–3:20 | Run AMD-hosted inference and reveal the calibrated estimate, inspection artifacts, limitations, and bilingual next step |
| 3:20–4:10 | Show actual Jaga evaluation, calibration, subgroup results, and the CODA external-generalization warning |
| 4:10–4:40 | Explain the ROCm/MI300X architecture and reproducibility |
| 4:40–5:00 | Close on the research-to-product validation path and Indonesia beachhead |

If actual Jaga metrics are unavailable, the demo must say so and may show published CODA benchmarks only when clearly labelled as external evidence.

## 11. Closing thesis

Jaga's strongest story is not that a phone can diagnose TB. It is that a small team can build an evidence-disciplined, AMD-native research prototype that makes uncertainty, safety boundaries, and the next clinical step impossible to miss.
