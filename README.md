# Jaga

**An AI-powered tuberculosis triage tool that turns a 10-second cough plus a few clinical questions into an explainable, calibrated risk result — on any phone, no X-ray machine, lab, or radiologist required.**

[Product Brief](.agent/product-brief.md) · [Requirements](.agent/product-requirements.md) · [Architecture](.agent/project-architecture.md) · [Design Guidelines](.agent/design-guidelines.md) · [Agent Guide](AGENT.md)

---

## What is Jaga?

Jaga is a phone-first tuberculosis triage tool. A community health worker records a 10-second cough and a few clinical details, an AI model trained on AMD returns an explainable, calibrated TB-risk result in seconds, and that decides who needs a confirmatory test. _Jaga_ is Indonesian for "to watch over / to guard."

**The problem:** Tuberculosis is again the world's deadliest infectious disease. In 2024 there were an estimated [10.7M cases but only 8.3M were diagnosed and reported — a ~2.4M (≈22%) detection gap](https://www.who.int/news/item/12-11-2025-global-gains-in-tuberculosis-response-endangered-by-funding-challenges) (WHO 2025), because first-line screening needs [X-ray machines, sputum labs, and trained readers the hardest-hit communities don't have](https://pmc.ncbi.nlm.nih.gov/articles/PMC9803213/). Indonesia is the world's #2 burden country and a top contributor to that gap.

**The solution:** A phone-first screen built on the validated cough + clinical signal. It listens to a cough, combines it with symptoms and demographics into one **calibrated** TB-risk score, and shows the model's reasoning (spectrogram + attention overlay + contributing factors). The model is **trained on AMD** and served online. An optional chest-X-ray module adds an independent signal where a digital X-ray is available. **Triage, not diagnosis** — a human always stays in the loop and flagged cases go for confirmatory testing.

## Key Features

| Feature              | Description                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Listen**           | 10-second cough → mel-spectrogram + acoustic analysis, with an audio-quality gate and a model-attention overlay                   |
| **Combine**          | Cough + demographics + symptoms → one **calibrated** TB-risk probability (the validated cough+clinical core)                      |
| **Decide**           | Explainable triage band (Low / Elevated / High → refer for confirmatory test) + deterministic bilingual (Bahasa/English) referral |
| **See** _(optional)_ | Digital chest X-ray → an **independent** TB-likelihood + attention heatmap, shown alongside (not fused into the score)            |
| **Honest by design** | Real metrics vs the WHO triage target, calibration, subgroup performance, and stated limitations — no overclaiming               |

## Tech Stack (MVP)

| Layer             | Technology                                                                   |
| ----------------- | ---------------------------------------------------------------------------- |
| Frontend          | Next.js / PWA, Tailwind CSS                                                  |
| Backend / serving | Python (FastAPI), Docker, served online on **AMD Dev Cloud (MI300X)**       |
| AI (training)     | PyTorch on **AMD ROCm / Instinct MI300X**                                    |
| Model (core)      | Cough + clinical TB-triage model (compact audio model + structured features), calibrated |
| Explainability    | Mel-spectrogram + model-attention overlay, contributing factors             |
| Optional          | Fireworks API (richer bilingual note; deterministic copy is the default) · digital-CXR module (stretch) |
| Datasets (public) | CODA TB cough (paired clinical) · _(stretch)_ Kaggle TB CXR · Shenzhen / Montgomery |

## Repository Structure

```
jaga/
├── AGENT.md                      # Agent entry point (start here)
├── README.md                     # This file
├── CLAUDE.md                     # Working conventions for AI assistance
├── LICENSE                       # MIT
└── .agent/                       # Project specification documents
    ├── context-dump.md           # Full decision history and reasoning
    ├── product-brief.md          # Product vision, market, business model
    ├── product-requirements.md   # Users, scope (tagged), features, acceptance criteria
    ├── project-architecture.md   # System architecture, models, datasets, pipeline
    ├── design-guidelines.md      # Brand, voice, color, components
    ├── log.md                    # Chronological decision/change log
    └── plan-template.md          # Documentation depth standard
```

## Target Market

**The market is global:** TB's high-burden belt — India, Indonesia, the Philippines, Pakistan, China, sub-Saharan Africa — all face the same lab/radiologist/internet access gap Jaga is built for.

**Beachhead:** community health workers doing active TB case-finding in Indonesia — the world's #2 burden country, where the team has ground truth and proximity.

**Expansion path:** district TB programs and clinics (edge appliance) → NGO mobile screening camps → across the high-burden belt worldwide → additional respiratory diseases (COPD, asthma, pneumonia) on the same pipeline.

**Business model:** free tier for community health workers → per-program / per-screen cloud license for national TB programs and NGOs. The category is real and funded — the [Global Fund moves ~$4B/yr into HIV/TB/malaria](https://www.theglobalfund.org/en/tuberculosis/) and comparable tools (e.g. Qure.ai) are venture- and foundation-backed. _(An on-prem AMD "edge" deployment for fully-offline sites is a future roadmap option, not the MVP.)_

## Hackathon Context

Built for the **AMD Developer Hackathon ACT II** (lablab.ai) — **Unicorn track** (judged on creativity, originality, and product potential). The cough+clinical model is **trained on the AMD Instinct MI300X** via ROCm and served online on AMD Dev Cloud; an optional plain-language note uses the Fireworks API. Ends **11 July 2026** (≈5-day sprint — confirm start date).

**Demo narrative (≈5 min):** open on the global TB crisis and detection gap; record a cough + a few clinical answers → spectrogram + **model-attention** overlay → calibrated triage band + deterministic referral; show **honest metrics** (cough+clinical AUROC vs the WHO target, stated as an aspiration) and the **AMD training story**; land the beachhead (Indonesia → worldwide). _(Stretch: show the optional CXR signal as a separate panel.)_

## Developers

- **Daffa** — AI / ML
- **Zeddin** — Backend
- **Kei** — Frontend
- **Billy** — Frontend lead & design
- **Fransisco** — PM, presentation & video

## License

Released under the **MIT License** — see [`LICENSE`](LICENSE).

**Medical disclaimer:** Jaga is a **screening / triage** aid, not a diagnostic device. It does not diagnose tuberculosis and is not a substitute for confirmatory testing or clinical judgment.
