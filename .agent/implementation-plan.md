# Jaga · Implementation Plan

**Type:** Execution plan · **Audience:** whole team
**Canonical for:** ticket ownership, dependencies, deployment shape, and submission deliverables.

---

## Current baseline
- [x] Repo scaffold split into `backend/go`, `backend/python/PrismaServer`, `backend/python/PrismaTraining`, and `infra`.
- [x] Docker Swarm deployment plane exists with NGINX, `go-api`, `prisma-worker`, Redis, PostgreSQL, and MinIO.
- [x] Local image build and stack deploy scripts exist under `infra/scripts/`.
- [x] Go patient intake endpoint exists at `POST /api/v1/patient/intake`.
- [x] Optional Cognee semantic-memory layer exists behind a neutral Go interface, with a local Cognee service and Featherless-backed generation path.
- [x] Default `local_clahe` serving artifacts are bundled into `PrismaServer`.
- [ ] Final cough + clinical triage endpoint contract is still pending.

## P0 - must ship
| # | Task | Owner | Depends on |
|---|---|---|---|
| 1 | Baseline cough + clinical model on MI300X | Daffa | CODA access |
| 2 | Subject-level and leave-one-country-out evaluation with calibration and subgroup metrics | Daffa | #1 |
| 3 | Triage inference contract between frontend, Go API, and Prisma worker | Zeddin + Kei | #1 |
| 4 | Capture journey PWA with guided coughs and clinical form | Kei | #3 |
| 5 | Result dashboard with calibrated band, inspection artifacts, limitations, and deterministic referral copy | Kei + Billy | #3 |
| 6 | End-to-end Swarm deployment on AMD-backed infrastructure | Zeddin | #3, #5 |
| 7 | Honest metrics writeup in repo, demo, and result UI | Daffa + Fransisco | #2 |
| 8 | Public demo, video, slides, and repo handoff | Fransisco + Billy | #6, #7 |

## P1 - if on track
- Compare stronger pretrained audio encoders against the baseline.
- Add richer Featherless-generated explanation copy while keeping deterministic copy as default.
- Use Cognee memory to ground LLM explanations from prior visit summaries.
- Validate the local Cognee + Featherless memory path in the stack.

## P2 - stretch
- Independent digital-CXR panel backed by the `PrismaTraining` research track.
- Retrieval evidence surfaced from saved embedding artifacts.
- Quantum comparison included as a research appendix, not a primary product claim.

## API contract notes
- `POST /api/v1/patient/intake` validates and normalizes patient metadata.
- `POST /api/v1/triage` remains the main missing contract.
- `GET /health` is the stack health endpoint.
- `GET /internal/health/cognee` reports semantic-memory availability only.
- Featherless integrations must treat Featherless as an OpenAI-compatible API surface.
- Cognee must remain optional and never block predictions.
- The normal local path should not require a hosted Cognee endpoint or Cognee API key.

## Infrastructure contract
- Swarm only: Docker Swarm, not Kubernetes or k3s.
- Public ingress: NGINX, not Traefik.
- Public service entrypoint: `go-api` behind NGINX.
- Internal services: `prisma-worker`, `redis`, `postgres`, `minio`.
- Scale shape: `go-api` horizontally, `prisma-worker` by replica count with one job per worker.
- Runtime packaging: `PrismaServer` is the serving worker; `PrismaTraining` remains research/training only.
- Local memory path: Cognee runs in-stack and relies on Featherless for generation.

## Fallbacks
- If the final cough + clinical model is not ready, demo the strongest honest baseline.
- If CXR is not fully integrated, keep it as a documented separate research path.
- If Featherless is unavailable, deterministic referral copy remains sufficient.
- If Cognee is unavailable, skip memory grounding and continue inference.

## Definition of done
End-to-end online flow deployed through the Swarm stack, with validated intake, a working triage path, honest metrics, explainable outputs, deterministic referral copy, and a public demo-ready deployment.
