#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_PATH="${1:-configs/local_clahe.yaml}"
QUERY_INDEX="${QUERY_INDEX:-0}"

cd "${PROJECT_ROOT}"

python scripts/train.py --config "${CONFIG_PATH}"
python scripts/evaluate.py --config "${CONFIG_PATH}"
python scripts/extract_embeddings.py --config "${CONFIG_PATH}"
python scripts/build_index.py --config "${CONFIG_PATH}"
python scripts/retrieval_demo.py --config "${CONFIG_PATH}" --query-index "${QUERY_INDEX}"
