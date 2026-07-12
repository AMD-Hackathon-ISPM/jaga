# Jaga

**An investigational, phone-first tuberculosis triage prototype that combines a guided cough recording with supported clinical inputs to help prioritize follow-up urgency — no X-ray machine, lab, or radiologist required.**

[Product Brief](.agent/product-brief.md) · [Requirements](.agent/product-requirements.md) · [Architecture](.agent/project-architecture.md) · [Data &amp; Evaluation](.agent/data-evaluation-plan.md) · [Evidence](.agent/evidence-register.md) · [Design](.agent/design-guidelines.md) · [Agent Guide](AGENT.md)

## What Jaga is

Jaga is a research prototype documented for **symptomatic adults aged 18+**, matching the available CODA TB evidence base. A community health worker captures a guided cough recording and supported clinical inputs. The system returns a research estimate and model-inspection artifacts.

The estimate may prioritize follow-up urgency, but it does not decide whether a symptomatic person receives testing. **Every symptomatic participant is directed to confirmatory evaluation. Jaga does not diagnose or rule out tuberculosis.**

_Jaga_ is Indonesian for “to watch over / to guard.”

## Why it matters

Tuberculosis remains the world's leading infectious-disease killer. WHO estimated **10.7 million** incident cases in 2024 and **8.3 million** notified diagnoses, leaving a gap of about **2.4 million people** caused by both underdiagnosis and underreporting. Indonesia accounted for approximately **10% of global incident cases**. Sources and permitted wording are maintained in the [evidence register](.agent/evidence-register.md).

Jaga explores whether cough acoustics plus routinely available clinical information can support accessible research into TB triage. It does not replace microbiological confirmation, clinical judgment, or an approved screening programme.

## How it works

Two co-equal, never-fused signals:

- **Gema (cough + clinical):** the browser records one guided cough. The Go gateway cleans the audio (DC-offset removal, 80 Hz high-pass, silence trim, peak-normalize), a Rust **YAMNet** service gates that the clip really is a cough, a Fireworks **WavLM** embedding plus 12 demographic features feed a Rust **XGBoost** (ONNX Runtime) service, and the calibrated-model probability comes back with a relative urgency band. **Gemma** (Fireworks chat) writes the mandatory-next-step guidance around that number — it never invents or alters the probability, and every failure path falls back to deterministic bilingual copy.
- **Prisma (digital CXR, separate):** a Python worker reconstructs the `local_clahe` DenseNet121 checkpoint, runs CLAHE preprocessing, and reports its own estimate with its own metrics, alongside a PennyLane quantum-kernel-SVM evaluation (4-qubit `lightning.qubit`, 98.3% accuracy / 1.00 ROC-AUC on PCA-4 DenseNet embeddings). Gema and Prisma scores are never combined.

| Capability           | Behavior                                                                            |
| -------------------- | ----------------------------------------------------------------------------------- |
| Guided capture       | Record a guided cough; the YAMNet gate rejects non-cough audio before inference     |
| Clinical inputs      | Collect only variables supported by the approved model contract                     |
| Research estimate    | Gema returns the model probability and relative urgency band                        |
| Mandatory next step  | Direct every symptomatic participant to confirmatory evaluation                     |
| Assistant            | Gemma-backed guidance chat; deterministic copy on any model failure                 |
| Privacy              | Process inputs transiently without request-body logging or patient-data persistence |
| Digital CXR (Prisma) | Separate estimate with separate metrics; never fused with Gema                      |

## Stack

| Layer            | Technology                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| Frontend         | Next.js 15 PWA (React 19, Tailwind CSS 4), served in-stack behind NGINX                                               |
| API gateway      | Go (`backend/backendHandlers`) — validation, pure-Go audio DSP, triage orchestration                               |
| Gema services    | Rust + ONNX Runtime (`backend/modelServerandTraining/GemmaServer/rust`) — `yamnet` gate, `xgboost` probability |
| LLM / embeddings | Fireworks (Gemma chat for guidance copy, WavLM embeddings); Featherless powers Cognee generation                      |
| CXR (Prisma)     | Python worker (`backend/modelServerandTraining/PrismaServer`) — DenseNet121 + CLAHE + quantum-kernel SVM           |
| Training         | PyTorch on AMD ROCm / Instinct MI300X (`PrismaTraining`, `GemmaTraining`)                                         |
| Semantic memory  | Cognee (optional; degrades gracefully)                                                                                |
| Storage / data   | PostgreSQL, Redis, MinIO                                                                                              |
| Deployment       | Docker Swarm + NGINX (`infra/`)                                                                                     |

## Repository structure

```text
jaga/
├── AGENT.md                  # canonical agent entry point / doc router
├── README.md
├── .agent/                   # product, architecture, evidence, decision docs
├── backend/
│   ├── backendHandlers/      # Go API gateway (cmd/server, internal/...)
│   └── modelServerandTraining/
│       ├── GemmaServer/      # Rust yamnet + xgboost services, ONNX models
│       ├── GemmaTraining/    # cough-model training notebook & data prep
│       ├── PrismaServer/     # Python CXR worker (DenseNet121 + quantum)
│       └── PrismaTraining/   # PyTorch CXR research framework
├── contracts/openapi/        # OpenAPI contract
├── frontend/                 # Next.js PWA
├── infra/                    # Docker Swarm stack, NGINX, scripts (sh + ps1)
└── run.ps1                   # Windows one-shot: build + deploy + frontend dev
```

Model weights ship in the repository (all under GitHub's file-size limit), so a fresh clone runs end-to-end with no separate download: `GemmaServer/models/` (YAMNet + XGBoost ONNX) and `PrismaServer/app/models/local_clahe/checkpoints/best.pt` (DenseNet121, 83 MB).

## Running locally

### Prerequisites

- **Docker** with Swarm available (Docker Desktop on macOS/Windows, Docker Engine on Linux). The deploy script runs `docker swarm init` for you on first use.
- **API keys** in `infra/.env`:
  - `FIREWORKS_API_KEY` — required for triage (WavLM embeddings) and the assistant (Gemma chat).
  - `FEATHERLESS_API_KEY` — used by Cognee generation; optional for the core flow.
- Nothing else: model weights are already in the repo.

### Linux / macOS (or Windows via WSL)

```bash
cd infra
cp .env.example .env          # then fill in the API keys above
./scripts/build.sh            # build all images locally
./scripts/deploy.sh           # deploy the Swarm stack
docker stack services jaga    # confirm all services report REPLICAS 1/1
./scripts/logs.sh             # tail logs (or ./scripts/logs.sh go-api)
./scripts/remove.sh           # tear down when done
```

### Windows (native PowerShell)

Every `infra/scripts/*.sh` has a `.ps1` twin — no WSL required:

```powershell
Set-Location infra
Copy-Item .env.example .env   # then fill in the API keys above
.\scripts\build.ps1
.\scripts\deploy.ps1
docker stack services jaga
.\scripts\logs.ps1
.\scripts\remove.ps1
```

Or use the one-shot script from the repo root, which creates `.env`, builds, deploys, and starts the frontend dev server:

```powershell
.\run.ps1
```

Use PowerShell 7 (`pwsh`) if available; Windows PowerShell 5.1 works but is less forgiving about redirected stderr from Docker.

### Verify it's up

```bash
curl http://127.0.0.1/health          # gateway health via NGINX
./healthcheck/api.sh                  # manual probes (from infra/)
./healthcheck/prisma.sh http://127.0.0.1:8000/health
```

The app is served at `http://127.0.0.1/` (port configurable via `NGINX_PUBLISHED_PORT`).

### API surface (gateway)

| Method | Path                           | Purpose                                    |
| ------ | ------------------------------ | ------------------------------------------ |
| GET    | `/health`                    | Gateway health                             |
| POST   | `/api/v1/demographics`       | Validate clinical/demographic inputs       |
| POST   | `/api/v1/audio/preprocess`   | Audio cleanup (DC offset, high-pass, trim) |
| POST   | `/api/v1/triage`             | Gema cough + clinical triage               |
| POST   | `/api/v1/assistant/messages` | Gemma guidance chat                        |
| POST   | `/api/v1/cxr`                | Prisma digital-CXR estimate (proxied)      |

`infra/README.md` documents the full stack topology, scaling, health checks, and routing.

## Hackathon

Jaga targets the **Unicorn Track** of AMD Developer Hackathon ACT II (6 July 2026, 15:00 UTC → 11 July 2026, 15:00 UTC). Judging covers creativity and originality, completeness, meaningful use of AMD platforms, and product/market potential.

Submission-guideline notes (all tracks):

- **No hardcoded or cached answers.** Every estimate is live inference: YAMNet gate → WavLM embedding → XGBoost for Gema; DenseNet121 forward pass for Prisma. The LLM writes copy only — the probability always comes from the model.
- **Image size.** Verify locally with `docker images | grep jaga`; all images must stay under the 10 GB cap.
- **Architecture.** Images built on an amd64 host (Windows/Linux) are `linux/amd64` natively. On Apple Silicon, local builds are arm64 — build the published/judged images on an amd64 machine, or use `docker buildx build --platform linux/amd64`.
- **Test locally before submitting** — submissions are rate-limited. The verify steps above are the pre-submit smoke test.

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
