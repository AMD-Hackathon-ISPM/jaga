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
WEB_IMAGE="${WEB_IMAGE:-jaga/web:local}"
NGINX_IMAGE="${NGINX_IMAGE:-jaga/nginx:local}"
POSTGRES_IMAGE="${POSTGRES_IMAGE:-jaga/postgres:local}"
REDIS_IMAGE="${REDIS_IMAGE:-jaga/redis:local}"
MINIO_IMAGE="${MINIO_IMAGE:-jaga/minio:local}"
COGNEE_IMAGE="${COGNEE_IMAGE:-jaga/cognee:local}"

docker build -t "$GO_API_IMAGE" "$REPO_ROOT/backend/go"
docker build -t "$PRISMA_WORKER_IMAGE" "$REPO_ROOT/backend/python/PrismaServer"
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-}" \
  --build-arg NEXT_PUBLIC_APP_ENV="${NEXT_PUBLIC_APP_ENV:-production}" \
  --build-arg NEXT_PUBLIC_ENABLE_ASSISTANT="${NEXT_PUBLIC_ENABLE_ASSISTANT:-true}" \
  --build-arg NEXT_PUBLIC_ENABLE_PRISMA="${NEXT_PUBLIC_ENABLE_PRISMA:-true}" \
  -t "$WEB_IMAGE" \
  "$REPO_ROOT/frontend"
docker build -t "$NGINX_IMAGE" "$INFRA_DIR/nginx"
docker build -t "$POSTGRES_IMAGE" "$INFRA_DIR/postgres"
docker build -t "$REDIS_IMAGE" "$INFRA_DIR/redis"
docker build -t "$MINIO_IMAGE" "$INFRA_DIR/minio"
docker build -t "$COGNEE_IMAGE" "$INFRA_DIR/cognee"
