from __future__ import annotations

import timm
from torch import Tensor

from project.models.base import BaseEmbeddingModel, ModelSpec, flatten_features
from project.utils.config import ModelConfig


class DenseNet121Model(BaseEmbeddingModel):
    def __init__(self, config: ModelConfig) -> None:
        encoder = timm.create_model('densenet121', pretrained=config.pretrained, num_classes=0, global_pool='avg')
        feature_dim = int(getattr(encoder, 'num_features'))
        super().__init__(
            encoder=encoder,
            feature_dim=feature_dim,
            embedding_dim=config.embedding_dim,
            dropout=config.dropout,
            normalize_embeddings=config.normalize_embeddings,
        )

    def forward_backbone(self, images: Tensor) -> Tensor:
        features = self.encoder(images)
        return flatten_features(features)


def build_densenet121(config: ModelConfig) -> tuple[DenseNet121Model, ModelSpec]:
    model = DenseNet121Model(config)
    if config.freeze_backbone:
        model.freeze_backbone()
    spec = ModelSpec(
        name='densenet121',
        image_size=config.image_size or 224,
        mean=tuple(config.mean or [0.485, 0.456, 0.406]),
        std=tuple(config.std or [0.229, 0.224, 0.225]),
    )
    return model, spec
