<h1 align="center">Jaga</h1>

<p align="center">
  <b>An investigational, phone-first tuberculosis triage prototype that combines a guided cough recording with supported clinical inputs to help prioritize follow-up urgency — no X-ray machine, lab, or radiologist required.</b>
</p>

<p align="center">
  <a href=".agent/product-brief.md">Product Brief</a> ·
  <a href=".agent/project-architecture.md">Architecture</a> ·
  <a href=".agent/design-guidelines.md">Design</a> ·
  <a href="AGENT.md">Agent Guide</a>
</p>

---

## What Jaga is

Jaga is a research prototype documented for **symptomatic adults aged 18+**, matching the available CODA TB evidence base. A community health worker captures a guided cough recording and supported clinical inputs. The system returns a research estimate and model-inspection artifacts.

The estimate may prioritize follow-up urgency, but it does not decide whether a symptomatic person receives testing. **Every symptomatic participant is directed to confirmatory evaluation. Jaga does not diagnose or rule out tuberculosis.**

_Jaga_ is Indonesian for “to watch over / to guard.”

## Why it matters

Tuberculosis remains the world's leading infectious-disease killer. WHO estimated **10.7 million** incident cases in 2024 and **8.3 million** notified diagnoses, leaving a gap of about **2.4 million people** caused by both underdiagnosis and underreporting. Indonesia accounted for approximately **10% of global incident cases**. Sources and permitted wording are maintained in the [evidence register](.agent/evidence-register.md).

Jaga explores whether cough acoustics plus routinely available clinical information can support accessible research into TB triage. It does not replace microbiological confirmation, clinical judgment, or an approved screening programme.

## How it works

Two co-equal, never-fused signals:

- **Gema (cough + clinical):** the browser records one guided cough. The Go gateway cleans the audio (DC-offset removal, 80 Hz high-pass, silence trim, peak-normalize), then a Rust pipeline resamples to 16 kHz mono and a Rust **YAMNet** (ONNX) service gates that the clip really is a cough — extracting just the detected cough segment (start/end) so only that slice is embedded, keeping compute cheap. A **local WavLM Large** (dynamic-int8 ONNX, runs in-process in Rust) produces the embedding entirely on-device. The embedding plus 12 demographic features feed a Rust **XGBoost** (ONNX Runtime) service, and the calibrated-model probability comes back with a relative urgency band. **Gemma** (Fireworks chat) writes the mandatory-next-step guidance around that number — it never invents or alters the probability, and every failure path falls back to deterministic bilingual copy.
- **Prisma (digital CXR, separate):** a Python worker reconstructs the `local_clahe` DenseNet121 checkpoint, runs CLAHE preprocessing, and reports its own estimate with its own metrics plus an optional **Grad-CAM heatmap** for model inspection, alongside a PennyLane quantum-kernel-SVM evaluation (4-qubit `lightning.qubit`, 98.3% accuracy / 1.00 ROC-AUC on PCA-4 DenseNet embeddings). Gema and Prisma scores are never combined.

| Capability           | Behavior                                                                            |
| -------------------- | ----------------------------------------------------------------------------------- |
| Guided capture       | Record a guided cough; the YAMNet gate rejects non-cough audio before inference     |
| Clinical inputs      | Collect only variables supported by the approved model contract                     |
| Research estimate    | Gema returns the model probability and relative urgency band                        |
| Mandatory next step  | Direct every symptomatic participant to confirmatory evaluation                     |
| Assistant            | Gemma-backed guidance chat; deterministic copy on any model failure                 |
| Privacy              | Process inputs transiently without request-body logging or patient-data persistence |
| Digital CXR (Prisma) | Separate estimate with separate metrics; never fused with Gema                      |

## Tech stack

Six layers, real-time processing, powered by multimodal AI and AMD accelerated computing.

| Layer                    | Technology                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Frontend**             | Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Zustand · TanStack Query (PWA, served behind NGINX) |
| **Backend & gateway**    | Go (API gateway) · Rust + Axum (model microservices) · Python + FastAPI (CXR worker) · NGINX (reverse proxy)        |
| **Audio DSP pipeline**   | Go DSP (DC-offset, 80 Hz high-pass, silence trim, peak-normalize) → Rust + `hound` (mono downmix, 16 kHz resample)  |
| **AI / ML**              | PyTorch (training) · ONNX Runtime (serving) · YAMNet (cough gate) · WavLM Large int8 (local embeddings) · XGBoost (Gema) · DenseNet121 + CLAHE + PennyLane quantum-kernel SVM (Prisma) · Gemma via Fireworks/Featherless (guidance chat only) |
| **Data & storage**       | PostgreSQL · Redis · MinIO                                                                                          |
| **Infra & quality**      | Docker Swarm (HA orchestration) · Vitest · Playwright · Zod                                                          |
| **Training accelerator** | AMD Instinct MI300X via AMD Developer Cloud (ROCm PyTorch) — see below                                              |

## AMD & approved compute usage

- **Training — AMD Instinct MI300X (AMD Developer Cloud).** Both models were trained on the AMD Developer Cloud Jupyter environment (8-hour/day MI300X sessions) with ROCm PyTorch: the **Gema cough detector/classifier** (`GemmaTraining/` — YAMNet-gated WavLM embeddings + XGBoost on CODA TB data) and the **Prisma CXR model** (`PrismaTraining/` — DenseNet121 + CLAHE, plus the PennyLane quantum-kernel-SVM evaluation). The trained artifacts ship in this repo and are what the services load at inference time.
- **Inference — fully local models, Fireworks only for chat.** YAMNet, WavLM int8, and XGBoost run locally in Rust/ONNX Runtime; DenseNet121 runs locally in Python. No model estimate touches an external API — WavLM embeddings are produced entirely on-device. **Fireworks** is used only for the **Gemma** guidance/orchestration chat that wraps the model output. Gemma on Fireworks is on-demand-deployment only — our hackathon-credit deployment was retired when the $50 allowance ran out, so the live demo currently serves the same Gemma family via **Featherless** (`LLM_PROVIDER=featherless`); the Fireworks code path is intact and works with any account's own deployment.

## Repository structure

```text
jaga/
├── AGENT.md                          # Agent entry point / doc router (start here)
├── README.md                         # This file
├── .agent/                           # Agent-facing specification documents
│   ├── product-brief.md              #   Product vision, market, business model
│   ├── product-requirements.md       #   PRD: roles, features, acceptance, safety
│   ├── project-architecture.md       #   System architecture, data flow, diagram
│   ├── design-guidelines.md          #   Brand, color, type, motion, components
│   ├── data-evaluation-plan.md       #   Dataset, splits, metrics, evidence gates
│   ├── evidence-register.md          #   Single source of truth for all cited facts
│   └── context-dump.md               #   Full decision history and rationale
├── frontend/                         # Next.js 15 PWA (React 19, TypeScript)
│   └── src/
│       ├── app/                      #   Route views: clinical, coughs, review, result, cxr, chat
│       ├── components/               #   UI, layout, and common components
│       ├── features/                 #   Feature modules (capture, triage, assistant)
│       ├── services/ · store/ · hooks/  #  API clients, Zustand stores, hooks
│       ├── locales/                  #   Bilingual (EN/ID) copy
│       └── styles/                   #   Design tokens, global CSS
├── backend/
│   ├── backendHandlers/              # Go API gateway
│   │   ├── cmd/server/               #   Entry point
│   │   └── internal/                 #   audioPreprocess, triage, cxr, demographics,
│   │                                 #   assistant, llm, spectrogram, server (router)
│   └── modelServerandTraining/
│       ├── GemmaServer/              # Gema serving (cough + clinical)
│       │   ├── rust/                 #   yamnetService · xgboostService · jagaAudio (Axum + ONNX)
│       │   └── models/               #   YAMNet + XGBoost ONNX (WavLM downloaded, see below)
│       ├── GemmaTraining/            # Cough-model training (notebooks, data prep)
│       ├── PrismaServer/             # Python CXR worker (FastAPI)
│       │   └── app/                  #   main.py, model.py, gradcam.py, quantum.py
│       └── PrismaTraining/           # PyTorch CXR research framework (ROCm/MI300X)
├── contracts/openapi/                # OpenAPI contract (jaga-v1.yaml)
├── infra/                            # Docker Swarm stack, NGINX, scripts (.sh + .ps1)
│   ├── docker-stack.yml              #   Service topology
│   ├── scripts/                      #   build · deploy · logs · remove · scale
│   └── healthcheck/                  #   Manual health probes
├── docs/                             # Backend integration map, submission assets
└── run.ps1                           # Windows one-shot: build + deploy + frontend dev
```

Model weights ship in the repository (all under GitHub's file-size limit): `GemmaServer/models/` (YAMNet + XGBoost ONNX) and `PrismaServer/app/models/local_clahe/checkpoints/best.pt` (DenseNet121, 83 MB). The one exception is the **WavLM int8 embedder** (356 MB, over GitHub's 100 MB limit) — since embeddings run fully on-device, this file is **required**: download it from [Google Drive](https://drive.google.com/file/d/1O4uoKIUKnGPzNopkYlcqvO08TeS71-_h/view?usp=sharing) into `GemmaServer/models/wavlm/wavlm_large_int8.onnx` (see below) before starting the stack.

## Running locally

### Prerequisites

- **Docker** with Swarm available (Docker Desktop on macOS/Windows, Docker Engine on Linux). The deploy script runs `docker swarm init` for you on first use.
- **WavLM weights** (required — the local, on-device embedder). Download `wavlm_large_int8.onnx` (356 MB) from [Google Drive](https://drive.google.com/file/d/1O4uoKIUKnGPzNopkYlcqvO08TeS71-_h/view?usp=sharing) into `backend/modelServerandTraining/GemmaServer/models/wavlm/`. Because the file is large, use `gdown` (handles Drive's confirmation page that plain `curl` cannot):

  ```bash
  pip install gdown
  gdown 1O4uoKIUKnGPzNopkYlcqvO08TeS71-_h \
    -O backend/modelServerandTraining/GemmaServer/models/wavlm/wavlm_large_int8.onnx
  ```

- **API key** in `infra/.env` (for the Gemma guidance chat only — models run locally):
  - `FEATHERLESS_API_KEY` — the zero-deploy path for the assistant (Gemma chat, `LLM_PROVIDER=featherless`).
  - `FIREWORKS_API_KEY` — alternative: Gemma chat via your own on-demand Fireworks deployment (`LLM_PROVIDER=fireworks`).
- Everything else (YAMNet, XGBoost, DenseNet121 weights) is already in the repo.

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

## Market & business model

**Segment, target, position.** Jaga serves hospitals, primary-care clinics, and high-risk symptomatic individuals in resource-limited settings. The buyers are hospital administrators looking to optimize scarce testing resources, and the reach extends to impoverished or geographically isolated people who need a free, instant risk assessment. Jaga is positioned to reach symptomatic people early and prioritize who to send for confirmatory TB testing first — not as a definitive diagnostic tool.

**Market sizing.**

| Tier | Size | Definition |
| ---- | ---- | ---------- |
| TAM  | $22B | Global funding target for TB prevention, diagnosis, and treatment |
| SAM  | $5.9B | Available TB funding in low- and middle-income countries (LMICs) |
| SOM  | $590M | Indonesia B2B/B2C screening market — 3-year target |

**Business model.**

| Tier | Price | For |
| ---- | ----- | --- |
| Public Screening | Free (ad-supported) | Individuals doing self-screening |
| Clinic License | $99–$199 / month | Clinics — unlimited triage |
| API & Enterprise | Roadmap | Programs, integrations, national deployments |

## Team — Singkong

<table>
  <tr>
    <td align="center" width="20%">
      <a href="https://github.com/PaulusBilly">
        <img src="https://github.com/PaulusBilly.png" width="110" style="border-radius:8px" alt="Paulus Billy"/><br/>
        <b>Paulus Billy</b>
      </a><br/>
      Design Engineer
    </td>
    <td align="center" width="20%">
      <a href="https://github.com/DaBabyOx">
        <img src="https://github.com/DaBabyOx.png" width="110" style="border-radius:8px" alt="Daffa Tarigan"/><br/>
        <b>Daffa Tarigan</b>
      </a><br/>
      AI &amp; Infrastructure
    </td>
    <td align="center" width="20%">
      <a href="https://github.com/keishaputri-k">
        <img src="https://github.com/keishaputri-k.png" width="110" style="border-radius:8px" alt="Keisha Putri Theanny"/><br/>
        <b>Keisha Putri Theanny</b>
      </a><br/>
      Front-End
    </td>
    <td align="center" width="20%">
      <a href="https://github.com/ezzeddinp">
        <img src="https://github.com/ezzeddinp.png" width="110" style="border-radius:8px" alt="Mohammad Ezzeddin Pratama"/><br/>
        <b>Mohammad Ezzeddin Pratama</b>
      </a><br/>
      Back-End
    </td>
    <td align="center" width="20%">
      <img src="https://ui-avatars.com/api/?name=Kevin+Fransisco&size=110&background=024F46&color=ffffeb" width="110" style="border-radius:8px" alt="Kevin Fransisco"/><br/>
      <b>Kevin Fransisco</b><br/>
      Product Manager
    </td>
  </tr>
</table>

## License and medical disclaimer

Released under the [MIT License](LICENSE).

Jaga is an investigational research prototype, not a diagnostic device, cleared medical device, or substitute for confirmatory testing and clinical judgment. Do not use it to make real patient-care decisions.
