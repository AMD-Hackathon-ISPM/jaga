from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROJECT_PARENT = Path(__file__).resolve().parents[2]
if str(PROJECT_PARENT) not in sys.path:
    sys.path.insert(0, str(PROJECT_PARENT))

from PrismaTraining.quantum.qsvm import QuantumPaths, QuantumSvmExperiment
from PrismaTraining.utils.config import ExperimentConfig, load_experiment_config, resolve_runtime_paths
from PrismaTraining.utils.logger import setup_logger


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', type=str, default='configs/default.yaml')
    parser.add_argument('--pca-dim', type=int, default=None)
    parser.add_argument('--max-samples', type=int, default=None)
    parser.add_argument('--test-size', type=float, default=None)
    parser.add_argument('--shots', type=int, default=None)
    parser.add_argument('--n-layers', type=int, default=None)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    project_root = Path(__file__).resolve().parents[1]
    config = load_experiment_config(project_root / args.config)
    _apply_overrides(config, args)
    runtime_paths = resolve_runtime_paths(project_root, config)
    logger = setup_logger(runtime_paths.logs_dir / 'run_quantum.log')
    embedding_dir = runtime_paths.embeddings_dir / config.embeddings.output_name
    quantum_paths = QuantumPaths(
        embeddings_path=embedding_dir / 'embeddings.npy',
        labels_path=embedding_dir / 'labels.npy',
        paths_path=embedding_dir / 'paths.npy',
        metadata_path=embedding_dir / 'metadata.csv',
        output_dir=runtime_paths.quantum_dir,
    )
    experiment = QuantumSvmExperiment(config=config.quantum, class_names=config.dataset.class_names)
    result = experiment.run(quantum_paths)
    experiment.save(result, quantum_paths.output_dir)
    logger.info('Saved quantum experiment artifacts to %s', quantum_paths.output_dir)


def _apply_overrides(config: ExperimentConfig, args: argparse.Namespace) -> None:
    if args.pca_dim is not None:
        config.quantum.pca_dim = args.pca_dim
    if args.max_samples is not None:
        config.quantum.max_samples = args.max_samples
    if args.test_size is not None:
        config.quantum.test_size = args.test_size
    if args.shots is not None:
        config.quantum.shots = args.shots
    if args.n_layers is not None:
        config.quantum.n_layers = args.n_layers


if __name__ == '__main__':
    main()
