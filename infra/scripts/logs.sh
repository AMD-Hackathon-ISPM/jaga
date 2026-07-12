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

if [ "${1:-}" != "" ]; then
  case "$1" in
    "$STACK_NAME"_*)
      service_name="$1"
      ;;
    *)
      service_name="${STACK_NAME}_$1"
      ;;
  esac
  exec docker service logs -f "$service_name"
fi

services=$(docker stack services "$STACK_NAME" --format '{{.Name}}')

if [ -z "$services" ]; then
  echo "no services found for stack $STACK_NAME" >&2
  exit 1
fi

pids=""
trap 'for pid in $pids; do kill "$pid" 2>/dev/null || true; done' INT TERM EXIT

for service_name in $services; do
  docker service logs -f "$service_name" &
  pids="$pids $!"
done

wait
