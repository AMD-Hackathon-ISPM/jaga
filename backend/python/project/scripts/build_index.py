from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict
from pathlib import Path

PROJECT_PARENT = Path(__file__).resolve().parents[2]
if str(PROJECT_PARENT) not in sys.path:
    sys.path.insert(0, str(PROJECT_PARENT))

from project.retrieval.index import RetrievalIndex
from project.retrieval.retrieve import load_retrieval_assets
from project.utils.config import load_experiment_config, resolve_retrieval_paths, resolve_runtime_paths
from project.utils.logger import setup_logger


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', type=str, default='configs/default.yaml')
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    project_root = Path(__file__).resolve().parents[1]
    config = load_experiment_config(project_root / args.config)
    runtime_paths = resolve_runtime_paths(project_root, config)
    retrieval_paths = resolve_retrieval_paths(runtime_paths, config)
    logger = setup_logger(runtime_paths.logs_dir / 'build_index.log')
    assets = load_retrieval_assets(
        embeddings_path=retrieval_paths.embeddings_path,
        labels_path=retrieval_paths.labels_path,
        paths_path=retrieval_paths.paths_path,
        metadata_path=retrieval_paths.metadata_path,
        class_names=config.dataset.class_names,
    )
    index = RetrievalIndex.from_embeddings(
        embeddings=assets.embeddings,
        metric=config.retrieval.metric,
        normalize=True,
    )
    index.save(retrieval_paths.index_path)
    summary_path = retrieval_paths.output_dir / 'index_summary.json'
    summary = asdict(index.summary())
    summary['index_path'] = str(retrieval_paths.index_path)
    summary['embeddings_path'] = str(retrieval_paths.embeddings_path)
    summary['labels_path'] = str(retrieval_paths.labels_path)
    summary['paths_path'] = str(retrieval_paths.paths_path)
    summary['metadata_path'] = str(retrieval_paths.metadata_path)
    with summary_path.open('w', encoding='utf-8') as handle:
        json.dump(summary, handle, indent=2)
    logger.info('Saved FAISS index to %s', retrieval_paths.index_path)
    logger.info('Saved index summary to %s', summary_path)


if __name__ == '__main__':
    main()
