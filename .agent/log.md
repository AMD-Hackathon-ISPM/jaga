# Jaga · Change & Decision Log

Chronological record of decisions and significant changes. Newest at top.

- 2026-06-29 - Removed Ollama from the semantic-memory path and kept Cognee local while using Featherless for generation. (Codex)
- 2026-06-29 - Synced `.agent` to the current runtime layout: `PrismaTraining` for research, `PrismaServer` for serving, stack-first Swarm deployment, bundled `local_clahe` server artifacts, and optional Cognee semantic memory in the Go backend. (Codex)
- 2026-06-28 - Added `/infra` as a Docker Swarm deployment plane with NGINX ingress, replicated `go-api`, internal `prisma-worker`, Redis, PostgreSQL, and MinIO; recorded Featherless as an OpenAI-compatible integration target. (Codex)
- 2026-06-28 - Added a Go-only patient intake module at `POST /api/v1/patient/intake` to validate and normalize metadata before any future Prisma cough or CXR inference; no persistence or ML calls yet. (Codex)
- 2026-06-28 - Added an independent, embedding-first TB-CXR research scaffold under `backend/python/PrismaTraining` with interchangeable backbones, training/eval pipelines, embedding export, retrieval over saved embeddings, and a post-training quantum branch; added a thin `backend/go` service scaffold; documented it as a stretch CXR track that does not alter the cough+clinical MVP invariant. (Codex)
- 2026-06-27 - Documentation and evidence overhaul. Added `evidence-register.md`, `data-evaluation-plan.md`, and `implementation-plan.md`. Upgraded `AGENT.md` into a task router with source precedence and kept `CLAUDE.md`. Verified CODA access, WHO 2025 screening TPPs, and the event window. (Billy)
- 2026-06-27 - Honest revision after technical review: online serving on AMD, cough+clinical as the validated core, CXR as optional/stretch, and honest metrics with WHO targets treated as aspiration rather than promise. (Billy)
- 2026-06-27 - Reframed positioning global-first with Indonesia as the beachhead. (Billy)
- 2026-06-27 - Added governance layer, status headers, the change log, and the maintenance ritual in `CLAUDE.md`. (Billy)
- 2026-06-27 - Added README and AGENT entry point; removed stale `plan-medical.md`. (Billy)
- 2026-06-27 - Split the project plan into `product-brief.md`, `product-requirements.md`, `project-architecture.md`, and `design-guidelines.md`. (Billy)
- 2026-06-27 - Added Fransisco to the team. (Billy)
- 2026-06-27 - Validated business model and comparable market context. (Billy)
- 2026-06-27 - Locked name: Jaga. (Billy)
- 2026-06-27 - Locked the original TB-triage direction, later refined by the honest revision above. (Billy)
