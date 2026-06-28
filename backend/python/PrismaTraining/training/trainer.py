from __future__ import annotations

import json
import math
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import numpy as np
import torch
from torch import Tensor, nn
from torch.nn.utils import clip_grad_norm_
from torch.optim import AdamW, Optimizer, SGD
from torch.optim.lr_scheduler import CosineAnnealingLR, LRScheduler
from torch.utils.data import DataLoader
from torch.utils.tensorboard import SummaryWriter
from tqdm.auto import tqdm

from PrismaTraining.models.base import BaseEmbeddingModel
from PrismaTraining.training.metrics import compute_classification_metrics
from PrismaTraining.utils.checkpoint import load_checkpoint, save_checkpoint
from PrismaTraining.utils.config import ExperimentConfig, RuntimePaths

try:
    import wandb
except ImportError:
    wandb = None


@dataclass
class EpochResult:
    loss: float
    metrics: dict[str, Any]
    probabilities: np.ndarray
    targets: np.ndarray
    paths: list[str]


def build_optimizer(config: ExperimentConfig, model: nn.Module) -> Optimizer:
    parameters = [parameter for parameter in model.parameters() if parameter.requires_grad]
    name = config.optimizer.name.lower()
    if name == 'adamw':
        return AdamW(parameters, lr=config.optimizer.lr, weight_decay=config.optimizer.weight_decay)
    if name == 'sgd':
        return SGD(parameters, lr=config.optimizer.lr, weight_decay=config.optimizer.weight_decay, momentum=0.9)
    raise KeyError(f'Unsupported optimizer: {config.optimizer.name}')


def build_scheduler(config: ExperimentConfig, optimizer: Optimizer) -> LRScheduler | None:
    name = config.scheduler.name.lower()
    if name == 'none':
        return None
    if name == 'cosine':
        return CosineAnnealingLR(optimizer, T_max=config.training.epochs, eta_min=config.scheduler.min_lr)
    raise KeyError(f'Unsupported scheduler: {config.scheduler.name}')


class Trainer:
    def __init__(
        self,
        model: BaseEmbeddingModel,
        config: ExperimentConfig,
        paths: RuntimePaths,
        train_loader: DataLoader[tuple[Tensor, int, str]],
        val_loader: DataLoader[tuple[Tensor, int, str]],
        loss_fn: nn.Module,
        optimizer: Optimizer,
        scheduler: LRScheduler | None,
        device: torch.device,
        logger: Any,
    ) -> None:
        self.model = model
        self.config = config
        self.paths = paths
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.loss_fn = loss_fn.to(device)
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.device = device
        self.logger = logger
        self.amp_enabled = config.training.amp and device.type == 'cuda'
        self.scaler = torch.cuda.amp.GradScaler(enabled=self.amp_enabled)
        self.writer = SummaryWriter(paths.tensorboard_dir) if config.logging.use_tensorboard else None
        self.wandb_run = self._init_wandb()

    def fit(self) -> dict[str, list[dict[str, Any]]]:
        history: dict[str, list[dict[str, Any]]] = {'train': [], 'val': []}
        start_epoch = 0
        best_score = -math.inf if self.config.training.monitor_mode == 'max' else math.inf
        if self.config.checkpoint.resume_path:
            resume_path = Path(self.config.checkpoint.resume_path)
            start_epoch, best_score = load_checkpoint(
                path=resume_path,
                model=self.model,
                optimizer=self.optimizer,
                scheduler=self.scheduler,
                scaler=self.scaler,
                map_location=self.device,
            )
            self.logger.info('Resumed training from %s', resume_path)
        patience = 0
        for epoch in range(start_epoch, self.config.training.epochs):
            self.logger.info('Epoch %s/%s', epoch + 1, self.config.training.epochs)
            train_result = self._run_epoch(self.train_loader, training=True)
            val_result = self._run_epoch(self.val_loader, training=False)
            history['train'].append({'epoch': epoch, 'loss': train_result.loss, **train_result.metrics})
            history['val'].append({'epoch': epoch, 'loss': val_result.loss, **val_result.metrics})
            self._log_epoch(epoch, train_result, val_result)
            if self.scheduler is not None:
                self.scheduler.step()
            current_score = self._select_monitor(val_result)
            improved = self._is_improved(current_score, best_score)
            score_to_save = current_score if improved else best_score
            save_checkpoint(
                path=self.paths.checkpoint_dir / 'last.pt',
                model=self.model,
                optimizer=self.optimizer,
                scheduler=self.scheduler,
                scaler=self.scaler,
                epoch=epoch,
                best_score=score_to_save,
                config=self.config,
            )
            if improved:
                best_score = current_score
                patience = 0
                save_checkpoint(
                    path=self.paths.checkpoint_dir / 'best.pt',
                    model=self.model,
                    optimizer=self.optimizer,
                    scheduler=self.scheduler,
                    scaler=self.scaler,
                    epoch=epoch,
                    best_score=best_score,
                    config=self.config,
                )
            else:
                patience += 1
            if patience >= self.config.training.early_stopping_patience:
                self.logger.info('Early stopping triggered after epoch %s', epoch + 1)
                break
        self._write_history(history)
        self._close()
        return history

    def _run_epoch(
        self,
        loader: DataLoader[tuple[Tensor, int, str]],
        training: bool,
    ) -> EpochResult:
        self.model.train(training)
        total_loss = 0.0
        probabilities: list[np.ndarray] = []
        targets: list[np.ndarray] = []
        paths: list[str] = []
        progress = tqdm(loader, leave=False)
        for images, labels, batch_paths in progress:
            images = images.to(self.device, non_blocking=True)
            label_tensor = labels.float().unsqueeze(1).to(self.device)
            with torch.set_grad_enabled(training):
                with torch.autocast(device_type=self.device.type, enabled=self.amp_enabled):
                    outputs = self.model(images)
                    loss = self.loss_fn(outputs.logits, label_tensor)
                if training:
                    self.optimizer.zero_grad(set_to_none=True)
                    self.scaler.scale(loss).backward()
                    if self.config.training.grad_clip_norm is not None:
                        self.scaler.unscale_(self.optimizer)
                        clip_grad_norm_(self.model.parameters(), self.config.training.grad_clip_norm)
                    self.scaler.step(self.optimizer)
                    self.scaler.update()
            total_loss += float(loss.item()) * images.size(0)
            batch_probabilities = torch.sigmoid(outputs.logits.detach()).squeeze(1).cpu().numpy()
            probabilities.append(batch_probabilities)
            targets.append(labels.numpy())
            paths.extend(batch_paths)
            progress.set_description('train' if training else 'eval')
        target_array = np.concatenate(targets)
        probability_array = np.concatenate(probabilities)
        average_loss = total_loss / len(loader.dataset)
        metrics = compute_classification_metrics(
            targets=target_array,
            probabilities=probability_array,
            threshold=self.config.training.threshold,
        )
        metrics['loss'] = average_loss
        return EpochResult(
            loss=average_loss,
            metrics=metrics,
            probabilities=probability_array,
            targets=target_array,
            paths=paths,
        )

    def _select_monitor(self, result: EpochResult) -> float:
        if self.config.training.monitor == 'loss':
            return result.loss
        if self.config.training.monitor not in result.metrics:
            raise KeyError(f'Monitor metric {self.config.training.monitor} is unavailable.')
        return float(result.metrics[self.config.training.monitor])

    def _is_improved(self, current_score: float, best_score: float) -> bool:
        if self.config.training.monitor_mode == 'min':
            return current_score < best_score
        return current_score > best_score

    def _log_epoch(self, epoch: int, train_result: EpochResult, val_result: EpochResult) -> None:
        train_payload = {'loss': train_result.loss, **train_result.metrics}
        val_payload = {'loss': val_result.loss, **val_result.metrics}
        self.logger.info('Train metrics: %s', json.dumps(_sanitize_metrics(train_payload)))
        self.logger.info('Val metrics: %s', json.dumps(_sanitize_metrics(val_payload)))
        for split, payload in (('train', train_payload), ('val', val_payload)):
            if self.writer is not None:
                for name, value in payload.items():
                    if isinstance(value, (float, int)):
                        self.writer.add_scalar(f'{split}/{name}', value, epoch)
            if self.wandb_run is not None:
                wandb.log({f'{split}/{key}': value for key, value in payload.items() if isinstance(value, (float, int))}, step=epoch)

    def _write_history(self, history: dict[str, list[dict[str, Any]]]) -> None:
        history_path = self.paths.metrics_dir / 'history.json'
        with history_path.open('w', encoding='utf-8') as handle:
            json.dump(_sanitize_metrics(history), handle, indent=2)

    def _init_wandb(self) -> Any:
        if not self.config.logging.use_wandb:
            return None
        if wandb is None:
            raise ImportError('wandb is enabled in config but not installed.')
        return wandb.init(
            project=self.config.logging.wandb_project,
            name=self.config.output.run_name,
            config=_sanitize_metrics(asdict(self.config)),
        )

    def _close(self) -> None:
        if self.writer is not None:
            self.writer.flush()
            self.writer.close()
        if self.wandb_run is not None:
            self.wandb_run.finish()


def _sanitize_metrics(payload: Any) -> Any:
    if isinstance(payload, dict):
        return {key: _sanitize_metrics(value) for key, value in payload.items()}
    if isinstance(payload, list):
        return [_sanitize_metrics(value) for value in payload]
    if isinstance(payload, np.ndarray):
        return payload.tolist()
    if isinstance(payload, np.floating):
        return float(payload)
    if isinstance(payload, np.integer):
        return int(payload)
    return payload
