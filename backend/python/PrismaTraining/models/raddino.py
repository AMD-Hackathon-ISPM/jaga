from __future__ import annotations

from torch import Tensor
from transformers import AutoConfig, AutoImageProcessor, AutoModel

from PrismaTraining.models.base import BaseEmbeddingModel, ModelSpec
from PrismaTraining.utils.config import ModelConfig


DEFAULT_MODEL_ID = 'microsoft/rad-dino'


class RadDinoModel(BaseEmbeddingModel):
    def __init__(self, config: ModelConfig) -> None:
        model_id = config.model_id or DEFAULT_MODEL_ID
        if config.pretrained:
            encoder = AutoModel.from_pretrained(model_id)
        else:
            encoder_config = AutoConfig.from_pretrained(model_id)
            encoder = AutoModel.from_config(encoder_config)
        feature_dim = int(getattr(encoder.config, 'hidden_size'))
        super().__init__(
            encoder=encoder,
            feature_dim=feature_dim,
            embedding_dim=config.embedding_dim,
            dropout=config.dropout,
            normalize_embeddings=config.normalize_embeddings,
        )

    def forward_backbone(self, images: Tensor) -> Tensor:
        outputs = self.encoder(pixel_values=images)
        if getattr(outputs, 'pooler_output', None) is not None:
            return outputs.pooler_output
        if getattr(outputs, 'last_hidden_state', None) is not None:
            return outputs.last_hidden_state[:, 0, :]
        raise ValueError('RAD-DINO did not return pooler_output or last_hidden_state.')


def build_raddino(config: ModelConfig) -> tuple[RadDinoModel, ModelSpec]:
    model_id = config.model_id or DEFAULT_MODEL_ID
    processor = AutoImageProcessor.from_pretrained(model_id)
    image_size = config.image_size
    if image_size is None:
        image_size = int(processor.size.get('shortest_edge') or processor.size.get('height') or 518)
    mean = tuple(config.mean or list(processor.image_mean))
    std = tuple(config.std or list(processor.image_std))
    model = RadDinoModel(config)
    if config.freeze_backbone:
        model.freeze_backbone()
    spec = ModelSpec(
        name='raddino',
        image_size=image_size,
        mean=mean,
        std=std,
    )
    return model, spec
