# Jaga · Project Architecture

**Document type:** Project architecture
**Audience:** Backend, frontend, ML, platform, QA, and technical reviewers
**Status:** Active · owner contracts required before feature implementation
**Owner:** Daffa
**Updated:** 2026-06-28
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
FastAPI service on AMD infrastructure
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

> **OWNER INPUT REQUIRED — Billy — due 2026-06-30**
>
> **Blocks:** `FE-0` through `FE-5` and Kei's frontend implementation
>
> **Required output:** select the final frontend libraries; define the route/screen map; define the state machine and reset/session-timeout behavior; map every API state and error code to UI behavior; define the in-memory form/audio model; define accessibility and responsive implementation rules; provide the planned frontend folder structure
>
> **Affected documents:** `project-architecture.md`, `design-guidelines.md`, `implementation-plan.md`, `product-requirements.md` if behavior changes
>
> **Completion rule:** replace this block with a signed frontend architecture section, update ticket dependencies, and append the decision to `log.md`

### 3.2 Frontend implementation boundary

Billy owns frontend architecture, UX, accessibility, and review. Kei implements the signed specification. Kei may propose changes, but any change to behavior, safety, state, or contract must be accepted in the canonical document before implementation.

## 4. Backend architecture [MVP]

### 4.1 Locked constraints

- FastAPI/Python service packaged in Docker and deployed on AMD infrastructure.
- Request-scoped processing only; no input persistence.
- Validate content type, byte limits, encoding, field schema, contract version, and model availability before inference.
- Return structured error codes; never return partial or stale estimates.
- Model loading, preprocessing, inference, calibration, inspection, and result composition are separate modules with versioned boundaries.
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

The contract version is carried in every request and response. The primary inference operation is fixed as `POST /api/v1/triage`; Daffa must define its complete contract before backend or frontend integration. Health/readiness paths may be finalized in the signed contract.

| Operation | Required responsibility |
|---|---|
| Service health | Process availability without claiming model readiness |
| Service readiness | Model, calibration, preprocessing, and schema compatibility |
| `POST /api/v1/triage` | Five cough attempts plus signed clinical payload in one versioned request; performs validation, quality gating, inference, and result composition |
| Result | Request ID, quality result, estimate/band/urgency, mandatory referral, model metadata, limitations, and inspection metadata |

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

## 11. Planned repository structure

The exact names may be adjusted in the signed owner sections, but responsibilities must remain separated:

```text
apps/
├── web/                 # PWA capture/result client
└── api/                 # FastAPI request orchestration
ml/
├── data/                # controlled-access download/manifests; ignored
├── training/            # baseline/candidate training
├── evaluation/          # participant-grouped/LOCO/calibration reports
└── artifacts/           # versioned non-patient model metadata
infra/
├── containers/          # pinned runtime images
└── deploy/              # AMD deployment configuration
tests/
├── contract/            # frontend/backend schema compatibility
├── integration/         # end-to-end fixture paths
└── privacy/             # logging/retention assertions
```

## 12. Failure policy [MVP]

| Failure | Required behavior |
|---|---|
| Invalid eligibility/schema | Block submission and preserve correct local entries |
| Audio-quality failure | No estimate; targeted retry for affected attempts |
| Model/calibration unavailable | Readiness fails; no estimate |
| Timeout/service unavailable | No estimate; retry option; no stale result |
| Contract mismatch | Terminal technical error; deploy versions must be reconciled |
| Inspection generation fails | Result may proceed only if estimate, safety copy, and metadata are valid; inspection is marked unavailable |

### 12.1 Stretch failure isolation [Stretch]

| Failure | Required behavior |
|---|---|
| Fireworks fails | Deterministic copy remains; no effect on estimate/referral |
| CXR fails | Core result remains independent and unchanged |

## 13. Architecture acceptance

Architecture is ready for implementation only when:

- every Daffa and Billy owner-input block is replaced with a signed decision;
- PRD-01 through PRD-12 map to modules/interfaces and tickets;
- frontend/backend contract examples validate against one shared schema;
- no patient persistence or payload logging path exists;
- the pinned ROCm container loads the selected artifacts;
- quality, inference, result, and error states are versioned;
- Zeddin and Kei can implement without inventing fields, states, or thresholds.
