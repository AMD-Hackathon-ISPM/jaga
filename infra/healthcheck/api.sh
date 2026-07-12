#!/usr/bin/env sh
set -eu

url="${1:-${JAGA_API_HEALTH_URL:-http://127.0.0.1/health}}"

if command -v curl >/dev/null 2>&1; then
  exec curl --fail --silent --show-error "$url"
fi

exec wget -qO- "$url"
