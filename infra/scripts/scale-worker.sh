#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
INFRA_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
ENV_FILE="${ENV_FILE:-$INFRA_DIR/.env}"

if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

if [ "${1:-}" = "" ]; then
  echo "usage: $0 <replicas>" >&2
  exit 1
fi

STACK_NAME="${STACK_NAME:-jaga}"
docker service scale "${STACK_NAME}_prisma-worker=$1"
