# Jaga · Evidence Register

**Type:** Evidence ledger · **Audience:** all
**Canonical for:** every factual/medical claim used anywhere in the repo.
> Companions: `product-brief.md` · `product-requirements.md` · `project-architecture.md` · `data-evaluation-plan.md` · `context-dump.md`.

**Rule:** any number or claim in the brief, README, PRD, architecture, or pitch must trace to a row here. If it's not in this table, don't state it as fact. Review dates show when we last verified.

---

## Epidemiology & problem
| Claim | Verified value | Source | Last checked | Limitations / notes |
|---|---|---|---|---|
| TB is the world's deadliest infectious disease again | Yes (2024) | [WHO GTB 2025 news](https://www.who.int/news/item/12-11-2025-global-gains-in-tuberculosis-response-endangered-by-funding-challenges) | 2026-06-27 | — |
| Global detection gap | ~10.7M estimated vs ~8.3M notified = **~2.4M (~22%) gap** in 2024 | [WHO GTB 2025](https://www.who.int/news/item/12-11-2025-global-gains-in-tuberculosis-response-endangered-by-funding-challenges) | 2026-06-27 | Gap = under-diagnosis **and** under-reporting. **Do NOT say "1/3 of cases missed"** (outdated). |
| Indonesia burden | #2 globally; ~8.8% of the global detection gap | [WHO 2025 SEARO](https://www.who.int/southeastasia/news/detail/18-11-2025-south-east-asia-leads-global-tb-cases-who-urges-swift-action-to-address-gaps-and-boost-progress) | 2026-06-27 | Use "#2 burden / top gap contributor," not "~10% of cases." |
| Access barrier | X-ray needs machines + trained readers; sputum microscopy low-sensitivity; rural facilities lack power/staff | [diagnosis-delay study](https://pmc.ncbi.nlm.nih.gov/articles/PMC9803213/) | 2026-06-27 | Basis for the "needs only a phone" framing. |

## Model performance (what we can honestly claim)
| Claim | Verified value | Source | Last checked | Limitations / notes |
|---|---|---|---|---|
| Cough-only TB triage AUROC | **0.69–0.74** | [CODA challenge results](https://pmc.ncbi.nlm.nih.gov/articles/PMC12502651/) | 2026-06-27 | Independent validation across 7 countries. |
| Cough + clinical AUROC | **0.78–0.83** (our target) | [CODA challenge](https://pmc.ncbi.nlm.nih.gov/articles/PMC12502651/) | 2026-06-27 | Best model ~73.8% specificity @ 80% sensitivity. This is our **core** target. Internal validation only. |
| **External validation (Peru)** — performance drops sharply out-of-distribution | CODA models fell to **AUC 0.48–0.615** on 303 Lima adults (vs 0.69–0.74 internal); best stayed best; better in ≥35y + prior-TB | [Scientific Reports, May 2026](https://www.nature.com/articles/s41598-026-50492-4) | 2026-06-27 | **Critical honesty point** — internal AUROC does not transfer; state this limitation prominently. Justifies triage-not-diagnosis + local re-calibration. |
| Classical TB-CXR AUROC | ~0.90+ in-dataset | [TB CXR DL study](https://pmc.ncbi.nlm.nih.gov/articles/PMC10406978/) | 2026-06-27 | **In-dataset only; drops out-of-distribution** (source-leakage risk — see data-evaluation-plan). CXR = optional/independent. |
| WHO accuracy targets | **2025 TPPs** (13 Aug 2025): tiered — high-sensitivity ≥90% sens, high-specificity ≥98% spec; moderate acceptable in high-prevalence | [WHO 2025 TPP news](https://www.who.int/news/item/13-08-2025-who-releases-new-target-product-profiles-for-tuberculosis-screening-tests) · [TPP PDF](https://tbksp.who.int/sites/default/files/2025-08/9789240113572-eng.pdf) | 2026-06-27 | **Replaces the old single "90%/70% triage" benchmark.** Frame as an aspiration, not an expected result. |

## Dataset
| Claim | Verified value | Source | Last checked | Limitations / notes |
|---|---|---|---|---|
| CODA access | **Controlled-access via Synapse** (Certified+Validated user, ORCID, Intended Data Use Statement, no-sharing). **Daffa has access via ORCID.** | [CODA dataset paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC10996751/) · [Synapse syn31472953](https://www.synapse.org/Synapse:syn31472953) | 2026-06-27 | Not a free download — keep credentials/terms in mind; don't redistribute. |
| CODA size & cohort | ~2,143 adults, 7 countries (India, Madagascar, Philippines, South Africa, Tanzania, Uganda, Vietnam); **733,756 cough sounds**; **even split → ~1,105 train / ~1,038 held-out**; enrolled adults with **≥2 weeks of cough (symptomatic)** | [CODA dataset paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC10996751/) | 2026-06-27 | Cohort = **symptomatic adults 18+** = our documented MVP cohort. Confirm exact split labels on Synapse. |
| Cough protocol | **Five solicited coughs** per participant (60–90cm from mic); retained if **≥3 coughs**; extra coughs from fits also kept | [CODA dataset paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC10996751/) | 2026-06-27 | Our capture must replicate this (5 guided coughs). |
| TB CXR dataset (stretch) | Qatar/Dhaka "TB Chest Radiography Database" (cleaned), digital CXR, binary TB/normal (~700 TB + ~3,500 normal) | [Kaggle cleaned set](https://www.kaggle.com/datasets/scipygaurav/tuberculosis-tb-chest-x-ray-cleaned-database) | 2026-06-27 | **Different patients from CODA → no fusion.** TB vs normal from different sources → **source-leakage risk**; digital only (not photographed films). |

## Competitive / market
| Claim | Verified value | Source | Last checked | Limitations / notes |
|---|---|---|---|---|
| CAD can replace radiologists | WHO permits AI-CAD in place of human readers (15+); 6 products approved Jun 2025 | [WHO CAD approval](https://www.who.int/news/item/11-06-2025-who-approves-six-software-products-for-computer-aided-detection-of-tb-on-chest-x-ray) | 2026-06-27 | **Do NOT claim "incumbents still need a radiologist."** |
| Closest comparable | Swaasa — phone cough + clinical screening, already deployed | [Swaasa (SSIR)](https://ssir.org/articles/entry/coughing-app-tuberculosis-detection) | 2026-06-27 | "Cough on a phone" is **not** a differentiator by itself. |
| Funding proof | Qure.ai raised ~$156M, ~$16.4M revenue (2024), Gates-backed | [PitchBook](https://pitchbook.com/profiles/company/227468-62) | 2026-06-27 | Category is fundable + real. |
| Market size | TB diagnostics ~$2.7B (2026) → $4.08B (2034) | [Precedence Research](https://www.precedenceresearch.com/tuberculosis-diagnostics-market) | 2026-06-27 | — |
| Funding pool | Global Fund ~$4B/yr; $10.5B into TB; 73% of intl TB financing | [Global Fund](https://www.theglobalfund.org/en/tuberculosis/) | 2026-06-27 | — |

## Hackathon logistics
| Claim | Verified value | Source | Last checked | Limitations / notes |
|---|---|---|---|---|
| Event window | **Starts 6 Jul, ends 11 Jul 2026** (~5-day sprint) | [ACT II event page](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-ii) | 2026-06-27 | Exact 15:00 UTC boundary **to confirm** on the schedule tab. |
| Track + criteria | **Unicorn track** — judged on **creativity, originality, product potential** | [ACT II event page](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-ii) | 2026-06-27 | (A prior review wrongly cited the *previous* AMD hackathon's 4 criteria.) |
| Containerization / repo / MIT | Containerization + public repo + MIT **to confirm** against the live page | [ACT II event page](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-ii) | 2026-06-27 | Treat as likely-required; confirm before relying. |

## To verify (open)
- Confirm exact CODA train/held-out split labels on Synapse (even split ≈ 1,105/1,038; verify the exact numbers).
- Confirm which clinical variables CODA actually provides (drives the API field list — Daffa, on access).
- Exact submission deadline time (UTC) and whether containerization/MIT are mandatory.
- *(Resolved: five-cough protocol ✓; Peru external-validation paper ✓ — both now in the tables above.)*
