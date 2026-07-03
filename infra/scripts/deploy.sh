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
# immutability error. Uses sha1sum, falling back to shasum.
hash_file() {
  if command -v sha1sum >/dev/null 2>&1; then
    sha1sum "$1" | cut -c1-10
  else
    shasum "$1" | cut -c1-10
  fi
}
NGINX_MAIN_HASH=$(hash_file "$INFRA_DIR/nginx/nginx.conf")
NGINX_DEFAULT_HASH=$(hash_file "$INFRA_DIR/nginx/conf.d/default.conf")
POSTGRES_INIT_HASH=$(hash_file "$INFRA_DIR/postgres/init/001-base.sql")
export NGINX_MAIN_HASH NGINX_DEFAULT_HASH POSTGRES_INIT_HASH

docker swarm init >/dev/null 2>&1 || true
docker stack deploy -c "$INFRA_DIR/docker-stack.yml" "$STACK_NAME"
