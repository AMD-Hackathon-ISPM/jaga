from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Sequence

from PIL import Image
from torch import Tensor
from torch.utils.data import DataLoader, Dataset

from project.utils.config import ExperimentConfig


@dataclass(frozen=True)
class ImageRecord:
    path: Path
    label: int
    split: str


class TbCxrDataset(Dataset[tuple[Tensor, int, str]]):
    def __init__(
        self,
        root: str | Path,
        split: str,
        split_dirs: dict[str, str],
        class_names: Sequence[str],
        file_extensions: Sequence[str],
        max_samples_per_class: int | None = None,
        transform: Callable[[Image.Image], Tensor] | None = None,
    ) -> None:
        self.root = Path(root)
        self.split = split
        self.split_dirs = dict(split_dirs)
        self.class_names = list(class_names)
        self.file_extensions = tuple(extension.lower() for extension in file_extensions)
        self.max_samples_per_class = max_samples_per_class
        self.transform = transform
        self.class_to_index = {name: index for index, name in enumerate(self.class_names)}
        self.records = self._build_records()

    def _build_records(self) -> list[ImageRecord]:
        split_root = self._resolve_split_root()
        if not split_root.exists():
            raise FileNotFoundError(f'Missing split directory: {split_root}')
        records: list[ImageRecord] = []
        for class_name in self.class_names:
            class_dir = split_root / class_name
            if not class_dir.exists():
                raise FileNotFoundError(f'Missing class directory: {class_dir}')
            class_paths = [
                path
                for path in sorted(class_dir.rglob('*'))
                if path.is_file() and path.suffix.lower() in self.file_extensions
            ]
            if self.max_samples_per_class is not None:
                class_paths = class_paths[: self.max_samples_per_class]
            for path in class_paths:
                if path.is_file() and path.suffix.lower() in self.file_extensions:
                    records.append(
                        ImageRecord(
                            path=path,
                            label=self.class_to_index[class_name],
                            split=self.split,
                        )
                    )
        if not records:
            raise ValueError(f'No image files found in {split_root}')
        return records

    def _resolve_split_root(self) -> Path:
        configured_name = self.split_dirs.get(self.split, self.split)
        candidates = [
            configured_name,
            self.split,
            self.split.lower(),
            self.split.upper(),
            self.split.capitalize(),
        ]
        for candidate in candidates:
            split_root = self.root / candidate
            if split_root.exists():
                return split_root
        return self.root / configured_name

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, index: int) -> tuple[Tensor, int, str]:
        record = self.records[index]
        image = Image.open(record.path).convert('RGB')
        if self.transform is None:
            raise ValueError('A transform must be provided for TbCxrDataset.')
        tensor = self.transform(image)
        return tensor, record.label, str(record.path)

    @property
    def targets(self) -> list[int]:
        return [record.label for record in self.records]


def create_dataloaders(
    config: ExperimentConfig,
    train_transform: Callable[[Image.Image], Tensor],
    eval_transform: Callable[[Image.Image], Tensor],
) -> tuple[dict[str, TbCxrDataset], dict[str, DataLoader[tuple[Tensor, int, str]]]]:
    datasets = {
        'train': TbCxrDataset(
            root=config.dataset.root,
            split='train',
            split_dirs=config.dataset.split_dirs,
            class_names=config.dataset.class_names,
            file_extensions=config.dataset.file_extensions,
            max_samples_per_class=config.dataset.max_samples_per_class,
            transform=train_transform,
        ),
        'val': TbCxrDataset(
            root=config.dataset.root,
            split='val',
            split_dirs=config.dataset.split_dirs,
            class_names=config.dataset.class_names,
            file_extensions=config.dataset.file_extensions,
            max_samples_per_class=config.dataset.max_samples_per_class,
            transform=eval_transform,
        ),
        'test': TbCxrDataset(
            root=config.dataset.root,
            split='test',
            split_dirs=config.dataset.split_dirs,
            class_names=config.dataset.class_names,
            file_extensions=config.dataset.file_extensions,
            max_samples_per_class=config.dataset.max_samples_per_class,
            transform=eval_transform,
        ),
    }
    pin_memory = config.dataloader.pin_memory
    persistent_workers = config.dataloader.persistent_workers and config.dataloader.num_workers > 0
    loaders: dict[str, DataLoader[tuple[Tensor, int, str]]] = {
        'train': DataLoader(
            datasets['train'],
            batch_size=config.dataloader.train_batch_size,
            shuffle=True,
            num_workers=config.dataloader.num_workers,
            pin_memory=pin_memory,
            persistent_workers=persistent_workers,
            drop_last=config.dataloader.drop_last,
        ),
        'val': DataLoader(
            datasets['val'],
            batch_size=config.dataloader.eval_batch_size,
            shuffle=False,
            num_workers=config.dataloader.num_workers,
            pin_memory=pin_memory,
            persistent_workers=persistent_workers,
        ),
        'test': DataLoader(
            datasets['test'],
            batch_size=config.dataloader.eval_batch_size,
            shuffle=False,
            num_workers=config.dataloader.num_workers,
            pin_memory=pin_memory,
            persistent_workers=persistent_workers,
        ),
    }
    return datasets, loaders
