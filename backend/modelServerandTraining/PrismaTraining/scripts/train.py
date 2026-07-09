from __future__ import annotations

import argparse
import sys
from pathlib import Path

import torch

PROJECT_PARENT = Path(__file__).resolve().parents[2]
if str(PROJECT_PARENT) not in sys.path:
    sys.path.insert(0, str(PROJECT_PARENT))

from PrismaTraining.data.dataset import create_dataloaders
from PrismaTraining.data.transforms import build_eval_transform, build_train_transform
from PrismaTraining.models.registry import build_model
from PrismaTraining.training.losses import build_loss
from PrismaTraining.training.trainer import Trainer, build_optimizer, build_scheduler
from PrismaTraining.utils.config import load_experiment_config, resolve_runtime_paths, save_resolved_config
from PrismaTraining.utils.logger import setup_logger
from PrismaTraining.utils.seed import set_global_seed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', type=str, default='configs/default.yaml')
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    project_root = Path(__file__).resolve().parents[1]
    config = load_experiment_config(project_root / args.config)
    paths = resolve_runtime_paths(project_root, config)
    logger = setup_logger(paths.logs_dir / 'train.log')
    save_resolved_config(config, paths.run_dir / 'resolved_config.yaml')
    set_global_seed(config.seed, deterministic=config.deterministic)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model, model_spec = build_model(config.model)
    train_transform = build_train_transform(model_spec, config.augmentation)
    eval_transform = build_eval_transform(model_spec)
    datasets, loaders = create_dataloaders(config, train_transform, eval_transform)
    loss_fn = build_loss(config.loss, datasets['train'].targets)
    model = model.to(device)
    optimizer = build_optimizer(config, model)
    scheduler = build_scheduler(config, optimizer)
    logger.info('Using device: %s', device)
    logger.info('Training with backbone: %s', config.model.name)
    trainer = Trainer(
        model=model,
        config=config,
        paths=paths,
        train_loader=loaders['train'],
        val_loader=loaders['val'],
        loss_fn=loss_fn,
        optimizer=optimizer,
        scheduler=scheduler,
        device=device,
        logger=logger,
    )
    trainer.fit()


if __name__ == '__main__':
    main()
