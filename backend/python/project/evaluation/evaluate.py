from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import torch
from torch import Tensor, nn
from torch.utils.data import DataLoader
from tqdm.auto import tqdm

from project.evaluation.visualize import save_confusion_matrix, save_pr_curve, save_roc_curve
from project.models.base import BaseEmbeddingModel
from project.training.metrics import compute_classification_metrics


@dataclass
class EvaluationResult:
    loss: float
    metrics: dict[str, Any]
    targets: np.ndarray
    probabilities: np.ndarray
    paths: list[str]


def evaluate_model(
    model: BaseEmbeddingModel,
    loader: DataLoader[tuple[Tensor, int, str]],
    loss_fn: nn.Module,
    device: torch.device,
    threshold: float,
) -> EvaluationResult:
    model.eval()
    loss_fn = loss_fn.to(device)
    total_loss = 0.0
    probabilities: list[np.ndarray] = []
    targets: list[np.ndarray] = []
    paths: list[str] = []
    amp_enabled = device.type == 'cuda'
    with torch.no_grad():
        for images, labels, batch_paths in tqdm(loader, leave=False):
            images = images.to(device, non_blocking=True)
            label_tensor = labels.float().unsqueeze(1).to(device)
            with torch.autocast(device_type=device.type, enabled=amp_enabled):
                outputs = model(images)
                loss = loss_fn(outputs.logits, label_tensor)
            total_loss += float(loss.item()) * images.size(0)
            probabilities.append(torch.sigmoid(outputs.logits).squeeze(1).cpu().numpy())
            targets.append(labels.numpy())
            paths.extend(batch_paths)
    target_array = np.concatenate(targets)
    probability_array = np.concatenate(probabilities)
    loss = total_loss / len(loader.dataset)
    metrics = compute_classification_metrics(target_array, probability_array, threshold)
    metrics['loss'] = loss
    return EvaluationResult(
        loss=loss,
        metrics=metrics,
        targets=target_array,
        probabilities=probability_array,
        paths=paths,
    )


def save_evaluation_artifacts(
    result: EvaluationResult,
    output_dir: Path,
    class_names: list[str],
    split: str,
    save_curves: bool,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    metrics_path = output_dir / f'{split}_metrics.json'
    predictions_path = output_dir / f'{split}_predictions.csv'
    with metrics_path.open('w', encoding='utf-8') as handle:
        json.dump(_sanitize(result.metrics), handle, indent=2)
    prediction_frame = pd.DataFrame(
        {
            'path': result.paths,
            'label': result.targets,
            'probability': result.probabilities,
        }
    )
    prediction_frame.to_csv(predictions_path, index=False)
    save_confusion_matrix(
        confusion_matrix=result.metrics['confusion_matrix'],
        class_names=class_names,
        output_path=output_dir / f'{split}_confusion_matrix.png',
    )
    if save_curves and len(np.unique(result.targets)) > 1:
        save_roc_curve(result.targets, result.probabilities, output_dir / f'{split}_roc_curve.png')
        save_pr_curve(result.targets, result.probabilities, output_dir / f'{split}_pr_curve.png')


def _sanitize(payload: Any) -> Any:
    if isinstance(payload, dict):
        return {key: _sanitize(value) for key, value in payload.items()}
    if isinstance(payload, list):
        return [_sanitize(value) for value in payload]
    if isinstance(payload, np.ndarray):
        return payload.tolist()
    if isinstance(payload, np.floating):
        return float(payload)
    if isinstance(payload, np.integer):
        return int(payload)
    return payload
