from __future__ import annotations

from torchvision import transforms
from torchvision.transforms import InterpolationMode

from project.models.base import ModelSpec
from project.utils.config import AugmentationConfig


def _resolve_size(model_spec: ModelSpec) -> int:
    return int(model_spec.image_size)


def build_train_transform(model_spec: ModelSpec, augmentation: AugmentationConfig) -> transforms.Compose:
    size = _resolve_size(model_spec)
    scale = tuple(augmentation.train_resize_scale)
    return transforms.Compose(
        [
            transforms.RandomResizedCrop(size=size, scale=scale, interpolation=InterpolationMode.BICUBIC),
            transforms.RandomHorizontalFlip(p=augmentation.horizontal_flip_prob),
            transforms.RandomRotation(degrees=augmentation.rotation_degrees),
            transforms.ColorJitter(
                brightness=augmentation.color_jitter_brightness,
                contrast=augmentation.color_jitter_contrast,
            ),
            transforms.ToTensor(),
            transforms.Normalize(mean=model_spec.mean, std=model_spec.std),
        ]
    )


def build_eval_transform(model_spec: ModelSpec) -> transforms.Compose:
    size = _resolve_size(model_spec)
    resize_size = int(size * 1.14)
    return transforms.Compose(
        [
            transforms.Resize(resize_size, interpolation=InterpolationMode.BICUBIC),
            transforms.CenterCrop(size),
            transforms.ToTensor(),
            transforms.Normalize(mean=model_spec.mean, std=model_spec.std),
        ]
    )
