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

STACK_NAME="${STACK_NAME:-jaga}"

docker swarm init >/dev/null 2>&1 || true
docker stack deploy -c "$INFRA_DIR/docker-stack.yml" "$STACK_NAME"
