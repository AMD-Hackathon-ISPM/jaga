#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
INFRA_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
REPO_ROOT=$(CDPATH= cd -- "$INFRA_DIR/.." && pwd)
ENV_FILE="${ENV_FILE:-$INFRA_DIR/.env}"

if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

GO_API_IMAGE="${GO_API_IMAGE:-jaga/go-api:local}"
PRISMA_WORKER_IMAGE="${PRISMA_WORKER_IMAGE:-jaga/prisma-worker:local}"
NGINX_IMAGE="${NGINX_IMAGE:-jaga/nginx:local}"
POSTGRES_IMAGE="${POSTGRES_IMAGE:-jaga/postgres:local}"
REDIS_IMAGE="${REDIS_IMAGE:-jaga/redis:local}"
MINIO_IMAGE="${MINIO_IMAGE:-jaga/minio:local}"

docker build -t "$GO_API_IMAGE" "$REPO_ROOT/backend/go"
docker build -t "$PRISMA_WORKER_IMAGE" "$REPO_ROOT/backend/python/PrismaServer"
docker build -t "$NGINX_IMAGE" "$INFRA_DIR/nginx"
docker build -t "$POSTGRES_IMAGE" "$INFRA_DIR/postgres"
docker build -t "$REDIS_IMAGE" "$INFRA_DIR/redis"
docker build -t "$MINIO_IMAGE" "$INFRA_DIR/minio"
