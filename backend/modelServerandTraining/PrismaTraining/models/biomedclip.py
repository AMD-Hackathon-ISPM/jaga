from __future__ import annotations

from collections.abc import Sequence

import open_clip
import torch
from torch import Tensor, nn

from PrismaTraining.models.base import BaseEmbeddingModel, ModelSpec
from PrismaTraining.utils.config import ModelConfig


DEFAULT_MODEL_ID = 'hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224'


def _resolve_image_size(size: int | Sequence[int] | None) -> int:
    if size is None:
        return 224
    if isinstance(size, Sequence) and not isinstance(size, str):
        if not size:
            return 224
        return int(size[-1])
    return int(size)


def _infer_feature_dim(encoder: nn.Module, image_size: int) -> int:
    was_training = encoder.training
    encoder.eval()
    try:
        with torch.inference_mode():
            images = torch.zeros(1, 3, image_size, image_size)
            try:
                features = encoder.encode_image(images, normalize=False)
            except TypeError:
                features = encoder.encode_image(images)
        if features.ndim < 2:
            raise ValueError(f'Unexpected BiomedCLIP feature shape: {tuple(features.shape)}')
        return int(features.shape[-1])
    finally:
        encoder.train(was_training)


def _resolve_feature_dim(encoder: nn.Module, image_size: int) -> int:
    visual = getattr(encoder, 'visual', None)
    output_dim = getattr(visual, 'output_dim', None)
    if output_dim is not None:
        return int(output_dim)
    text_projection = getattr(encoder, 'text_projection', None)
    if isinstance(text_projection, nn.Linear):
        return int(text_projection.out_features)
    if hasattr(text_projection, 'shape'):
        return int(text_projection.shape[-1])
    return _infer_feature_dim(encoder, image_size)


class BiomedClipModel(BaseEmbeddingModel):
    def __init__(self, config: ModelConfig) -> None:
        if not config.pretrained:
            raise ValueError('BiomedCLIP requires pretrained weights in this scaffold.')
        model_id = config.model_id or DEFAULT_MODEL_ID
        encoder, _ = open_clip.create_model_from_pretrained(model_id)
        preprocess_cfg = open_clip.get_model_preprocess_cfg(encoder)
        image_size = _resolve_image_size(config.image_size or preprocess_cfg.get('size'))
        feature_dim = _resolve_feature_dim(encoder, image_size)
        super().__init__(
            encoder=encoder,
            feature_dim=feature_dim,
            embedding_dim=config.embedding_dim,
            dropout=config.dropout,
            normalize_embeddings=config.normalize_embeddings,
        )
        self.preprocess_cfg = preprocess_cfg
        self.default_image_size = image_size
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
    preprocess_cfg = getattr(model, 'preprocess_cfg', {})
    spec = ModelSpec(
        name='biomedclip',
        image_size=config.image_size or _resolve_image_size(preprocess_cfg.get('size')),
        mean=tuple(config.mean or list(preprocess_cfg.get('mean', open_clip.OPENAI_DATASET_MEAN))),
        std=tuple(config.std or list(preprocess_cfg.get('std', open_clip.OPENAI_DATASET_STD))),
    )
    return model, spec
