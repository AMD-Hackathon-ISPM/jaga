# Jaga · Product Brief

> **Jaga** (Indonesian: "to watch over / to guard"). Vision, market, business model, and positioning.
> Companions: `product-requirements.md` · `project-architecture.md` · `design-guidelines.md` · `context-dump.md`.

---

## What Jaga is
> An AI-powered tuberculosis triage tool: a community health worker records a few guided coughs (~10s) and a short clinical form on a phone, and an explainable, calibrated TB-risk estimate comes back in seconds — **no X-ray machine, no sputum lab, no on-site radiologist required** — to prioritize who needs a confirmatory test. (Inference runs online on AMD.)

**Tagline:** Catch it early. Guard your community.
**One-liner:** A few guided coughs and a short form on any phone, and an AI trained on AMD flags tuberculosis risk in seconds — no lab, no X-ray machine, no radiologist needed.
**Status & scope:** an **investigational research prototype** (triage, not diagnosis), documented for **symptomatic adults 18+** with cough — matching the CODA evidence base. *(This is the honest framing; the product ambition below is the path it's on.)*

## Why this problem (a global crisis)
TB is again the **world's deadliest infectious disease**. In 2024 there were an estimated [**10.7M cases but only 8.3M were diagnosed and reported — a ~2.4M (≈22%) detection gap**](https://www.who.int/news/item/12-11-2025-global-gains-in-tuberculosis-response-endangered-by-funding-challenges) (WHO 2025), driven by both under-diagnosis and under-reporting. The gap concentrates in a high-burden belt — India, Indonesia, the Philippines, Pakistan, China, and sub-Saharan Africa. The reason is painfully practical: first-line screening depends on equipment and staff the hardest-hit communities don't have — [an X-ray machine, a sputum lab (low-sensitivity microscopy), and trained readers; patients travel far to find broken machines](https://pmc.ncbi.nlm.nih.gov/articles/PMC9803213/). Jaga attacks that gap with a screen that needs only a phone.

**Our beachhead — Indonesia.** We start where we have ground truth and proximity: Indonesia is the [second-highest-burden country on earth (~10% of global cases)](https://www.eatg.org/hiv-news/who-global-tb-report-2024-tb-resurges-as-top-infectious-disease-killer/), with [incidence up 19% and deaths up 26% (2015–2023)](https://www.thelancet.com/journals/lanres/article/PIIS2213-2600(25)00168-7/fulltext). Building here gives us an authentic first market and a validated model before expanding across the high-burden belt.

## Why now / why this approach
A **cough is a free, instantly-available signal** — and recent research (the [CODA TB challenge](https://pmc.ncbi.nlm.nih.gov/articles/PMC12502651/)) shows cough + basic clinical data can triage TB well enough to prioritize who gets a confirmatory test. The MI300X (192GB) lets us **train that model on AMD** and serve it cheaply. The product needs only a phone at the point of care — no X-ray machine, sputum lab, or on-site radiologist — which is exactly what the high-burden belt lacks. Public datasets (cough + paired clinical data) let us build and validate it honestly.

## Why it matters (5 dimensions)
1. **Human cost:** the top infectious killer; every missed case keeps spreading TB.
2. **Equity / access:** brings first-line screening to places that lack X-ray machines, labs, and radiologists — the core of the detection gap — needing only a phone.
3. **Sustainability/market:** [TB diagnostics ~$2.7B (2026) → $4.08B (2034)](https://www.precedenceresearch.com/tuberculosis-diagnostics-market); the [Global Fund moves ~$4B/yr, $10.5B into TB to date, 73% of international TB financing](https://www.theglobalfund.org/en/tuberculosis/).
4. **Technical:** a cough+clinical TB-triage model **trained on AMD MI300X (ROCm)**, calibrated and explainable, served as an accessible phone-first screen.
5. **Authenticity:** built by an Indonesian team — Indonesia is the world's #2 TB burden and a top contributor to the global detection gap.

## Positioning
**A global, phone-first TB-triage service — B2B / B2G / NGO, not consumer.** Deployers/buyers: national TB programs, global donors (Global Fund/Stop TB), NGOs, and community health workers (CHWs) across the high-burden world. A free CHW tier drives reach; programs/NGOs license it per-program or per-screen. Inference is cloud-served on AMD.

## Market & expansion
- **Beachhead:** Indonesia (#2 burden; our home + ground truth).
- **Expansion:** the high-burden belt — India, Philippines, Pakistan, sub-Saharan Africa — then additional respiratory diseases (**COPD / asthma / pneumonia**) on the same pipeline (how Swaasa grew).
- **Model:** free CHW tier (reach + field feedback) → per-program / per-screen cloud license for TB programs and NGOs.
- **Roadmap (not MVP):** an on-prem AMD "edge" deployment for fully-offline sites — a future option, not claimed as built.
- Honest framing: a funded, impact-driven, global-health market — not a viral consumer app — but the funding is real and the need is worldwide.

## Competition (honest)
The space is real and contested. [qXR / CAD4TB / Lunit](https://www.nature.com/articles/s41598-021-03265-0) are X-ray CAD products — and note [WHO permits AI-CAD to *replace* human readers for CXR TB screening (six products approved June 2025)](https://www.who.int/news/item/11-06-2025-who-approves-six-software-products-for-computer-aided-detection-of-tb-on-chest-x-ray), so "they still need a radiologist" is **not** a valid differentiator. [Swaasa](https://ssir.org/articles/entry/coughing-app-tuberculosis-detection) is the closest comparable — phone-based cough + clinical screening, already deployed — so "cough on a phone" alone isn't our edge either. Funding proof: [Qure.ai raised ~$156M, ~$16.4M revenue (2024), Gates-backed](https://pitchbook.com/profiles/company/227468-62). **Jaga's honest difference:** an **open, explainable**, cough+clinical triage **trained on AMD**, built phone-first for the highest-gap settings — we win on execution, accessibility, transparency, and the AMD build, not on being first.

## Core pitch messages
1. *"TB is the world's deadliest infectious disease — and 2.4M cases a year go undetected, because first-line screening needs equipment the sick can't reach."*
2. *"Jaga turns a few guided coughs plus a short form into a triage decision — on any phone, with a model trained on AMD."*
3. *"Global problem, real starting line: we're building it in Indonesia, the world's #2 burden, then scaling across the high-burden belt."*

## Timeline (≈5-day sprint; ends 11 Jul 2026 — confirm start date)
D1 data + baseline cough+clinical model on MI300X · D2 calibration + subject-level/site-held-out eval + subgroup metrics · D3 frontend capture journey + result dashboard (spectrogram + model attention) + deterministic referral · D4 polish + honest metrics writeup + deploy online + demo video · D5 buffer + submit. *(Stretch: independent CXR module if time.)*

## Demo narrative
Open on the global crisis (top infectious killer; ~2.4M cases undetected each year; the access gap across the high-burden belt). Record a cough + a few clinical answers → spectrogram + **model-attention** overlay → calibrated triage band + deterministic referral; show the **honest metrics** (cough+clinical AUROC vs the WHO 2025 screening profiles, stated as an aspiration) and the **AMD training story**; land the beachhead: starting in Indonesia (#2 burden), scaling worldwide. *(Stretch: show the optional CXR signal as a separate panel.)*
