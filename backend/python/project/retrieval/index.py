from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import faiss
import numpy as np


SUPPORTED_METRICS = {'cosine'}


@dataclass(frozen=True)
class IndexSummary:
    dimension: int
    metric: str
    normalized: bool
    size: int


class RetrievalIndex:
    def __init__(self, index: faiss.Index, metric: str, normalized: bool) -> None:
        self.index = index
        self.metric = self._validate_metric(metric)
        self.normalized = normalized

    @classmethod
    def from_embeddings(
        cls,
        embeddings: np.ndarray,
        metric: str = 'cosine',
        normalize: bool = True,
    ) -> 'RetrievalIndex':
        validated_metric = cls._validate_metric(metric)
        prepared_embeddings = prepare_embeddings(
            embeddings=embeddings,
            metric=validated_metric,
            normalize=normalize,
        )
        dimension = int(prepared_embeddings.shape[1])
        index = faiss.IndexFlatIP(dimension)
        index.add(prepared_embeddings)
        return cls(index=index, metric=validated_metric, normalized=normalize)

    @classmethod
    def load(
        cls,
        path: str | Path,
        metric: str = 'cosine',
        normalized: bool = True,
    ) -> 'RetrievalIndex':
        index = faiss.read_index(str(Path(path)))
        return cls(index=index, metric=metric, normalized=normalized)

    @property
    def size(self) -> int:
        return int(self.index.ntotal)

    @property
    def dimension(self) -> int:
        return int(self.index.d)

    def search(self, query_embeddings: np.ndarray, k: int) -> tuple[np.ndarray, np.ndarray]:
        if k <= 0:
            raise ValueError('k must be positive.')
        prepared_queries = prepare_embeddings(
            embeddings=query_embeddings,
            metric=self.metric,
            normalize=self.normalized,
        )
        scores, indices = self.index.search(prepared_queries, k)
        return scores, indices

    def save(self, path: str | Path) -> None:
        target_path = Path(path)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(target_path))

    def summary(self) -> IndexSummary:
        return IndexSummary(
            dimension=self.dimension,
            metric=self.metric,
            normalized=self.normalized,
            size=self.size,
        )

    @staticmethod
    def _validate_metric(metric: str) -> str:
        normalized_metric = metric.lower()
        if normalized_metric not in SUPPORTED_METRICS:
            supported = ', '.join(sorted(SUPPORTED_METRICS))
            raise ValueError(f'Unsupported retrieval metric: {metric}. Supported metrics: {supported}')
        return normalized_metric


def prepare_embeddings(
    embeddings: np.ndarray,
    metric: str = 'cosine',
    normalize: bool = True,
) -> np.ndarray:
    array = np.asarray(embeddings, dtype=np.float32)
    if array.ndim == 1:
        array = array.reshape(1, -1)
    if array.ndim != 2:
        raise ValueError(f'Embeddings must be 2D after reshape, got shape {array.shape}.')
    if metric == 'cosine' and normalize:
        norms = np.linalg.norm(array, axis=1, keepdims=True)
        norms = np.clip(norms, a_min=1e-12, a_max=None)
        array = array / norms
    return np.ascontiguousarray(array)
