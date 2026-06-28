# Jaga · Implementation Plan and Ticket Board

**Document type:** Implementation plan and ticket board
**Audience:** Whole team
**Status:** Active · preparation starts 2026-06-29
**Canonical for:** Work sequence, ticket ownership, dependencies, milestones, merge order, fallbacks, and submission completeness
**Companion documents:** [`product-requirements.md`](product-requirements.md), [`project-architecture.md`](project-architecture.md), [`data-evaluation-plan.md`](data-evaluation-plan.md), [`design-guidelines.md`](design-guidelines.md), [`evidence-register.md`](evidence-register.md)

## How to read this document

The PRD controls behavior and safety. Architecture/design owner blocks must be completed before their dependent implementation tickets start. Ticket acceptance criteria are mandatory; a checked task without its criteria is not done.

## 1. Timeline and priorities

| Phase | Dates | Goal |
|---|---|---|
| Preparation and prototype | 29 June–5 July | Lock contracts, verify controlled data, produce baseline, specify frontend, scaffold, and prove one integration path |
| Official MVP integration | 6–9 July | Complete all P0 feature tickets on AMD |
| Hardening and demo | 10 July | Evaluation, accessibility, failure paths, privacy, deployment, video |
| Submission | 11 July, before 15:00 UTC / 22:00 WIB | Verify public runnable repository and submit every required asset |

- **P0:** required for submission.
- **P1:** starts only when all P0 tickets on its dependency path are passing.
- **P2:** isolated stretch; may not delay P0.

## 2. Ownership

| Owner | Decision responsibility | Implementation responsibility |
|---|---|---|
| Daffa | Backend/AI architecture, data/model/evaluation contracts | Model, preprocessing, quality, calibration, release artifacts |
| Zeddin | Proposes backend implementation details to Daffa | FastAPI, orchestration, integration, containerization, deployment |
| Billy | Frontend/design architecture, copy, accessibility, review | Design system, integration review, final polish |
| Kei | Proposes frontend implementation details to Billy | Capture/result frontend implementation |
| Fransisco | Scope, schedule, pitch/evidence consistency | Submission copy, slides, video, asset completeness |

## 3. Blocking owner handoffs

### ARCH-0 · Data and evaluation decision pack [P0]

**Owner:** Daffa

**Due:** 29 June

**Blocks:** ML-0 through ML-4; any model claim

**Documents:** `evidence-register.md`, `data-evaluation-plan.md`

**Required output**

- Replace the dataset, split, preprocessing, model-gate, calibration, and artifact owner blocks.
- Identify controlled-access files, restrictions, ignored paths, and held-out evaluation route.
- Set numeric model-promotion and runtime budgets.

**Acceptance criteria**

- No restricted data or credential enters Git.
- Split policy is participant-grouped and predeclared before final evaluation.
- Baseline, candidate, fallback, calibration, and artifact contracts are implementable without inference.

### ARCH-1 · Backend, AI, and API contract [P0]

**Owner:** Daffa

**Due:** 29 June

**Depends on:** ARCH-0

**Blocks:** BE-0 through BE-3; FE-2 through FE-5

**Documents:** `project-architecture.md`, `data-evaluation-plan.md`

**Required output**

- Replace backend, AI pipeline, and shared-interface owner blocks.
- Define the exact `POST /api/v1/triage` request, response, validation, quality-gate, error, privacy, and model-version contract.
- Provide exact schemas, enums, limits, HTTP status mapping, sanitized examples, and version negotiation.
- Sign the boundary between Daffa's artifacts and Zeddin's service.

**Acceptance criteria**

- Contract covers PRD-02 through PRD-06 and every error state.
- `known_tb_contact` is absent unless deliberately evidenced and approved.
- `POST /api/v1/triage` validates against shared sanitized success, quality-rejection, validation-error, service-error, and version-mismatch examples.
- Zeddin and Kei can generate matching contract fixtures without inventing fields.

### ARCH-2 · Security and observability profile [P0]

**Owner:** Daffa

**Due:** 29 June

**Depends on:** ARCH-1

**Blocks:** BE-4, BE-5, QA-3

**Documents:** `project-architecture.md`

**Required output**

- Replace security and observability owner blocks.
- Define no-auth/auth choice, CORS, limits, redaction, metrics, alerts, retention, readiness, and rollback.

**Acceptance criteria**

- No allowed log/metric contains payload or health-estimate data.
- Production readiness and rollback are testable.

### UX-0 · Frontend screen and state contract [P0]

**Owner:** Billy

**Status:** Signed 2026-06-28 — screen map + state machine in `design-guidelines.md` §3 and `project-architecture.md` §3.2. (API codes pin on `ARCH-1`.)

**Blocks:** FE-0 through FE-5

**Documents:** `design-guidelines.md`, frontend section of `project-architecture.md`

**Required output**

- Replace screen/state and frontend-architecture owner blocks.
- Map PRD requirements and API states/errors to routes, screens, state, reset, and accessibility behavior.

**Acceptance criteria**

- All success/failure paths are represented.
- Kei can implement navigation and state without inventing behavior.

### UX-1 · Design, components, motion, and copy contract [P0]

**Owner:** Billy

**Status:** Design/token/component/motion/localization-rules drafted 2026-06-28 in `design-guidelines.md` §4–§10 (verified contrast evidence in §4.6). Open: final paired EN/ID string table; API mapping pins on `ARCH-1`.

**Depends on:** UX-0; ARCH-1 for API mapping

**Blocks:** styling and acceptance of FE-1 through FE-5

**Documents:** `design-guidelines.md`

**Required output**

- Replace color, typography/spacing, component, result/motion, and localization owner blocks.
- Provide exact tokens, states, responsive rules, paired strings, and accessibility evidence.

**Acceptance criteria**

- Lower-risk presentation cannot imply clearance.
- Every mandatory state has reviewed Bahasa Indonesia and English copy.
- Kei can style screens without inventing tokens or component behavior.

## 4. Preparation tickets · 29 June–5 July

### ML-0 · Controlled-data manifest [P0]

**Owner:** Daffa

**Depends on:** ARCH-0

**Work**

- Verify approved Synapse access and download only to ignored controlled paths.
- Produce a non-sensitive file/variable/class/missingness manifest.
- Verify five-cough protocol and training/held-out partitions against source documentation.

**Acceptance criteria**

- Manifest contains no participant data or credentials.
- Checksums, restrictions, and ignored paths are documented.
- Evidence register and data plan contain no unresolved public dataset facts.

### ML-1 · Reproducible baseline [P0]

**Owner:** Daffa

**Depends on:** ML-0; signed model/preprocessing gate in ARCH-0

**Work**

- Implement the signed log-mel plus clinical baseline in the pinned ROCm environment.
- Produce participant-grouped development metrics and a run manifest.
- Record latency/memory and package a fallback artifact.

**Acceptance criteria**

- One command reproduces the run from the controlled environment.
- No participant crosses folds.
- Metrics are labelled development results, not held-out or clinical validation.

### BE-0 · Backend scaffold [P0]

**Owner:** Zeddin

**Depends on:** ARCH-1 signed

**Work**

- Scaffold FastAPI modules, dependency management, tests, and pinned Docker runtime.
- Add health/readiness skeletons and schema generation from the signed contract.

**Acceptance criteria**

- Container starts locally on the target base image.
- Health works without a model; readiness fails until compatible artifacts load.
- Contract fixture validates through the generated schema.

### FE-0 · Frontend scaffold [P0]

**Owner:** Kei

**Reviewer:** Billy

**Depends on:** UX-0 signed

**Work**

- Scaffold the signed Next.js/PWA structure, routes, state container, locale files, tests, and base accessibility tooling.
- Keep patient-flow state in memory only.

**Acceptance criteria**

- Planned routes render and keyboard navigation works.
- No patient field is written to localStorage, IndexedDB, service-worker cache, or analytics.
- Billy approves structure before feature work.

### QA-0 · Contract and synthetic-fixture foundation [P0]

**Owner:** Zeddin + Kei

**Depends on:** ARCH-1; UX-0

**Work**

- Build shared sanitized request/response/error fixtures.
- Build synthetic clinical and consented/generated non-patient audio fixtures.

**Acceptance criteria**

- Frontend and backend tests consume the same contract fixtures.
- Fixtures cover valid, invalid, quality-error, timeout, version-mismatch, and missing-metadata paths.
- No controlled CODA artifact enters the repository.

### INT-0 · Vertical integration spike [P0]

**Owner:** Zeddin + Kei

**Reviewers:** Daffa + Billy

**Depends on:** BE-0; FE-0; QA-0; ML-1 fallback artifact

**Work**

- Connect one synthetic eligibility/form/audio request through the service to a fixture result.
- Prove contract/version handling and reset.

**Acceptance criteria**

- Success and one terminal failure render end to end.
- No body/payload appears in logs.
- Reviewers approve the integration boundary before official sprint work.

## 5. Official MVP tickets · 6–9 July

### FE-1 · Eligibility, consent, and localization [P0]

**Owner:** Kei

**Reviewer:** Billy

**Depends on:** FE-0; UX-1

**Covers:** PRD-01, PRD-07

**Acceptance criteria**

- Unconfirmed/out-of-cohort cases cannot submit.
- Confirmatory-evaluation acknowledgement is explicit and not preselected.
- Language switching preserves state and all copy has reviewed pairs.

### FE-2 · Clinical capture [P0]

**Owner:** Kei

**Reviewer:** Billy

**Depends on:** FE-1; ARCH-1

**Covers:** PRD-02

**Acceptance criteria**

- Renders only schema-defined fields with units, ranges, requiredness, and errors.
- Client and server validate the same fixture set.
- Unsupported fields never reach the payload.

### ML-2 · Quality gate and preprocessing package [P0]

**Owner:** Daffa

**Depends on:** ML-1; signed quality contract

**Covers:** PRD-04

**Acceptance criteria**

- Evaluation and service use the same versioned package.
- Sanitized fixtures cover every reason code.
- Failed quality returns no risk estimate.

### FE-3 · Five-cough recorder and quality retry [P0]

**Owner:** Kei

**Reviewers:** Billy + Daffa

**Depends on:** FE-2; ML-2; ARCH-1

**Covers:** PRD-03, PRD-04

**Acceptance criteria**

- Exactly five attempts with replay/replace and 1/5–5/5 progress.
- Permission, interruption, unsupported-device, and each quality-error path pass.
- Retrying one attempt preserves other accepted attempts and clinical state.

### BE-1 · Versioned schema and validation [P0]

**Owner:** Zeddin

**Reviewer:** Daffa

**Depends on:** BE-0; ARCH-1

**Covers:** PRD-02, PRD-05

**Acceptance criteria**

- Rejects invalid types, units, counts, encodings, sizes, and versions before inference.
- Error schema matches shared fixtures.
- Access logs contain no payload values.

### BE-2 · Quality and inference orchestration [P0]

**Owner:** Zeddin

**Reviewer:** Daffa

**Depends on:** BE-1; ML-2; ML-3 artifact

**Covers:** PRD-04, PRD-05

**Acceptance criteria**

- Executes the signed request-scoped pipeline in order.
- Timeout/unavailable/mismatch failures return no estimate.
- Request buffers are released after completion.

### ML-3 · Calibration, evaluation, and release candidate [P0]

**Owner:** Daffa

**Depends on:** ML-1; ML-2; signed calibration/evaluation contracts

**Covers:** PRD-06

**Acceptance criteria**

- Reports discrimination, calibration, thresholds, country/subgroup results where permitted, latency, and memory.
- Publishes negative/inconclusive evidence and CODA external-validation limitation.
- Packages compatible model, preprocessing, calibration, threshold, schema, and limitation versions.

### BE-3 · Result composition and readiness [P0]

**Owner:** Zeddin

**Reviewers:** Daffa + Billy

**Depends on:** BE-2; ML-3; UX-1

**Covers:** PRD-06

**Acceptance criteria**

- Returns estimate only with compatible calibration/model metadata.
- Every band contains mandatory confirmatory-evaluation data.
- Readiness fails for missing/incompatible artifacts.

### FE-4 · Submission and resilient states [P0]

**Owner:** Kei

**Reviewer:** Billy

**Depends on:** FE-3; BE-2

**Covers:** PRD-05, PRD-08

**Acceptance criteria**

- Preparing/uploading/processing/retryable/terminal/success states pass.
- Prevents duplicate submission and stale results.
- Reset and timeout clear all in-memory patient inputs.

### FE-5 · Research result and limitations [P0]

**Owner:** Kei

**Reviewers:** Billy + Daffa

**Depends on:** FE-4; BE-3; UX-1

**Covers:** PRD-06, PRD-12

**Acceptance criteria**

- Locked hierarchy and copy meanings are preserved in both languages.
- Lower band does not resemble clinical clearance.
- Inspection is labelled non-causal and has a text alternative.
- Missing calibration/model metadata produces no probability.

### BE-4 · Privacy, security, and observability [P0]

**Owner:** Zeddin

**Reviewer:** Daffa

**Depends on:** ARCH-2; BE-2

**Covers:** PRD-08

**Acceptance criteria**

- CORS, limits, secret handling, redaction, metadata metrics, and non-root container settings match the signed profile.
- Automated checks find no payload/estimate in logs or metrics.
- Rate/concurrency and failure behavior are exercised.

## 6. Hardening and submission tickets · 10–11 July

### QA-1 · End-to-end and contract suite [P0]

**Owner:** Zeddin + Kei

**Depends on:** FE-1 through FE-5; BE-1 through BE-4; ML-3

**Acceptance criteria**

- Synthetic success and all defined failure fixtures pass in both languages.
- Frontend/backend contract and version mismatch tests pass.
- No real or controlled participant data is used.

### QA-2 · Accessibility and responsive review [P0]

**Owner:** Billy

**Implementer:** Kei

**Depends on:** FE-5

**Acceptance criteria**

- Keyboard, screen-reader semantics, focus, status announcements, contrast, reduced motion, 200% zoom, 320px width, and 44px targets pass.
- Charts/inspection have useful text alternatives.
- Safety copy remains visible and understandable.

### QA-3 · Privacy, deployment, and failure review [P0]

**Owner:** Daffa + Zeddin

**Depends on:** BE-4; QA-1

**Acceptance criteria**

- Deployed logs/metrics contain no prohibited data.
- Health/readiness, timeout, unavailable model, restart, and rollback pass.
- Deployed artifacts match the evaluated versions.

### BE-5 · Public deployment and README commands [P0]

**Owner:** Zeddin

**Depends on:** QA-1; QA-3

**Acceptance criteria**

- Public HTTPS application and AMD-hosted container are reachable.
- A clean checkout follows README setup/usage commands successfully.
- Required environment variables are documented without secrets.
- Containerization and health checks are documented.

### PM-1 · Evidence and metric sign-off [P0]

**Owner:** Fransisco

**Reviewer:** Daffa

**Depends on:** ML-3

**Acceptance criteria**

- Every pitch number maps to an evidence ID or actual Jaga report.
- Published CODA and actual Jaga results are visually and verbally distinct.
- Research boundary and external-generalization limitation appear in README, app, slides, and video.

### PM-2 · Demo and submission package [P0]

**Owner:** Fransisco + Billy

**Depends on:** BE-5; QA-2; PM-1

**Acceptance criteria**

- Title, short/long descriptions, tags, cover image, video, slides, public repo, demo platform, and application URL are complete.
- Five-minute demo follows the product-brief timing.
- Submission is completed before 11 July 15:00 UTC / 22:00 WIB.

## 7. Parallel and optional tickets

### ML-4 · Pretrained encoder evidence gate [P1]

**Owner:** Daffa

**Depends on:** reproducible ML-1; all numeric promotion rules signed

Promote only if every discrimination, calibration, country-fold, license, latency, memory, and reproducibility gate passes. Otherwise retain the baseline without apology.

### UX-2 · Result-reveal polish [P1]

**Owner:** Billy + Kei

**Depends on:** FE-5; QA-2

Motion must preserve the locked hierarchy and reduced-motion behavior.

### BE-6 · Fireworks richer note [P1]

**Owner:** Zeddin

**Reviewers:** Daffa + Fransisco

**Depends on:** all core result paths passing

Use sanitized structured output only; deterministic safety/referral copy remains authoritative.

### ML-5 / FE-7 · Independent CXR module — Prisma [P0]

**Owners:** Daffa / Kei

**Reviewers:** Billy + Fransisco

**Depends on:** Prisma model artifact and the `POST /api/v1/cxr` contract; built in parallel with the Gema core, not gated behind it

Separate pipeline, schema, evaluation, panel, limitations, and metrics. Co-equal MVP signal; never fused with Gema and no photographed-film input.

## 8. Ticket delivery contracts

This matrix supplies the affected interfaces, concrete deliverable, and fallback for every ticket above. “Submission blocked” means the ticket has no safe reduced MVP behavior.

| Ticket | Affected interfaces | Deliverable | Fallback |
|---|---|---|---|
| ARCH-0 | Data manifest, split protocol, preprocessing, promotion/calibration gates | Signed data/evaluation decision pack | Submission blocked; no model work proceeds on inferred rules |
| ARCH-1 | `POST /api/v1/triage`, artifact boundary, frontend/backend fixtures | Machine-validatable signed API and AI contract | Submission blocked; integration remains on synthetic fixture only |
| ARCH-2 | Public demo security, logs, metrics, readiness, rollback | Signed security and observability profile | Submission blocked; service is not exposed publicly |
| UX-0 | Routes, screen state, session/reset, API-to-UI mapping | Signed frontend screen/state contract | Submission blocked; Kei does not invent navigation or states |
| UX-1 | Tokens, components, copy, responsive and motion rules | Signed design and copy contract | Use static baseline styling only for prototypes; acceptance remains blocked |
| ML-0 | CODA controlled paths and non-sensitive manifest | Verified data manifest with restrictions and checksums | Use synthetic fixtures only; no performance claim |
| ML-1 | Training entrypoint, run manifest, baseline artifact | Reproducible ROCm baseline and fallback artifact | Use deterministic synthetic result fixture; live model submission blocked |
| BE-0 | API modules, schemas, health/readiness, container | Runnable backend scaffold | Local fixture service only; deployment tickets remain blocked |
| FE-0 | Routes, state, locales, accessibility tooling | Runnable in-memory PWA scaffold | Static signed screen prototype only; feature tickets remain blocked |
| QA-0 | Shared request/response/error and audio fixtures | Sanitized shared contract-fixture set | Hand-authored local smoke fixture; integration acceptance blocked |
| INT-0 | PWA → API → fixture result → reset | Accepted vertical integration spike | Pre-record the failure and keep official feature work blocked until fixed |
| FE-1 | PRD-01, PRD-07, eligibility/consent/locales | Tested eligibility, consent, and language flow | Submission blocked; no bypass around eligibility or consent |
| FE-2 | PRD-02 and signed clinical request fields | Schema-driven clinical form | Submission blocked; unsupported or hard-coded fields are not accepted |
| ML-2 | PRD-04, preprocessing package, quality reason codes | Versioned quality/preprocessing package and test vectors | Apply the signed stricter deterministic rejection mode; never score rejected audio |
| FE-3 | PRD-03/04, browser audio, quality/retry responses | Five-cough recorder with targeted retry | Use generated non-patient fixture audio for demo; retain the five-attempt UI contract |
| BE-1 | PRD-02/05 and `POST /api/v1/triage` validation | Versioned request/error validation | Reject the request; never coerce or silently drop invalid fields |
| BE-2 | PRD-04/05, quality and model artifact calls | Request-scoped orchestration | Return structured unavailable error with no estimate |
| ML-3 | PRD-06, calibration, thresholds, model metadata | Evaluated, calibrated release artifact and report | Ship the reproducible baseline if it passes signed minimum release rules; otherwise block live estimates |
| BE-3 | PRD-06 result schema and readiness | Version-compatible result composer and readiness gate | Fail readiness and return no estimate |
| FE-4 | PRD-05/08 submission, retry, reset, timeout | Resilient submission state machine | Show deterministic retry/unavailable state; never show stale output |
| FE-5 | PRD-06/12 result and limitations | Accessible bilingual research-result screen | Static accessible result; omit optional inspection artifact |
| BE-4 | PRD-08, CORS, limits, secrets, redaction, metrics | Verified security/observability implementation | Keep deployment private; public submission blocked |
| QA-1 | All P0 flows and signed schema versions | Passing end-to-end and contract suite | Submission blocked until all defined P0 fixtures pass |
| QA-2 | Accessibility and responsive contract | Recorded accessibility/responsive review | Ship static/reduced-motion presentation after defects are fixed; unresolved safety/access defects block submission |
| QA-3 | Privacy, deployment, failures, rollback | Passing deployed privacy and resilience report | Submission blocked; use local smoke path only for diagnosis |
| BE-5 | Public URL, AMD container, README commands | Verified public deployment and clean-checkout record | No safe fallback for the required public runnable submission |
| PM-1 | Evidence IDs, actual metrics, README/app/slides/video claims | Signed evidence and metric checklist | Remove any unverified claim or metric |
| PM-2 | Event listing, cover, video, slides, repo, demo, URL | Complete submitted package | Drop P1/P2 material; P0 submission assets remain mandatory |
| ML-4 | Candidate encoder, license, promotion gates | Candidate comparison and promotion decision | Retain ML-1 baseline |
| UX-2 | Result transition and reduced-motion path | Optional result-reveal polish | Ship static result |
| BE-6 | Sanitized structured output and optional generated note | Isolated Fireworks explanation path | Deterministic bilingual copy only |
| ML-5 / FE-7 | Separate CXR pipeline, schema, evaluation, panel | Independent co-equal CXR (Prisma) module | Mark Prisma unavailable in its own panel; Gema core is unaffected and never fused |

## 9. Daily milestone summary

| Date | Required milestone |
|---|---|
| 29 Jun | ARCH-0/1/2 signed; ML-0 begins; BE-0 unblocked |
| 30 Jun | UX-0/1 signed; FE-0 unblocked; shared contract fixtures ready |
| 1–3 Jul | ML-1, BE-0, FE-0, QA-0 complete |
| 4–5 Jul | INT-0 vertical spike accepted; official sprint backlog re-estimated without changing P0 scope |
| 6 Jul | FE-1/2, BE-1, ML-2 underway on signed contracts |
| 7 Jul | FE-3, BE-2, ML-3 integration |
| 8 Jul | FE-4, BE-3, BE-4 integration |
| 9 Jul | FE-5 complete; P0 feature freeze |
| 10 Jul | QA-1/2/3, BE-5, PM-1, video recording |
| 11 Jul | PM-2 verification, submission, buffer |

## 10. Shared-file and merge rules

- Canonical docs are changed by their listed owner or with owner review.
- Shared API/schema fixtures are owned by Daffa; Zeddin and Kei consume them.
- Billy owns frontend tokens and locale meanings; Kei consumes them.
- Use feature branches for development and rebase onto `main`; do not merge stale contracts.
- Merge order for a contract change: canonical document/schema → backend/model producer → frontend consumer → integration tests.
- A change to safety, cohort, scope, or evidence requires documentation approval before code merge.

## 11. Cross-cutting fallbacks

| Risk | Fallback | Owner |
|---|---|---|
| Candidate encoder fails a gate | Ship reproducible baseline | Daffa |
| Actual performance is weak | Report it honestly; do not inherit CODA metrics | Daffa + Fransisco |
| Quality gate unreliable | Use stricter deterministic rejection and show retry; never score rejected audio | Daffa |
| AMD serving is unstable | Reduce model complexity to the verified fallback artifact; keep AMD deployment | Daffa + Zeddin |
| Fireworks fails | Deterministic bilingual copy only | Zeddin |
| CXR (Prisma) slips | Ship Prisma as a separate, clearly-labeled estimate; degrade its panel independently; never fuse with Gema | Daffa |
| Result motion slips | Ship static accessible result | Billy |
| Internet/demo instability | Keep local container smoke path and pre-recorded video; do not fake live inference | Zeddin + Fransisco |
| Submission time pressure | Freeze P0 on 9 July; no P1/P2 after freeze | Fransisco |

## 12. Definition of done

The project is submission-ready only when every P0 ticket is accepted, all owner-input blocks are replaced, traceability from PRD → architecture → ticket → test is complete, actual metrics are honest, privacy checks pass, the public README works from a clean checkout, the AMD container is live, and all submission assets are uploaded before the deadline.

---

## 13. Current baseline (as-built on `backend-train`)

What already exists in the repository today. These are scaffolds/contracts; behavior still pins on the signed owner blocks above.

- [x] Repo split into `backend/go`, `backend/python/PrismaServer`, `backend/python/PrismaTraining`, and `infra`.
- [x] Docker Swarm deployment plane with NGINX, `go-api`, `prisma-worker`, Redis, PostgreSQL, and MinIO.
- [x] Local image build and stack deploy scripts under `infra/scripts/`.
- [x] Go patient intake endpoint at `POST /api/v1/patient/intake` (validate/normalize metadata; no persistence or ML yet).
- [x] Optional Cognee semantic-memory layer behind a neutral Go interface, with a local Cognee service and Featherless-backed generation.
- [x] Default `local_clahe` serving artifacts bundled into `PrismaServer`.
- [ ] Final cough + clinical triage endpoint contract still pending (Daffa `ARCH-1`).

## 14. API contract notes (as-built)

- `POST /api/v1/patient/intake` — validates and normalizes patient metadata.
- `POST /api/v1/triage` — the main missing contract (Gema; see architecture §6).
- `POST /api/v1/cxr` — separate Prisma signal (architecture §6), never fused with triage.
- `GET /health` — stack health endpoint.
- `GET /internal/health/cognee` — reports semantic-memory availability only.
- Featherless integrations treat Featherless as an OpenAI-compatible API surface.
- Cognee stays optional and never blocks predictions; the normal local path needs no hosted Cognee endpoint or API key.

## 15. Infrastructure contract

- Swarm only: Docker Swarm, not Kubernetes or k3s.
- Public ingress: NGINX, not Traefik.
- Public service entrypoint: `go-api` behind NGINX.
- Internal services: `prisma-worker`, `redis`, `postgres`, `minio`.
- Scale shape: `go-api` horizontally; `prisma-worker` by replica count, one job per worker.
- Runtime packaging: `PrismaServer` serves; `PrismaTraining` is research/training only.
- Local memory path: Cognee runs in-stack and relies on Featherless for generation.
