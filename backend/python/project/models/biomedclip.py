from __future__ import annotations

import open_clip
from torch import Tensor

from project.models.base import BaseEmbeddingModel, ModelSpec
from project.utils.config import ModelConfig


DEFAULT_MODEL_ID = 'hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224'


class BiomedClipModel(BaseEmbeddingModel):
    def __init__(self, config: ModelConfig) -> None:
        if not config.pretrained:
            raise ValueError('BiomedCLIP requires pretrained weights in this scaffold.')
        model_id = config.model_id or DEFAULT_MODEL_ID
        encoder, _ = open_clip.create_model_from_pretrained(model_id)
        feature_dim = int(getattr(encoder.visual, 'output_dim'))
        super().__init__(
            encoder=encoder,
            feature_dim=feature_dim,
            embedding_dim=config.embedding_dim,
            dropout=config.dropout,
            normalize_embeddings=config.normalize_embeddings,
        )
        if hasattr(self.encoder, 'text'):
            for parameter in self.encoder.text.parameters():
                parameter.requires_grad = False

    def forward_backbone(self, images: Tensor) -> Tensor:
        try:
            return self.encoder.encode_image(images, normalize=False)
        except TypeError:
            return self.encoder.encode_image(images)


def build_biomedclip(config: ModelConfig) -> tuple[BiomedClipModel, ModelSpec]:
    model = BiomedClipModel(config)
    if config.freeze_backbone:
        model.freeze_backbone()
    spec = ModelSpec(
        name='biomedclip',
        image_size=config.image_size or 224,
        mean=tuple(config.mean or [0.48145466, 0.4578275, 0.40821073]),
        std=tuple(config.std or [0.26862954, 0.26130258, 0.27577711]),
    )
    return model, spec
