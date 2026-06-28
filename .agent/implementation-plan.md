# Jaga · Implementation Plan

**Type:** Execution plan · **Audience:** whole team
**Canonical for:** the 5-day build, ticket ownership, dependencies, fallbacks, and submission deliverables.
> Companions: `product-requirements.md` · `project-architecture.md` · `data-evaluation-plan.md`.

**Window:** **6 Jul → 11 Jul 2026** (~5 days; confirm exact 15:00 UTC boundaries). Priorities: **P0** must ship · **P1** if on track · **P2** stretch.

---

## Pre-sprint (do now — critical path)
- [x] **CODA access** — Daffa has it via ORCID (Synapse). *(Unblocked.)*
- [ ] Pull CODA, confirm held-out split + guided-cough count + clinical variables (Daffa).
- [ ] Pin the **ROCm container** + repo scaffold, `.gitignore`, MIT `LICENSE` (done), CI-lite (Zeddin).
- [ ] Agree the **API contract** (below) so frontend + ML proceed in parallel (Zeddin + Kei).

## P0 — must ship
| # | Task | Owner | Depends on |
|---|---|---|---|
| 1 | Baseline **cough + clinical** model on MI300X (log-mel + classifier) | Daffa | CODA pull |
| 2 | **Subject-level + leave-one-country-out** eval; calibration; subgroup metrics | Daffa | #1 |
| 3 | Inference service (FastAPI) on **AMD Dev Cloud**, behind the API contract | Zeddin | #1, API contract |
| 4 | Capture journey PWA (demographics → symptoms → guided coughs, audio-quality gate) | Kei | API contract |
| 5 | Result dashboard: calibrated band + spectrogram + **model-attention** + contributing factors + **deterministic bilingual referral** + limitations | Kei + Billy | #3 |
| 6 | Honest metrics writeup + limitations (from #2) into the result + repo | Daffa + Fransisco | #2 |
| 7 | Deploy online (public URL), containerized; smoke-test end to end | Zeddin | #3, #5 |
| 8 | Demo video + slides + public repo (MIT) | Fransisco + Billy | #5, #7 |

## P1 — if on track
- Evidence-gate a pretrained audio encoder vs baseline (promote only if it passes all gate criteria) — Daffa.
- Polish the signature result-reveal motion — Billy.
- Optional Fireworks richer note (deterministic copy stays the default) — Zeddin.

## P2 — stretch
- **Independent CXR module** (digital only, source-aware split, separate panel, **no fusion**, internal-benchmark framing) — Daffa.

## API contract (v1)
- `POST /api/v1/triage` — guided-cough audio + supported clinical fields (age, sex, symptoms, known TB contact…).
- **Response:** model id/version · quality-gate status · calibrated research estimate · relative risk band (Low/Elevated/High) · urgency priority · **mandatory confirmatory-referral** flag · inspection artifacts (spectrogram + attention) · limitations.
- **Error responses:** invalid input · insufficient/low-quality audio · model-unavailable · timeout.
- **Rules:** no request-body logging; no patient-data persistence; transient inference only.

## Fallbacks
- 70B/large encoder won't train/serve in time → ship the **baseline cough+clinical** (still valid). 
- CXR slips → drop it (it's P2, no dependency).
- Pretrained encoder fails the gate → keep the baseline (ties favor simpler).
- Fireworks/online note flaky → deterministic referral copy is the default anyway.

## Submission deliverables (confirm against event page)
Public repo (MIT) · deployed app URL · demo video · slide deck · written submission. Containerization: prepare it; confirm if mandatory.

## Definition of done (P0)
End-to-end online flow on AMD; cough+clinical calibrated triage with honest, subject-level/LOCO metrics + limitations shown; explainable result; deterministic bilingual referral; deployed at a public URL; repo + video + slides submitted.
