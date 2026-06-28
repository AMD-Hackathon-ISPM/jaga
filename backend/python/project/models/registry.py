from __future__ import annotations

from collections.abc import Callable

from project.models.base import BaseEmbeddingModel, ModelSpec
from project.models.biomedclip import build_biomedclip
from project.models.densenet import build_densenet121
from project.models.efficientnet import build_efficientnet_b0
from project.models.raddino import build_raddino
from project.utils.config import ModelConfig


ModelBuilder = Callable[[ModelConfig], tuple[BaseEmbeddingModel, ModelSpec]]


MODEL_REGISTRY: dict[str, ModelBuilder] = {
    'densenet121': build_densenet121,
    'efficientnet_b0': build_efficientnet_b0,
    'biomedclip': build_biomedclip,
    'raddino': build_raddino,
}

MODEL_ALIASES: dict[str, str] = {
    'densenet121': 'densenet121',
    'densenet-121': 'densenet121',
    'efficientnet_b0': 'efficientnet_b0',
    'efficientnet-b0': 'efficientnet_b0',
    'efficientnetb0': 'efficientnet_b0',
    'biomedclip': 'biomedclip',
    'biomed-clip': 'biomedclip',
    'rad-dino': 'raddino',
    'rad_dino': 'raddino',
    'raddino': 'raddino',
}


def build_model(config: ModelConfig) -> tuple[BaseEmbeddingModel, ModelSpec]:
    normalized_name = config.name.lower()
    resolved_name = MODEL_ALIASES.get(normalized_name)
    if resolved_name is None or resolved_name not in MODEL_REGISTRY:
        supported = ', '.join(sorted(MODEL_REGISTRY))
        raise KeyError(f'Unknown model {config.name}. Supported models: {supported}')
    config.name = resolved_name
    return MODEL_REGISTRY[resolved_name](config)
