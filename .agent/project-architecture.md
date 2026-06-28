# Jaga · Project Architecture

**Updated:** 2026-06-29

> System architecture, data, models, pipeline, and build ownership.
> Companions: `product-brief.md` · `product-requirements.md` · `design-guidelines.md` · `data-evaluation-plan.md` · `evidence-register.md` · `implementation-plan.md` · `context-dump.md`.

---

## Design philosophy
- **Cloud-served, online.** Inference runs in the cloud on AMD; the phone/browser is a thin client.
- **AMD is load-bearing through training.** We train and fine-tune on MI300X via ROCm/PyTorch and serve the resulting system online.
- **Privacy posture is honest.** Patient inputs are transmitted for transient inference; we do not claim fully local processing.
- **Cough + clinical is the core.** Chest X-ray remains an independent optional module and is never presented as a fused validated score without paired data.
- **Operational layers are separated.** PostgreSQL is the system of record, Redis handles queues/cache, MinIO stores binary objects, and Cognee is optional semantic memory only.

## Architecture layers
1. **Capture** - phone mic for guided coughs plus a short structured form. Optional digital chest X-ray remains a stretch path.
2. **Backend intake** - Go REST API validates and normalizes patient metadata before Prisma receives chest X-ray or cough payloads. The same API layer hosts health endpoints and optional semantic-memory integration. Intake itself does not persist patient records.
3. **Preprocess** - cough to mel-spectrogram and compact audio features; structured inputs normalized.
4. **AI inference on AMD** - cough + clinical model produces a calibrated TB-risk probability. The optional CXR track is a separate model path.
5. **Explain / compose** - spectrograms, attention overlays, calibrated probability, thresholded triage band, deterministic bilingual referral copy, and optional LLM explanation through Featherless.
6. **Semantic memory** - after structured evidence exists, Cognee can store semantic summaries only: prior predictions, retrieval summaries, quantum summaries, clinical summaries, recommendations, and lightweight metadata. In the default stack, Cognee stays self-hosted while Featherless handles generation. If unavailable, inference must continue.
7. **Presentation** - Next.js/PWA capture flow and result dashboard.

## Runtime split
- `backend/python/PrismaTraining` is the research and training tree.
- `backend/python/PrismaServer` is the serving worker.
- `backend/python/PrismaServer/artifacts/local_clahe` holds the current default serving bundle for local and single-node runs.
- `backend/go` is the API and orchestration layer.
- `infra` is the Docker Swarm deployment plane.

## Tech stack
Next.js / PWA · Go REST API · Prisma Python worker (`PrismaServer`) · TB-CXR research package (`PrismaTraining`) · PyTorch on ROCm (MI300X) · Featherless via an OpenAI-compatible API surface · Cognee semantic memory · PostgreSQL · Redis · MinIO · NGINX · Docker Swarm.

## Datasets
- CODA TB cough with paired clinical data is the cough + clinical core.
- Kaggle TB CXR plus Shenzhen / Montgomery remain the optional CXR research path.
- `PrismaTraining` is embedding-first so retrieval, similarity search, and later extensions do not force changes to the classical training pipeline contract.

## CXR research track
- Interchangeable backbones are implemented under `PrismaTraining`.
- Saved embeddings support retrieval over FAISS indices built from exported artifacts.
- A post-training quantum branch compares classical PCA + RBF SVM against PCA + Quantum Kernel SVM on saved embeddings only.
- The runtime serving tree is intentionally separate from this research tree.

## Deployment
Online deployment targets Docker Swarm with NGINX as the reverse proxy, replicated `go-api` tasks, and an internal `prisma-worker` tier backed by Redis, PostgreSQL, and MinIO. The normal local run path is stack-first: build images, deploy the stack, and operate through the Swarm scripts under `infra/scripts/`.

## Memory architecture
- PostgreSQL remains the source of truth.
- Cognee is not mandatory.
- Cognee stores semantic summaries only, never raw images, audio, embeddings, FAISS indices, or checkpoints.
- The default deployment keeps Cognee local and uses Featherless instead of a second local LLM service.
- The Go backend depends on a neutral memory interface, not on Cognee APIs directly.

## Technical risks and mitigations
- **Accuracy honesty** - report real metrics and limitations; do not claim unsupported fusion results.
- **Runtime complexity** - keep serving and research split cleanly between `PrismaServer` and `PrismaTraining`.
- **Operational fragility** - Swarm is simpler than Kubernetes for the MVP while still supporting rolling updates and horizontal scaling.
- **Memory availability** - Cognee is optional and must degrade gracefully.
- **Scope** - MVP remains the cough + clinical triage flow with explainability and deployment; CXR, retrieval, quantum, and memory are supporting extensions, not core proof points.

## Open items
- Confirm final cough + clinical backbone for the demo path.
- Define the production `POST /api/v1/triage` contract.
- Wire the completed inference output into the memory layer without blocking predictions.
- Confirm the exact submission deployment environment and public URL.
