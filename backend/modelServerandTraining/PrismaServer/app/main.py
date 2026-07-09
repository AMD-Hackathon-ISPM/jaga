from __future__ import annotations

import os
from datetime import datetime, UTC
from pathlib import Path

from fastapi import FastAPI


app = FastAPI(title='jaga-prisma-worker')


def get_artifact_root() -> Path:
    return Path(os.getenv('PRISMA_ARTIFACT_ROOT', '/app/artifacts')).resolve()


def get_default_bundle_dir() -> Path:
    return get_artifact_root() / 'local_clahe'


@app.get('/health')
def health() -> dict[str, object]:
    bundle_dir = get_default_bundle_dir()
    return {
        'status': 'ok',
        'service': 'prisma-worker',
        'timestamp': datetime.now(UTC).isoformat(),
        'worker_concurrency': int(os.getenv('WORKER_CONCURRENCY', '1')),
        'featherless_url': os.getenv('FEATHERLESS_URL', ''),
        'featherless_model': os.getenv('FEATHERLESS_MODEL', ''),
        'artifacts_ready': (bundle_dir / 'checkpoints' / 'best.pt').is_file(),
    }


@app.get('/api/v1/status')
def status() -> dict[str, object]:
    bundle_dir = get_default_bundle_dir()
    checkpoint_path = bundle_dir / 'checkpoints' / 'best.pt'
    config_path = bundle_dir / 'resolved_config.yaml'
    quantum_dir = bundle_dir / 'quantum'
    return {
        'service': 'prisma-worker',
        'ready': checkpoint_path.is_file() and config_path.is_file(),
        'model_path': os.getenv('MODEL_PATH', ''),
        'upload_path': os.getenv('UPLOAD_PATH', ''),
        'artifact_root': str(get_artifact_root()),
        'default_bundle': str(bundle_dir),
        'checkpoint_path': str(checkpoint_path),
        'checkpoint_exists': checkpoint_path.is_file(),
        'config_path': str(config_path),
        'config_exists': config_path.is_file(),
        'quantum_dir': str(quantum_dir),
        'quantum_exists': quantum_dir.is_dir(),
    }
