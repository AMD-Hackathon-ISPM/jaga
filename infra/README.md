# JAGA Swarm Infrastructure

This directory contains the Docker Swarm deployment layout for JAGA.

## Topology

- `nginx` is the public entrypoint
- `go-api` handles auth, intake, uploads, orchestration, and future Featherless/OpenAI-compatible calls
- `prisma-worker` handles internal inference workloads only
- `cognee` provides local semantic memory
- `redis` backs the inference queue and background jobs
- `postgres` stores operational data
- `minio` stores object data

All services communicate over the `jaga-network` overlay network using service names.

## Files

- `docker-stack.yml` defines the Swarm stack
- `.env.example` contains the required environment variables
- `nginx/` contains the reverse proxy config
- `postgres/init/` contains database initialization SQL
- `scripts/` contains operator commands
- `healthcheck/` contains manual health probe helpers

## Prerequisites

- Docker Engine with Swarm enabled
- Linux nodes for the stack
- Built and pushed images for:
  - `GO_API_IMAGE`
  - `PRISMA_WORKER_IMAGE`
- A worker image that exposes `GET /health` on `PRISMA_WORKER_PORT`
- Application images should include `wget` or an equivalent HTTP probe utility for the in-container health checks
- If GPU inference is enabled, a Swarm node with NVIDIA drivers and the NVIDIA container runtime stack installed
- Enough local disk for Cognee local state and Fastembed model cache on first use

## Environment

Create a real `.env` beside `docker-stack.yml` from `.env.example`.

Important values:

- `GO_API_IMAGE` must point to the published Go backend image
- `PRISMA_WORKER_IMAGE` must point to the published Prisma worker image
- `FEATHERLESS_URL` should use the Featherless OpenAI-compatible endpoint base
- `MODEL_PATH` is mounted into the worker through the `model_cache` volume
- `COGNEE_ENABLED=true` uses the local in-stack Cognee service by default
- `COGNEE_LLM_*` default to Featherless for generation
- `COGNEE_EMBEDDING_*` default to local Fastembed embeddings, so no Cognee API key or external Cognee base URL is required

## Build

For a single-node Swarm or local validation flow, build the images first:

```bash
cd infra
cp .env.example .env
./scripts/build.sh
```

PowerShell equivalent:

```powershell
Set-Location infra
Copy-Item .env.example .env
.\scripts\build.ps1
```

The default `.env.example` tags everything as local images:

- `jaga/go-api:local`
- `jaga/prisma-worker:local`
- `jaga/nginx:local`
- `jaga/postgres:local`
- `jaga/redis:local`
- `jaga/minio:local`
- `jaga/cognee:local`

For a multi-node Swarm, replace those tags with registry-backed image references and push them before deploy.

## Deploy

```bash
cd infra
cp .env.example .env
./scripts/build.sh
./scripts/deploy.sh
```

PowerShell equivalent:

```powershell
Set-Location infra
Copy-Item .env.example .env
.\scripts\build.ps1
.\scripts\deploy.ps1
```

## Remove

```bash
./scripts/remove.sh
```

PowerShell equivalent:

```powershell
.\scripts\remove.ps1
```

## Logs

Tail all stack services:

```bash
./scripts/logs.sh
```

Tail one service:

```bash
./scripts/logs.sh go-api
./scripts/logs.sh prisma-worker
./scripts/logs.sh cognee
```

PowerShell equivalent:

```powershell
.\scripts\logs.ps1
.\scripts\logs.ps1 go-api
```

## Scale

Scale the API:

```bash
./scripts/scale-api.sh 4
```

PowerShell equivalent:

```powershell
.\scripts\scale-api.ps1 4
```

Scale the worker:

```bash
./scripts/scale-worker.sh 2
```

PowerShell equivalent:

```powershell
.\scripts\scale-worker.ps1 2
```

The worker is configured for one job at a time through `WORKER_CONCURRENCY=1`. Horizontal scaling is done by increasing replicas instead of concurrency inside a single worker.

## Routing

- `/api/*` proxies to `go-api`
- `/health` proxies to `go-api`
- `/storage/*` is already reserved for MinIO-backed storage routing

## Health

Built-in service health checks:

- `nginx`: `GET /nginx-health`
- `go-api`: `GET /health`
- `cognee`: `GET /health`
- `prisma-worker`: `GET /health`
- `redis`: `PING`
- `postgres`: `pg_isready`
- `minio`: `/minio/health/ready`

Manual probes:

```bash
./healthcheck/api.sh
./healthcheck/cognee.sh
./healthcheck/prisma.sh http://127.0.0.1:8000/health
```

## Notes

- Docker Stack does not build images during deploy. Build and push the application images before running `deploy.sh`.
- `scripts/build.sh` is intended for local or single-node Swarm use. Multi-node Swarm deployments should push images to a registry and update `.env`.
- The local Cognee image installs `fastembed`, so rerun the build script after Cognee-related stack changes before redeploying.
- The MinIO service creates the configured top-level bucket directories on startup using `MINIO_BUCKET_UPLOADS` and `MINIO_BUCKET_MODELS`.
- Cognee now runs locally inside the stack, and the Go backend defaults to `http://cognee:8000` internally. You do not need to set `COGNEE_API_KEY` or `COGNEE_BASE_URL` for the normal local path.
- Cognee generation uses Featherless, while embeddings default to local Fastembed inside the Cognee container.
- TLS is intentionally not enabled yet. The NGINX layout is ready for future certificate and port 443 additions.
