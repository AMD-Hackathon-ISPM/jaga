from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Mapping

import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
from torch import Tensor
from torch.utils.data import DataLoader
from tqdm.auto import tqdm

from project.models.base import BaseEmbeddingModel


@dataclass
class EmbeddingArtifacts:
    embeddings: np.ndarray
    labels: np.ndarray
    paths: np.ndarray
    splits: np.ndarray


class EmbeddingExtractor:
    def __init__(self, model: BaseEmbeddingModel, device: torch.device, amp: bool) -> None:
        self.model = model
        self.device = device
        self.amp = amp and device.type == 'cuda'

    def extract(self, loaders: Mapping[str, DataLoader[tuple[Tensor, int, str]]], normalize: bool) -> EmbeddingArtifacts:
        self.model.eval()
        all_embeddings: list[np.ndarray] = []
        all_labels: list[np.ndarray] = []
        all_paths: list[str] = []
        all_splits: list[str] = []
        with torch.no_grad():
            for split, loader in loaders.items():
                for images, labels, paths in tqdm(loader, leave=False):
                    images = images.to(self.device, non_blocking=True)
                    with torch.autocast(device_type=self.device.type, enabled=self.amp):
                        outputs = self.model(images)
                    embeddings = outputs.embedding
                    if normalize:
                        embeddings = F.normalize(embeddings, dim=-1)
                    all_embeddings.append(embeddings.cpu().numpy())
                    all_labels.append(labels.numpy())
                    all_paths.extend(paths)
                    all_splits.extend([split] * len(paths))
        return EmbeddingArtifacts(
            embeddings=np.concatenate(all_embeddings),
            labels=np.concatenate(all_labels),
            paths=np.asarray(all_paths),
            splits=np.asarray(all_splits),
        )


def save_embedding_artifacts(
    artifacts: EmbeddingArtifacts,
    output_dir: Path,
    class_names: list[str],
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    np.save(output_dir / 'embeddings.npy', artifacts.embeddings)
    np.save(output_dir / 'labels.npy', artifacts.labels)
    np.save(output_dir / 'paths.npy', artifacts.paths)
    metadata = pd.DataFrame(
        {
            'path': artifacts.paths,
            'label': artifacts.labels,
            'label_name': [class_names[int(label)] for label in artifacts.labels.tolist()],
            'split': artifacts.splits,
        }
    )
    metadata.to_csv(output_dir / 'metadata.csv', index=False)
