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

# Content hashes rotate the Swarm config names when a config file changes, so
# `docker stack deploy` never hits the "only updates to Labels are allowed"
# immutability error. A missing/unreadable config file is a hard error so we
# never silently fall back to the ":-v1" default name.
hash_file() {
  if [ ! -r "$1" ]; then
    echo "deploy: config file not found or unreadable: $1" >&2
    exit 1
  fi
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | cut -c1-10
  else
    shasum -a 256 "$1" | cut -c1-10
  fi
}
NGINX_MAIN_HASH=$(hash_file "$INFRA_DIR/nginx/nginx.conf")
NGINX_DEFAULT_HASH=$(hash_file "$INFRA_DIR/nginx/conf.d/default.conf")
POSTGRES_INIT_HASH=$(hash_file "$INFRA_DIR/postgres/init/001-base.sql")
export NGINX_MAIN_HASH NGINX_DEFAULT_HASH POSTGRES_INIT_HASH

docker swarm init >/dev/null 2>&1 || true
docker stack deploy -c "$INFRA_DIR/docker-stack.yml" "$STACK_NAME"

# Swarm does not auto-remove configs orphaned by a hash rotation. Prune stale
# jaga_* configs; ones still referenced by a running service cannot be removed
# and are safely skipped.
for cfg in $(docker config ls --format '{{.Name}}' 2>/dev/null | grep '^jaga_' || true); do
  docker config rm "$cfg" >/dev/null 2>&1 || true
done
