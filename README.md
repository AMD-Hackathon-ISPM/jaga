# Jaga

**An investigational, phone-first tuberculosis triage prototype that combines five guided coughs with supported clinical inputs to help prioritize follow-up urgency — no X-ray machine, lab, or radiologist required.**

[Product Brief](.agent/product-brief.md) · [Requirements](.agent/product-requirements.md) · [Architecture](.agent/project-architecture.md) · [Data & Evaluation](.agent/data-evaluation-plan.md) · [Evidence](.agent/evidence-register.md) · [Design](.agent/design-guidelines.md) · [Agent Guide](AGENT.md)

## What Jaga is

Jaga is a research prototype documented for **symptomatic adults aged 18+**, matching the available CODA TB evidence base. A community health worker captures five guided coughs and supported clinical inputs. A model trained on AMD returns a calibrated research estimate and model-inspection artifacts.

The estimate may prioritize follow-up urgency, but it does not decide whether a symptomatic person receives testing. **Every symptomatic participant is directed to confirmatory evaluation. Jaga does not diagnose or rule out tuberculosis.**

_Jaga_ is Indonesian for “to watch over / to guard.”

## Why it matters

Tuberculosis remains the world's leading infectious-disease killer. WHO estimated **10.7 million** incident cases in 2024 and **8.3 million** notified diagnoses, leaving a gap of about **2.4 million people** caused by both underdiagnosis and underreporting. Indonesia accounted for approximately **10% of global incident cases**. Sources and permitted wording are maintained in the [evidence register](.agent/evidence-register.md).

Jaga explores whether cough acoustics plus routinely available clinical information can support accessible research into TB triage. It does not replace microbiological confirmation, clinical judgment, or an approved screening programme.

## MVP behavior

| Capability | MVP behavior |
|---|---|
| Guided capture | Record five coughs and reject unusable audio before inference |
| Clinical inputs | Collect only variables supported by the approved model contract |
| Research estimate (**Gema**) | The cough-plus-clinical core returns a calibrated probability and relative urgency band |
| Mandatory next step | Direct every symptomatic participant to confirmatory evaluation |
| Model inspection | Show a spectrogram, non-causal attention/saliency overlay, and supported contributing factors |
| Privacy | Process inputs transiently without request-body logging or patient-data persistence |
| Digital-CXR (**Prisma**) | Show a separate digital-CXR estimate with separate metrics; never fuse scores |

## Planned stack

| Layer | Technology |
|---|---|
| Frontend | Next.js PWA and Tailwind CSS; final frontend contract owned by Billy |
| Backend / serving | Go REST API + Python (Prisma) worker, Docker Swarm + NGINX; architecture owned by Daffa, implemented by Zeddin |
| AI training | PyTorch on AMD ROCm / Instinct MI300X |
| Core model (Gema) | Evidence-gated cough-plus-clinical model; final pipeline owned by Daffa |
| CXR model (Prisma) | Separate digital-CXR classifier (DenseNet121 / EfficientNet-B0 / BiomedCLIP / Rad-DINO) with retrieval-augmented inspection and Grad-CAM; never fused with Gema |
| LLM / generation | Featherless via an OpenAI-compatible API surface, for richer copy only; deterministic bilingual referral remains the default |
| Semantic memory | Cognee (optional; degrades gracefully) |
| Storage / data | PostgreSQL, Redis, MinIO |

The detailed contracts are intentionally assigned in the [architecture](.agent/project-architecture.md), [data and evaluation plan](.agent/data-evaluation-plan.md), and [implementation plan](.agent/implementation-plan.md). Product and medical-safety rules are already fixed and are not placeholders.

## Development status

- **29 June–5 July 2026:** architecture contracts, data verification, baseline model, frontend specification, scaffolding, and integration prototype.
- **6–9 July:** official hackathon MVP implementation and integration.
- **10 July:** evaluation, accessibility, failure-path testing, deployment, and demo recording.
- **11 July:** submission verification and buffer.

The backend and infrastructure scaffolds now exist — Go API + Prisma worker + Docker Swarm stack under `backend/` and `infra/` (see [Running locally](#running-locally)). The cough+clinical triage contract (`POST /api/v1/triage`) is still pending Daffa's `ARCH-1`. Submission stays blocked until a clean checkout runs the documented commands end to end.

## Repository structure


```text
jaga/
├── AGENT.md
├── CLAUDE.md
├── README.md
├── LICENSE
├── .agent/
│   ├── product-brief.md
│   ├── product-requirements.md
│   ├── project-architecture.md
│   ├── data-evaluation-plan.md
│   ├── evidence-register.md
│   ├── design-guidelines.md
│   ├── implementation-plan.md
│   ├── context-dump.md
│   ├── log.md
│   └── plan-template.md
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

## Running locally

Jaga runs as a Docker Swarm stack from the `infra/` directory. The default serving bundle is already packaged under `backend/python/PrismaServer/artifacts/local_clahe/`, so the normal local path is the stack — not starting each service by hand.

```bash
cd infra
cp .env.example .env          # then edit .env with real credentials/values
./scripts/build.sh            # build local images
./scripts/deploy.sh           # start the full stack
docker stack services jaga    # confirm services are up
./scripts/logs.sh             # tail logs
./scripts/scale-api.sh 4      # scale go-api / prisma-worker as needed
./scripts/scale-worker.sh 2
./scripts/remove.sh           # tear down when done
```

This brings up `nginx`, `go-api`, `prisma-worker`, `postgres`, `redis`, and `minio` together. The cough+clinical triage endpoint (`POST /api/v1/triage`) is still pending; intake (`POST /api/v1/patient/intake`) and health checks are live.

## Hackathon

Jaga targets the **Unicorn Track** of AMD Developer Hackathon ACT II. The official window is **6 July 2026, 15:00 UTC → 11 July 2026, 15:00 UTC**. Judging covers creativity and originality, completeness, meaningful use of AMD platforms, and product/market potential.

The submission must include a public repository with setup and usage instructions, a runnable application URL, containerized services, a cover image, video presentation, and slide presentation.

## Market

**Global:** TB's high-burden belt — India, Indonesia, the Philippines, Pakistan, China, and sub-Saharan Africa — all face the same lab, radiologist, and internet-access gap Jaga is built for.

**Beachhead:** community health workers doing active TB case-finding in Indonesia, the world's #2 burden country, where the team has ground truth and proximity.

**Expansion path:** district TB programs and clinics → NGO mobile screening camps → broader respiratory screening on the same platform.

**Business model:** free tier for community health workers, then per-program / per-screen cloud licensing for national TB programs and NGOs.

## Team

- **Daffa:** backend/AI architecture, data, model, and evaluation
- **Zeddin:** backend implementation, integration, containers, and deployment
- **Billy:** frontend/design architecture, accessibility, and final polish
- **Kei:** frontend implementation
- **Fransisco:** PM, evidence-to-pitch consistency, presentation, and video

## License and medical disclaimer

Released under the [MIT License](LICENSE).

Jaga is an investigational research prototype, not a diagnostic device, cleared medical device, or substitute for confirmatory testing and clinical judgment. Do not use it to make real patient-care decisions.
