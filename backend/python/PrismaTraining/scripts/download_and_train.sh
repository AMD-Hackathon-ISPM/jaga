#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_PATH="${1:-configs/local_clahe.yaml}"
DATA_DIR="${PROJECT_ROOT}/data"
ZIP_PATH="${DATA_DIR}/tuberculosis-tb-chest-x-ray-cleaned-database.zip"
KAGGLE_URL='https://www.kaggle.com/api/v1/datasets/download/scipygaurav/tuberculosis-tb-chest-x-ray-cleaned-database'
CLAHE_DIR="${DATA_DIR}/Preprocessed Data/Preprocessed Data/CLAHE"
RUN_FULL_PIPELINE="${RUN_FULL_PIPELINE:-0}"
FORCE_DOWNLOAD="${FORCE_DOWNLOAD:-0}"

read_kaggle_credentials() {
  if [[ -n "${KAGGLE_USERNAME:-}" && -n "${KAGGLE_KEY:-}" ]]; then
    printf '%s\n%s\n' "${KAGGLE_USERNAME}" "${KAGGLE_KEY}"
    return 0
  fi

  python - <<'PY'
import json
from pathlib import Path

path = Path.home() / '.kaggle' / 'kaggle.json'
if not path.exists():
    raise SystemExit(1)
payload = json.loads(path.read_text(encoding='utf-8'))
print(payload['username'])
print(payload['key'])
PY
}

download_dataset() {
  mkdir -p "${DATA_DIR}"

  mapfile -t credentials < <(read_kaggle_credentials)
  if [[ "${#credentials[@]}" -ne 2 ]]; then
    echo 'Missing Kaggle credentials. Set KAGGLE_USERNAME and KAGGLE_KEY or place kaggle.json in ~/.kaggle/.' >&2
    exit 1
  fi

  curl -fL --user "${credentials[0]}:${credentials[1]}" -o "${ZIP_PATH}" "${KAGGLE_URL}"

  python - "${ZIP_PATH}" "${DATA_DIR}" <<'PY'
import sys
import zipfile
from pathlib import Path

zip_path = Path(sys.argv[1])
data_dir = Path(sys.argv[2])
with zipfile.ZipFile(zip_path) as archive:
    archive.extractall(data_dir)
PY
}

verify_dataset() {
  local split_root
  for split_root in \
    "${CLAHE_DIR}/Train/Normal" \
    "${CLAHE_DIR}/Train/Tuberculosis" \
    "${CLAHE_DIR}/Val/Normal" \
    "${CLAHE_DIR}/Val/Tuberculosis" \
    "${CLAHE_DIR}/Test/Normal" \
    "${CLAHE_DIR}/Test/Tuberculosis"; do
    if [[ ! -d "${split_root}" ]]; then
      echo "Expected dataset directory not found: ${split_root}" >&2
      exit 1
    fi
  done
}

main() {
  cd "${PROJECT_ROOT}"

  if [[ "${FORCE_DOWNLOAD}" == '1' || ! -d "${CLAHE_DIR}" ]]; then
    download_dataset
  fi

  verify_dataset

  python scripts/train.py --config "${CONFIG_PATH}"

  if [[ "${RUN_FULL_PIPELINE}" == '1' ]]; then
    python scripts/evaluate.py --config "${CONFIG_PATH}"
    python scripts/extract_embeddings.py --config "${CONFIG_PATH}"
    python scripts/build_index.py --config "${CONFIG_PATH}"
  fi
}

main "$@"
