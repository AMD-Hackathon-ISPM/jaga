#!/usr/bin/env sh
set -eu

BASE_URL="${1:-http://127.0.0.1:8000}"

curl -fsS "$BASE_URL/health" >/dev/null
printf 'cognee healthy: %s\n' "$BASE_URL"
