from __future__ import annotations

from typing import Sequence

import torch
import torch.nn.functional as F
from torch import Tensor, nn

from project.utils.config import LossConfig


class BinaryFocalLoss(nn.Module):
    def __init__(self, alpha: float = 0.25, gamma: float = 2.0) -> None:
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma

    def forward(self, logits: Tensor, targets: Tensor) -> Tensor:
        targets = targets.float()
        bce = F.binary_cross_entropy_with_logits(logits, targets, reduction='none')
        probabilities = torch.sigmoid(logits)
        pt = torch.where(targets == 1, probabilities, 1 - probabilities)
        alpha_factor = torch.where(targets == 1, self.alpha, 1 - self.alpha)
        loss = alpha_factor * torch.pow(1 - pt, self.gamma) * bce
        return loss.mean()


def build_loss(config: LossConfig, labels: Sequence[int]) -> nn.Module:
    loss_name = config.name.lower()
    if loss_name == 'weighted_bce':
        pos_weight = _resolve_pos_weight(config, labels)
        weight_tensor = torch.tensor([pos_weight], dtype=torch.float32)
        return nn.BCEWithLogitsLoss(pos_weight=weight_tensor)
    if loss_name == 'focal':
        return BinaryFocalLoss(alpha=config.focal_alpha, gamma=config.focal_gamma)
    raise KeyError(f'Unsupported loss: {config.name}')


def _resolve_pos_weight(config: LossConfig, labels: Sequence[int]) -> float:
    if config.pos_weight is not None:
        return float(config.pos_weight)
    if not config.auto_pos_weight:
        return 1.0
    positives = sum(1 for label in labels if int(label) == 1)
    negatives = sum(1 for label in labels if int(label) == 0)
    if positives == 0 or negatives == 0:
        return 1.0
    return float(negatives / positives)
