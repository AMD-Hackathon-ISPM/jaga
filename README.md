# Jaga

**An AI-powered tuberculosis triage tool that turns a few guided coughs plus a short clinical form into an explainable, calibrated risk estimate on any phone, with no X-ray machine, lab, or radiologist required.**

[Product Brief](.agent/product-brief.md) · [Requirements](.agent/product-requirements.md) · [Architecture](.agent/project-architecture.md) · [Design Guidelines](.agent/design-guidelines.md) · [Agent Guide](AGENT.md)

---

## What is Jaga?

Jaga is a phone-first tuberculosis triage tool. A community health worker records a few guided coughs and a short clinical form, an AI model trained on AMD returns an explainable, calibrated TB-risk estimate in seconds, and that prioritizes who needs a confirmatory test. _Jaga_ is Indonesian for 'to watch over / to guard.' *(Investigational research prototype - triage, not diagnosis; documented for symptomatic adults 18+.)*

**The problem:** Tuberculosis is again the world's deadliest infectious disease. In 2024 there were an estimated [10.7M cases but only 8.3M were diagnosed and reported - a ~2.4M (~22%) detection gap](https://www.who.int/news/item/12-11-2025-global-gains-in-tuberculosis-response-endangered-by-funding-challenges) (WHO 2025), because first-line screening needs [X-ray machines, sputum labs, and trained readers the hardest-hit communities do not have](https://pmc.ncbi.nlm.nih.gov/articles/PMC9803213/). Indonesia is the world's #2 burden country and a top contributor to that gap.

**The solution:** A phone-first screen built on the evidence-backed cough + clinical signal. It listens to a cough, combines it with symptoms and demographics into one **calibrated** TB-risk score, and shows where the model focused. The model is trained on AMD and served online. An optional chest X-ray module adds an independent signal where a digital X-ray is available. **Triage, not diagnosis** - a human always stays in the loop and flagged cases go for confirmatory testing.

## Key Features

| Feature                      | Description                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Listen**             | A few guided coughs (~10s) to mel-spectrogram + acoustic analysis, with an audio-quality gate and a model-attention overlay    |
| **Combine**            | Cough + demographics + symptoms to one**calibrated** TB-risk probability                                                 |
| **Decide**             | Explainable triage band (Low / Elevated / High -> refer for confirmatory test) + deterministic bilingual referral              |
| **See** _(optional)_ | Digital chest X-ray to an**independent** TB-likelihood + attention heatmap, shown alongside and not fused into the score |
| **Honest by design**   | Real metrics, calibration, subgroup performance, and stated limitations with no overclaiming                                   |

## Tech Stack (MVP)

| Layer             | Technology                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Frontend          | Next.js / PWA, Tailwind CSS                                                                     |
| Backend / serving | Go API + Python worker + Docker Swarm + NGINX                                                   |
| AI (training)     | PyTorch                                                                                         |
| Model (core)      | Cough + clinical TB triage model, retrieval-ready CXR pipeline, and experimental quantum branch |
| Explainability    | Spectrogram overlays, retrieval evidence, Grad-CAM-ready architecture                           |
| LLM               | Featherless OpenAI-compatible API integration                                                   |
| Memory            | Cognee semantic memory layer                                                                    |
| Storage / data    | PostgreSQL, Redis, MinIO                                                                        |

## Repository Structure

```text
jaga/
├── AGENT.md
├── README.md
├── CLAUDE.md
├── LICENSE
├── .agent/
│   ├── product-brief.md
│   ├── product-requirements.md
│   ├── project-architecture.md
│   ├── implementation-plan.md
│   └── log.md
├── backend/
│   ├── go/
│   │   ├── cmd/server/
│   │   ├── internal/
│   │   │   ├── config/
│   │   │   ├── handlers/
│   │   │   ├── http/
│   │   │   ├── memory/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   └── validation/
│   │   ├── Dockerfile
│   │   └── go.mod
│   └── python/
│       ├── PrismaServer/
│       │   ├── app/
│       │   ├── artifacts/
│       │   ├── Dockerfile
│       │   └── requirements.txt
│       └── PrismaTraining/
│           ├── configs/
│           ├── data/
│           ├── evaluation/
│           ├── models/
│           ├── quantum/
│           ├── retrieval/
│           ├── scripts/
│           ├── training/
│           └── utils/
└── infra/
    ├── docker-stack.yml
    ├── .env.example
    ├── nginx/
    ├── postgres/
    ├── redis/
    ├── minio/
    ├── scripts/
    └── healthcheck/
```

## Target Market

**The market is global:** TB's high-burden belt - India, Indonesia, the Philippines, Pakistan, China, and sub-Saharan Africa - all face the same lab, radiologist, and internet access gap Jaga is built for.

**Beachhead:** community health workers doing active TB case-finding in Indonesia - the world's #2 burden country, where the team has ground truth and proximity.

**Expansion path:** district TB programs and clinics to NGO mobile screening camps to broader respiratory screening on the same platform.

**Business model:** free tier for community health workers, then per-program / per-screen cloud licensing for national TB programs and NGOs.

## Hackathon Context

Built for the **AMD Developer Hackathon ACT II** (lablab.ai), Unicorn track. The core models are trained on AMD hardware, with online serving and an optional LLM explanation layer.

## Developers

- **Daffa** - AI / ML & Backend lead
- **Zeddin** - Backend
- **Kei** - Frontend
- **Billy** - Frontend lead & design
- **Fransisco** - PM, presentation & video

## Run Flow

Run Jaga through Docker Swarm from the `infra` directory.

1. Create the runtime environment file.

```bash
cd infra
cp .env.example .env
```

2. Edit `.env` with your real credentials and deployment values.
3. Build the local images used by the stack.

```bash
./scripts/build.sh
```

4. Start the full stack.

```bash
./scripts/deploy.sh
```

5. Confirm the services are running.

```bash
docker stack services jaga
```

6. Tail logs when needed.

```bash
./scripts/logs.sh
```

7. Scale services when needed.

```bash
./scripts/scale-api.sh 4
./scripts/scale-worker.sh 2
```

8. Remove the stack when done.

```bash
./scripts/remove.sh
```

This brings up `nginx`, `go-api`, `prisma-worker`, `postgres`, `redis`, and `minio` together. The current default serving bundle is already packaged under `backend/python/PrismaServer/artifacts/local_clahe/`, so the normal local run path is the stack, not starting each service one by one.

## License

Released under the **MIT License** - see [`LICENSE`](LICENSE).

**Medical disclaimer:** Jaga is a screening / triage aid, not a diagnostic device. It does not diagnose tuberculosis and is not a substitute for confirmatory testing or clinical judgment.
