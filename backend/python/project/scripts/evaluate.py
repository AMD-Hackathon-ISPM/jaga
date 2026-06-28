from __future__ import annotations

import argparse
import sys
from pathlib import Path

import torch

PROJECT_PARENT = Path(__file__).resolve().parents[2]
if str(PROJECT_PARENT) not in sys.path:
    sys.path.insert(0, str(PROJECT_PARENT))

from project.data.dataset import create_dataloaders
from project.data.transforms import build_eval_transform, build_train_transform
from project.evaluation.evaluate import evaluate_model, save_evaluation_artifacts
from project.models.registry import build_model
from project.training.losses import build_loss
from project.utils.checkpoint import load_checkpoint
from project.utils.config import load_experiment_config, resolve_runtime_paths
from project.utils.logger import setup_logger


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', type=str, default='configs/default.yaml')
    parser.add_argument('--checkpoint', type=str, default=None)
    parser.add_argument('--split', type=str, default=None)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    project_root = Path(__file__).resolve().parents[1]
    config = load_experiment_config(project_root / args.config)
    if args.split:
        config.evaluation.split = args.split
    paths = resolve_runtime_paths(project_root, config)
    logger = setup_logger(paths.logs_dir / 'evaluate.log')
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model, model_spec = build_model(config.model)
    train_transform = build_train_transform(model_spec, config.augmentation)
    eval_transform = build_eval_transform(model_spec)
    datasets, loaders = create_dataloaders(config, train_transform, eval_transform)
    checkpoint_path = Path(args.checkpoint) if args.checkpoint else paths.checkpoint_dir / 'best.pt'
    loss_fn = build_loss(config.loss, datasets['train'].targets)
    load_checkpoint(checkpoint_path, model=model, map_location=device)
    model = model.to(device)
    result = evaluate_model(
        model=model,
        loader=loaders[config.evaluation.split],
        loss_fn=loss_fn,
        device=device,
        threshold=config.training.threshold,
    )
    save_evaluation_artifacts(
        result=result,
        output_dir=paths.metrics_dir,
        class_names=config.dataset.class_names,
        split=config.evaluation.split,
        save_curves=config.evaluation.save_curves,
    )
    logger.info('Saved evaluation artifacts to %s', paths.metrics_dir)


if __name__ == '__main__':
    main()
