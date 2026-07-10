# Jaga · Project Architecture

**Document type:** Project architecture
**Audience:** Backend, frontend, ML, platform, QA, and technical reviewers
**Status:** Active · owner contracts required before feature implementation
**Updated:** 2026-06-30
**Canonical for:** System boundaries, planned runtime components, shared interfaces, privacy, security, observability, deployment, and technical ownership
**Companion documents:** [`product-requirements.md`](product-requirements.md), [`data-evaluation-plan.md`](data-evaluation-plan.md), [`design-guidelines.md`](design-guidelines.md), [`implementation-plan.md`](implementation-plan.md), [`evidence-register.md`](evidence-register.md)

## How to read this document

The PRD defines behavior and safety. This document defines how components will satisfy it after the visible owner-input blocks are completed. Zeddin and Kei must not implement blocked interfaces from inferred or stale fields. Daffa signs backend/AI contracts; Billy signs frontend architecture; all shared contracts must then be synchronized here and in the implementation plan.

## 1. Architectural principles

1. **Research boundary first.** Architecture must preserve the symptomatic-adult cohort, mandatory confirmatory-evaluation rule, and research-only framing.
2. **One complete loop.** Optimize capture → quality → inference → result → reset before adding stretch work.
3. **AMD is load-bearing.** The selected model is trained/evaluated and served through a pinned ROCm/MI300X workflow.
4. **Transient inputs.** No patient-input database, object-storage archive, request-body logs, or analytics payloads.
5. **Versioned contracts.** Frontend, backend, model artifact, preprocessing, calibration, and copy bundle expose compatible versions.
6. **Fail closed.** Missing model metadata, failed quality checks, schema mismatches, timeouts, or unavailable inference return no estimate.
7. **Evidence is visible.** Published CODA benchmarks and actual Jaga results are never conflated.

## 2. System boundary [MVP]

```text
Phone/PWA
  ├─ eligibility + consent
  ├─ supported clinical form
  ├─ five guided cough attempts
  └─ transient in-memory state
          │ HTTPS multipart request
          ▼
Go API + Prisma worker on AMD infrastructure
  ├─ schema/version validation
  ├─ request-scoped preprocessing
  ├─ audio-quality gate
  ├─ model + calibration artifact
  ├─ result/limitations composer
  └─ metadata-only observability
          │ structured response
          ▼
PWA result
  ├─ calibrated research estimate
  ├─ relative urgency band
  ├─ mandatory confirmatory evaluation
  ├─ non-causal inspection artifacts
  └─ reset clears all local state
```

The MVP has no user account, patient database, case history, queue, background job, EHR integration, or analytics warehouse.

## 3. Frontend architecture [MVP]

### 3.1 Locked constraints

- Next.js PWA with a single-session, step-based capture flow.
- Patient inputs remain in memory; no localStorage, IndexedDB, service-worker cache, or analytics event may contain them.
- The UI consumes only the signed API schema and deterministic bilingual string bundle.
- Browser audio is converted only according to the signed upload contract.
- Every loading, error, retry, offline, reset, language, and reduced-motion state in PRD-01 through PRD-08 must be represented.

### 3.2 Signed frontend architecture (Billy, 2026-06-28)

- **Libraries:** Next.js (App Router) PWA + React; **Tailwind CSS 4** through `@tailwindcss/postcss`, retaining `tailwind.config.ts` through the `@config` bridge; **shadcn/ui** Radix/Nova preset `b85jYWWKi8` for the five routed surfaces and shared layout. Shadcn semantic variables map to the signed §4 Jaga tokens rather than replacing them. The theme is light-only with no `ThemeProvider`; dark selectors remain class-gated and inactive. No global state library — the step machine is local React state / `useReducer`, all in memory. Audio uses the **Web Audio API + `<canvas>`** for the recorder/waveform (no audio dependency). Motion is CSS-first (transform/opacity); add a small motion library only if a specific transition needs it.
- **Route / screen map and state machine:** defined once in [`design-guidelines.md`](design-guidelines.md) §3 (gate → clinical → coughs → review → processing → result → limitations, with reset/error). Not duplicated here.
- **API state/error mapping:** `design-guidelines.md` §3.3; exact codes pin on Daffa's `ARCH-1` contract (§6).
- **In-memory form/audio model:** clinical values + five decoded cough buffers + result + request-id held in React state only; cleared on reset, success acknowledgement, or session timeout (PRD-08). No `localStorage`/`IndexedDB`/service-worker cache/analytics may contain them.
- **Accessibility & responsive:** `design-guidelines.md` §5–§9 (320 px floor, AA contrast evidence, reduced-motion, text alternatives).
- **Planned folder structure** (under the `frontend/` of §11):

```text
frontend/
├── components.json     # shadcn/ui Radix/Nova configuration and aliases
├── app/                # routes: / (gate), /clinical, /coughs, /review, /result
├── components/         # reusable + screen-specific (re-skinned from ClinicalCaptureForm.jsx)
├── lib/                # step state machine, in-memory session model, audio capture/quality
├── locales/            # keyed/versioned EN + ID string bundles (UX-1)
└── styles/             # token CSS variables + Tailwind config
```

> Open dependencies: the exact `POST /api/v1/triage` schema and error codes pin on Daffa's `ARCH-1` (§6, due 2026-06-29); the paired EN/ID string table pins on `UX-1`.

### 3.3 Frontend implementation boundary

Billy owns frontend architecture, UX, accessibility, and review. Kei implements the signed specification. Kei may propose changes, but any change to behavior, safety, state, or contract must be accepted in the canonical document before implementation.

## 4. Backend architecture [MVP]

### 4.1 Locked constraints

- Go REST API (public orchestrator) plus a Python (Prisma) serving worker, packaged in Docker and deployed on AMD infrastructure via Docker Swarm.
- Request-scoped processing only; no input persistence.
- Validate content type, byte limits, encoding, field schema, contract version, and model availability before inference.
- Return structured error codes; never return partial or stale estimates.
- Model loading, preprocessing, inference, calibration, inspection, and result composition are separate modules with versioned boundaries.
- The two research signals are co-equal `[MVP]` named modules: **Gema** (cough-plus-clinical core) and **Prisma** (digital-CXR). They are trained, served, evaluated, and displayed separately, built in parallel, and are never fused into one score.
- Health endpoints disclose service/model readiness without exposing secrets or participant information.

> **OWNER INPUT REQUIRED — Daffa — due 2026-06-29**
>
> **Blocks:** `ARCH-1`, `BE-0` through `BE-4`, and all frontend/backend integration
>
> **Required output:** choose the backend runtime and dependency versions; define module boundaries; define request size/timeout/concurrency limits; define model loading and warm-up; define the exact API schemas and version negotiation; define security controls; define metadata-only logging/metrics; define health/readiness behavior; provide the planned backend folder structure
>
> **Affected documents:** `project-architecture.md`, `data-evaluation-plan.md`, `implementation-plan.md`, `evidence-register.md` where a factual dependency changes
>
> **Completion rule:** replace this block with the signed backend architecture and API contract, then Zeddin may start implementation

### 4.2 Backend implementation boundary

Daffa owns the architecture and accepts technical contract changes. Zeddin implements API routes, orchestration, containerization, deployment, and operational checks. Backend implementation may not change model semantics, safety copy, or schema fields without owner approval.

## 5. AI and inference pipeline [MVP]

The logical pipeline is fixed even though Daffa must select its implementations:

1. Validate schema and model/contract versions.
2. Decode the five guided cough attempts.
3. Apply deterministic preprocessing identical to evaluation.
4. Run the audio-quality gate and return per-attempt reason codes.
5. Aggregate accepted cough representations at participant level.
6. Combine only signed clinical features.
7. Produce an uncalibrated score from the selected evidence-gated model.
8. Apply a versioned calibration artifact fitted without test leakage.
9. Map the calibrated estimate to relative bands/urgency using versioned thresholds.
10. Produce optional non-causal inspection artifacts.
11. Return model, preprocessing, calibration, threshold, schema, and limitation versions.
12. Delete request-scoped input buffers.

> **OWNER INPUT REQUIRED — Daffa — due 2026-06-29**
>
> **Blocks:** `ML-1` through `ML-4`, `BE-2`, `BE-3`, and the result contract
>
> **Required output:** identify baseline and candidate models; specify sampling/segmentation/normalization; define participant-level aggregation; define the clinical-feature encoding and missing-value representation; define the quality algorithm/reason codes; define calibration and thresholds; define artifact formats and version fields; define inspection method/limitations; define latency and memory budgets
>
> **Affected documents:** `project-architecture.md`, `data-evaluation-plan.md`, `evidence-register.md`, `implementation-plan.md`
>
> **Completion rule:** replace this block with the signed pipeline and link the reproducibility manifest; no inference endpoint is implemented before completion

## 6. Shared interface contract [MVP]

The contract version is carried in every request and response. The Gema inference operation is fixed as `POST /api/v1/triage`; the Prisma (digital-CXR) operation is a **separate** endpoint (`POST /api/v1/cxr`) that returns its own estimate and never merges with the cough result. `contracts/openapi/jaga-v1.yaml` is the machine-readable frontend integration proposal, including `GET /api/v1/status`, patient intake, the two inference operations, scoped assistant messages, and structured errors. The frontend can switch between explicitly synthetic fixtures and these live paths without component changes. Daffa must review and sign the complete backend contract before live deployment.

| Operation | Required responsibility |
|---|---|
| Service health | Process availability without claiming model readiness |
| Service readiness | Model, calibration, preprocessing, and schema compatibility |
| `POST /api/v1/triage` | Gema: five cough attempts plus signed clinical payload in one versioned request; performs validation, quality gating, inference, and result composition |
| `POST /api/v1/cxr` | Prisma: one digital-CXR image in a versioned request; performs validation, inference, and a separate result composition; never fused with `POST /api/v1/triage` |
| Result | Request ID, quality result, estimate/band/urgency, mandatory referral, model metadata, limitations, and inspection metadata (per signal, kept separate) |

> **OWNER INPUT REQUIRED — Daffa — due 2026-06-29**
>
> **Blocks:** `BE-1`, `BE-2`, `FE-2`, `FE-3`, `FE-4`, and `FE-5`
>
> **Required output:** define the exact `POST /api/v1/triage` request, response, validation, quality-gate, error, privacy, and model-version contract; provide multipart field names and formats; complete clinical-field schema; units/ranges/requiredness/missing values; audio count/type/size/duration; quality reason-code enum; HTTP status mapping; version fields; representative sanitized examples; and exact health/readiness paths
>
> **Affected documents:** `project-architecture.md`, `product-requirements.md`, `implementation-plan.md`, frontend API mapping in `design-guidelines.md`
>
> **Completion rule:** replace this block with a machine-validatable `POST /api/v1/triage` contract and sanitized success/rejection/failure examples; Zeddin and Kei sign that their implementations will consume the same schema before integration starts

No field named `known_tb_contact` may be introduced unless Daffa documents its training/evaluation basis and the PRD is deliberately revised.

## 7. Data and storage boundaries

| Data | MVP location | Retention |
|---|---|---|
| Eligibility, clinical values, audio, result | Browser memory and request-scoped backend memory | Cleared on reset, acknowledgement, timeout, or request completion |
| Model/calibration/preprocessing artifacts | Versioned deployment image or read-only artifact store | Release-managed, non-patient data |
| Operational metrics | Metrics backend | Aggregate metadata only; no payloads or derived health estimates |
| Synthetic demo fixtures | Repository | Permitted synthetic/consented non-patient content only |
| CODA controlled-access data | Approved research environment | Governed by Synapse terms; never copied into repo or production service |

## 8. Security and privacy [MVP]

- TLS for all external traffic.
- Secrets supplied through deployment environment, never committed or returned.
- Strict CORS allowlist for the deployed frontend.
- MIME/content validation and bounded request sizes before decode.
- No request/response body logging, trace payloads, audio persistence, or estimate analytics.
- Redact query strings, exception context, and framework access logs where they could expose fields.
- Rate limiting and bounded concurrency prevent trivial resource exhaustion.
- Container runs as a non-root user with a minimal runtime image where platform support permits.
- Dependency versions and the ROCm base image are pinned.

> **OWNER INPUT REQUIRED — Daffa — due 2026-06-29**
>
> **Blocks:** `ARCH-2`, `BE-4`, and production deployment approval
>
> **Required output:** specify authentication/no-auth decision for the public demo; CORS origins; size/rate/concurrency limits; secret names; redaction rules; session timeout; container user; dependency/image pinning; health endpoint exposure; incident/reset procedure
>
> **Affected documents:** `project-architecture.md`, `implementation-plan.md`, deployment section of `README.md` after scaffolding
>
> **Completion rule:** replace this block with the signed security profile and verify it against the deployed container

## 9. Observability [MVP]

Allowed telemetry is metadata-only:

- request count by terminal status;
- validation and quality reason-code counts;
- latency distributions by pipeline stage;
- model/artifact version readiness;
- CPU/GPU memory and utilization;
- container restarts and dependency failures.

Prohibited telemetry includes audio, clinical values, raw/derived health estimates, full request IDs in public dashboards, and user-entered text.

> **OWNER INPUT REQUIRED — Daffa — due 2026-06-29**
>
> **Blocks:** `BE-4` and `QA-3`
>
> **Required output:** define metric names/labels, safe request-correlation format, alert thresholds, retention, dashboard access, and the smoke-test evidence required before demo
>
> **Affected documents:** `project-architecture.md`, `implementation-plan.md`
>
> **Completion rule:** replace this block with the signed observability contract and verify that no prohibited payload appears in logs or metrics

## 10. Deployment [MVP]

- Frontend and backend are reachable through HTTPS at the public demo URL.
- Backend and model runtime are containerized and run on AMD infrastructure.
- A clean public checkout can build and run using README instructions.
- Deployment exposes health/readiness checks and pins the same model/preprocessing/calibration versions evaluated for the demo.
- A failed readiness check prevents traffic from reaching inference.
- Deployment rollback restores the last verified artifact set without retaining participant data.

Zeddin owns implementation and deployment after Daffa signs architecture/security contracts. Fransisco owns submission completeness, not runtime operations.

## 11. Repository structure (as-built)

This reflects the layout on `backend-train`. Names may still be adjusted in the signed owner sections, but responsibilities must remain separated. The public request orchestrator is the **Go API** (`backend/go`); model serving is the **Prisma Python worker** (`backend/python/PrismaServer`); training/research is isolated in **`PrismaTraining`**. (Supersedes the earlier planned `apps/api/` FastAPI layout; the contract semantics in §4–§6 are unchanged.)

```text
backend/
├── go/                  # public Go REST API + orchestration (request orchestrator)
│   ├── cmd/server/      # entrypoint
│   └── internal/        # config, handlers, http, memory (Cognee iface), models, routes, validation
└── python/
    ├── PrismaServer/    # Prisma serving worker (bundled local_clahe artifacts)
    └── PrismaTraining/  # research/training: configs, data, models, training, evaluation,
                         #   retrieval, quantum, scripts, utils (controlled-access data ignored)
infra/                   # Docker Swarm deployment plane
├── docker-stack.yml     # nginx, go-api, prisma-worker, postgres, redis, minio
├── nginx/ postgres/ redis/ minio/ cognee/
├── healthcheck/         # api / prisma / cognee probes
└── scripts/             # build, deploy, logs, scale, remove (sh + ps1)
frontend/                # PWA capture/result client (Next.js; see §3.2) — renamed from apps/web 2026-06-30
components/              # ClinicalCaptureForm.jsx — provisional reference prototype the frontend primitives were re-skinned from (design §6); kept as the canonical capture pattern, not built/shipped
design/                  # design tooling: swatch.html (token preview) + contrast.mjs (WCAG ratio verifier, design §4); not application code
```

**Endpoints (as-built):**

| Service | Method · Path | Status |
|---|---|---|
| Go API | `POST /api/v1/patient/intake` | Live — validate/normalize metadata, no persistence/ML |
| Go API | `GET /health`, `GET /healthz` | Live — process health |
| Go API | `GET /api/v1/status`, `GET /v1/status` | Live — service status |
| Go API | `GET /internal/health/cognee` | Live — semantic-memory availability only |
| Prisma worker | `GET /health`, `GET /api/v1/status`, `POST /api/v1/cxr`, `GET /api/v1/quantum` | Live — DenseNet121 CLAHE + quantum highlight (§15) |
| Go API | `POST /api/v1/demographics`, `POST /api/v1/audio/preprocess` | Live — validation + audio DSP (§15) |
| Go API (Gema orchestrator) | `POST /api/v1/triage` | Live — cough gate + acoustic TB model + Gemma next-step (§15) |
| Go API (assistant) | `POST /api/v1/assistant/messages` | Live — Gemma guidance chat (§15) |
| Go API → Prisma | `POST /api/v1/cxr` | Live — proxied to Prisma worker (§15) |

> Tests (`tests/contract/`, `tests/integration/`, `tests/privacy/` per the planned schema/integration/privacy split) are not yet scaffolded; add them as the triage contract is signed.

## 12. Failure policy [MVP]

| Failure | Required behavior |
|---|---|
| Invalid eligibility/schema | Block submission and preserve correct local entries |
| Audio-quality failure | No estimate; targeted retry for affected attempts |
| Model/calibration unavailable | Readiness fails; no estimate |
| Timeout/service unavailable | No estimate; retry option; no stale result |
| Contract mismatch | Terminal technical error; deploy versions must be reconciled |
| Inspection generation fails | Result may proceed only if estimate, safety copy, and metadata are valid; inspection is marked unavailable |

### 12.1 Independent-module failure isolation

| Failure | Required behavior |
|---|---|
| Prisma (CXR) fails `[MVP]` | Gema core result remains independent and unchanged; Prisma panel marked unavailable |
| Fireworks fails `[Stretch]` | Deterministic copy remains; no effect on estimate/referral |

## 13. Architecture acceptance

Architecture is ready for implementation only when:

- every Daffa and Billy owner-input block is replaced with a signed decision;
- PRD-01 through PRD-12 map to modules/interfaces and tickets;
- frontend/backend contract examples validate against one shared schema;
- no patient persistence or payload logging path exists;
- the pinned ROCm container loads the selected artifacts;
- quality, inference, result, and error states are versioned;
- Zeddin and Kei can implement without inventing fields, states, or thresholds.

---

## 14. Implemented backend runtime (`backend-train`)

> **Status:** As-built on the `backend-train` branch. This section records the runtime layout and behavior that exist today; the file/endpoint layout is enumerated in §11. The signed contracts in §4–§9 remain canonical for behavior and safety — code here must reconcile to them as Daffa's `ARCH-1` blocks are signed.

### 14.1 Runtime split

- `backend/python/PrismaTraining` — research and training tree (embedding-first; backbones, training/eval, embedding export, retrieval, post-training quantum branch).
- `backend/python/PrismaServer` — serving worker; `backend/python/PrismaServer/artifacts/local_clahe` holds the current default serving bundle for local and single-node runs.
- `backend/go` — API and orchestration layer (currently patient intake at `POST /api/v1/patient/intake` plus health/status; validates and normalizes metadata, no persistence or ML calls yet).
- `infra` — Docker Swarm deployment plane.

### 14.2 Architecture layers

1. **Capture** — phone mic for guided coughs plus a short structured form; optional digital chest X-ray (Prisma) is the parallel signal.
2. **Backend intake** — Go REST API validates/normalizes patient metadata before any Prisma cough or CXR payload; hosts health endpoints and optional semantic-memory integration; intake does not persist patient records.
3. **Preprocess** — cough → mel-spectrogram and compact audio features; structured inputs normalized.
4. **AI inference on AMD** — cough + clinical model (Gema) produces a calibrated TB-risk probability; the CXR track (Prisma) is a separate model path.
5. **Explain / compose** — spectrograms, attention overlays, calibrated probability, thresholded band, deterministic bilingual referral copy, and optional LLM explanation through Featherless.
6. **Semantic memory** — once structured evidence exists, Cognee may store semantic summaries only (prior predictions, retrieval/quantum/clinical summaries, recommendations, lightweight metadata). Optional; inference must continue if it is unavailable.
7. **Presentation** — Next.js/PWA capture flow and result dashboard.

### 14.3 Tech stack

Next.js / PWA · Go REST API · Prisma Python worker (`PrismaServer`) · TB-CXR research package (`PrismaTraining`) · PyTorch on ROCm (MI300X) · Featherless via an OpenAI-compatible API surface · Cognee semantic memory · PostgreSQL · Redis · MinIO · NGINX · Docker Swarm.

### 14.4 CXR research track (Prisma)

- Interchangeable backbones under `PrismaTraining`; saved embeddings support FAISS retrieval built from exported artifacts.
- A post-training quantum branch compares classical PCA + RBF SVM against PCA + Quantum Kernel SVM on saved embeddings only.
- The serving tree is intentionally separate from this research tree.

### 14.5 Deployment

Docker Swarm with NGINX reverse proxy, replicated `go-api` tasks, and an internal `prisma-worker` tier backed by Redis, PostgreSQL, and MinIO. The normal local run path is stack-first: build images, deploy the stack, operate through `infra/scripts/`.

### 14.6 Memory architecture

- PostgreSQL is the source of truth; Cognee is not mandatory and degrades gracefully.
- Cognee stores semantic summaries only — never raw images, audio, embeddings, FAISS indices, or checkpoints.
- Default deployment keeps Cognee local and uses Featherless instead of a second local LLM service.
- The Go backend depends on a neutral memory interface, not on Cognee APIs directly.

### 14.7 Open items

- Confirm the final cough + clinical backbone for the demo path.
- Reconcile the as-built `POST /api/v1/triage` / `POST /api/v1/cxr` contracts (§15) with Daffa's `ARCH-1` sign-off.
- Wire completed inference output into the memory layer without blocking predictions.
- Confirm the submission deployment environment and public URL.

---

## 15. Acoustic triage + model services (as-built)

> **Status:** Implemented. Records the acoustic-triage pipeline, the Gemma
> orchestrator/assistant, the Rust model services, and the Prisma CXR + quantum
> path built on this branch. Behavior reconciles to the signed §4–§6 contracts:
> signals stay separate, estimates come from calibrated models (never the LLM),
> and every path fails closed.

### 15.1 Service topology

```text
Frontend ──► NGINX ──► Go API (gateway, backend/backendHandlers)
   POST /api/v1/demographics        validate → gema/prisma contracts
   POST /api/v1/audio/preprocess    DC-offset · 80 Hz high-pass · silence trim · peak-normalize (pure Go)
   POST /api/v1/triage      ─┐  Gema orchestrator
   POST /api/v1/assistant/messages  Gemma guidance chat
   POST /api/v1/cxr         ─┼─► Prisma worker (Python)
                             │
        ┌────────────────────┴───────────────────────┐
        ▼                                             ▼
  yamnet (Rust, :8081)                        xgboost (Rust, :8082)
  YAMNet ONNX cough gate                      demo preprocessor (in-Rust) + XGBoost ONNX
  class 42 "Cough", frame-sliding             WavLM embedding via Fireworks → 1024
                                              + 12 demographic features → 1036 → TB prob
```

- **Runtime split:** Go API is the only public surface (gateway). The two Rust
  services and the Prisma worker are internal, reached over the overlay network.
- **ONNX Runtime:** both Rust services run models via the `ort` crate
  (ONNX Runtime), loaded dynamically through `ORT_DYLIB_PATH`. tract was rejected
  because the classical-ML ops (`TreeEnsembleClassifier`, `OneHotEncoder`,
  `Scaler`) it does not implement are exactly what these models use.

### 15.2 Gema orchestrator (Go + Gemma)

`POST /api/v1/triage` (`cough` WAV + `clinical` JSON) runs: audio preprocessing →
YAMNet cough gate → XGBoost TB probability → Gemma next-step. Gemma (Fireworks
chat) acts purely as an **orchestrator/summarizer**: it writes the
`mandatory_next_step` guidance and never invents or restates a probability — the
numeric estimate is the calibrated XGBoost output. No usable cough ⇒ `retryable`
with no estimate; any upstream failure ⇒ `system_error`; both fall back to
deterministic copy so the endpoint always returns a valid `gema` result. The
orchestrator omniprompt lives at `internal/llm/prompts/orchestrator.md`.

### 15.3 Guidance assistant (Go + Gemma)

`POST /api/v1/assistant/messages` is the `assistant-v1` chat, also Gemma. The
assistant omniprompt (`internal/llm/prompts/assistant.md`) constrains it to
explaining the process and general TB facts; any request to diagnose, interpret
an individual result, or advise treatment returns a `safety_redirect`.

### 15.4 Prisma CXR (Python) + **quantum highlight**

`POST /api/v1/cxr` runs the `local_clahe` bundle: CLAHE preprocessing →
DenseNet121 (`encoder.features` → 1024→256 embedding → single TB logit) → sigmoid
→ calibrated `prisma` result. The reconstructed architecture loads `best.pt`
with `strict=True`.

**Quantum kernel (highlighted).** The bundle ships a post-training quantum branch
that is surfaced as a first-class result, not buried in research:

- `GET /api/v1/quantum` returns the quantum evaluation, and every `/api/v1/cxr`
  response embeds a `quantum` block.
- Method: PCA-reduce the DenseNet embeddings to 4 dimensions (98.9% variance
  retained) and classify with a **Quantum Kernel SVM** on **PennyLane
  `lightning.qubit`, 4 qubits**, benchmarked against a classical RBF-SVM baseline.
- Result: the quantum-kernel SVM reaches **98.3% accuracy / 1.00 ROC-AUC** on the
  held-out split, matching the classical kernel — evidence that the learned CXR
  embedding is quantum-kernel-separable.

### 15.5 WavLM embedding (Rust → Fireworks)

The xgboost service obtains the 1024-dim audio embedding from the Fireworks WavLM
deployment (`/inference/v1/embeddings`, WAV base64 in `input`), then appends the
12 demographic features (a pure-Rust reimplementation of the ONNX preprocessor,
verified against it) before the XGBoost tree ensemble. Demographics are validated
by calling back into the Go API, so validation rules live in one place.
