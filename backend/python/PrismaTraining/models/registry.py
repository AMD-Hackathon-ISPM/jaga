from __future__ import annotations

from importlib import import_module
from collections.abc import Callable

from PrismaTraining.models.base import BaseEmbeddingModel, ModelSpec
from PrismaTraining.utils.config import ModelConfig


ModelBuilder = Callable[[ModelConfig], tuple[BaseEmbeddingModel, ModelSpec]]


MODEL_REGISTRY: dict[str, tuple[str, str]] = {
    'densenet121': ('project.models.densenet', 'build_densenet121'),
    'efficientnet_b0': ('project.models.efficientnet', 'build_efficientnet_b0'),
    'biomedclip': ('project.models.biomedclip', 'build_biomedclip'),
    'raddino': ('project.models.raddino', 'build_raddino'),
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
    module_name, builder_name = MODEL_REGISTRY[resolved_name]
    builder = getattr(import_module(module_name), builder_name)
    return builder(config)
