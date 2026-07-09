from __future__ import annotations

from dataclasses import dataclass

import torch
import torch.nn.functional as F
from torch import Tensor, nn


@dataclass(frozen=True)
class ModelSpec:
    name: str
    image_size: int
    mean: tuple[float, float, float]
    std: tuple[float, float, float]


@dataclass
class ModelOutput:
    embedding: Tensor
    logits: Tensor


class BaseEmbeddingModel(nn.Module):
    def __init__(
        self,
        encoder: nn.Module,
        feature_dim: int,
        embedding_dim: int,
        dropout: float,
        normalize_embeddings: bool,
    ) -> None:
        super().__init__()
        self.encoder = encoder
        self.embedding_layer = nn.Linear(feature_dim, embedding_dim)
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(embedding_dim, 1)
        self.normalize_embeddings = normalize_embeddings

    def forward_backbone(self, images: Tensor) -> Tensor:
        raise NotImplementedError

    def freeze_backbone(self) -> None:
        for parameter in self.encoder.parameters():
            parameter.requires_grad = False

    def forward(self, images: Tensor) -> ModelOutput:
        features = self.forward_backbone(images)
        embedding = self.embedding_layer(features)
        if self.normalize_embeddings:
            embedding = F.normalize(embedding, dim=-1)
        logits = self.classifier(self.dropout(embedding))
        return ModelOutput(embedding=embedding, logits=logits)


def flatten_features(features: Tensor) -> Tensor:
    if features.ndim == 2:
        return features
    if features.ndim == 3:
        return features[:, 0, :]
    if features.ndim == 4:
        return torch.flatten(features.mean(dim=(2, 3)), start_dim=1)
    raise ValueError(f'Unsupported feature tensor shape: {tuple(features.shape)}')
