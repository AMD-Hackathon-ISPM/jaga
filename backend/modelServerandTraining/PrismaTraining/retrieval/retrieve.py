from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from PrismaTraining.retrieval.index import RetrievalIndex


@dataclass(frozen=True)
class RetrievalAssets:
    embeddings: np.ndarray
    labels: np.ndarray
    paths: np.ndarray
    metadata: pd.DataFrame


@dataclass(frozen=True)
class RetrievalNeighbor:
    rank: int
    index: int
    label: int
    label_name: str
    path: str
    similarity_score: float


@dataclass(frozen=True)
class RetrievalEvidence:
    top_k_labels: list[int]
    top_k_label_names: list[str]
    top_k_paths: list[str]
    top_k_similarity_scores: list[float]
    tb_vote_ratio: float
    normal_vote_ratio: float
    majority_retrieval_label: str
    neighbors: list[RetrievalNeighbor]


def load_retrieval_assets(
    embeddings_path: str | Path,
    labels_path: str | Path,
    paths_path: str | Path,
    metadata_path: str | Path,
    class_names: list[str],
) -> RetrievalAssets:
    embeddings = np.load(embeddings_path).astype(np.float32)
    labels = np.load(labels_path).astype(np.int64)
    paths = np.load(paths_path, allow_pickle=True).astype(str)
    metadata_file = Path(metadata_path)
    if metadata_file.exists():
        metadata = pd.read_csv(metadata_file)
    else:
        metadata = pd.DataFrame(
            {
                'path': paths,
                'label': labels,
                'label_name': [class_names[int(label)] for label in labels.tolist()],
            }
        )
    return RetrievalAssets(
        embeddings=embeddings,
        labels=labels,
        paths=paths,
        metadata=metadata,
    )


def retrieve_neighbors(
    index: RetrievalIndex,
    assets: RetrievalAssets,
    query_embedding: np.ndarray,
    k: int,
    exclude_index: int | None = None,
) -> list[RetrievalNeighbor]:
    search_k = k + 1 if exclude_index is not None else k
    scores, indices = index.search(query_embedding, search_k)
    return _build_neighbors(
        assets=assets,
        scores=scores[0],
        indices=indices[0],
        k=k,
        exclude_index=exclude_index,
    )


def aggregate_retrieval_evidence(
    neighbors: list[RetrievalNeighbor],
    class_names: list[str],
) -> RetrievalEvidence:
    if not neighbors:
        raise ValueError('No retrieval neighbors available for evidence aggregation.')
    top_k_labels = [neighbor.label for neighbor in neighbors]
    top_k_label_names = [neighbor.label_name for neighbor in neighbors]
    top_k_paths = [neighbor.path for neighbor in neighbors]
    top_k_similarity_scores = [neighbor.similarity_score for neighbor in neighbors]
    normal_index, tb_index = resolve_binary_indices(class_names)
    label_counts = {label: top_k_labels.count(label) for label in set(top_k_labels)}
    majority_index = max(label_counts.items(), key=lambda item: (item[1], -top_k_labels.index(item[0])))[0]
    total = float(len(neighbors))
    return RetrievalEvidence(
        top_k_labels=top_k_labels,
        top_k_label_names=top_k_label_names,
        top_k_paths=top_k_paths,
        top_k_similarity_scores=top_k_similarity_scores,
        tb_vote_ratio=label_counts.get(tb_index, 0) / total,
        normal_vote_ratio=label_counts.get(normal_index, 0) / total,
        majority_retrieval_label=class_names[majority_index],
        neighbors=neighbors,
    )


def save_retrieval_outputs(
    output_prefix: Path,
    payload: dict[str, Any],
    neighbors: list[RetrievalNeighbor],
) -> tuple[Path, Path]:
    output_prefix.parent.mkdir(parents=True, exist_ok=True)
    json_path = output_prefix.with_suffix('.json')
    csv_path = output_prefix.with_suffix('.csv')
    with json_path.open('w', encoding='utf-8') as handle:
        json.dump(_sanitize_payload(payload), handle, indent=2)
    neighbor_frame = pd.DataFrame([asdict(neighbor) for neighbor in neighbors])
    neighbor_frame.to_csv(csv_path, index=False)
    return json_path, csv_path


def resolve_binary_indices(class_names: list[str]) -> tuple[int, int]:
    lowered = [name.lower() for name in class_names]
    normal_index = next((index for index, name in enumerate(lowered) if 'normal' in name), 0)
    tb_index = next((index for index, name in enumerate(lowered) if 'tb' in name or 'tuberc' in name), 1 if len(class_names) > 1 else 0)
    return normal_index, tb_index


def _build_neighbors(
    assets: RetrievalAssets,
    scores: np.ndarray,
    indices: np.ndarray,
    k: int,
    exclude_index: int | None,
) -> list[RetrievalNeighbor]:
    neighbors: list[RetrievalNeighbor] = []
    for index, score in zip(indices.tolist(), scores.tolist(), strict=False):
        if index < 0:
            continue
        if exclude_index is not None and index == exclude_index:
            continue
        label = int(assets.labels[index])
        label_name = _resolve_label_name(assets.metadata, index)
        neighbors.append(
            RetrievalNeighbor(
                rank=len(neighbors) + 1,
                index=index,
                label=label,
                label_name=label_name,
                path=str(assets.paths[index]),
                similarity_score=float(score),
            )
        )
        if len(neighbors) == k:
            break
    return neighbors


def _resolve_label_name(metadata: pd.DataFrame, index: int) -> str:
    if 'label_name' in metadata.columns:
        return str(metadata.iloc[index]['label_name'])
    return str(metadata.iloc[index]['label'])


def _sanitize_payload(payload: Any) -> Any:
    if isinstance(payload, dict):
        return {key: _sanitize_payload(value) for key, value in payload.items()}
    if isinstance(payload, list):
        return [_sanitize_payload(value) for value in payload]
    if isinstance(payload, RetrievalNeighbor):
        return asdict(payload)
    if isinstance(payload, RetrievalEvidence):
        sanitized = asdict(payload)
        sanitized['neighbors'] = [_sanitize_payload(neighbor) for neighbor in payload.neighbors]
        return sanitized
    if isinstance(payload, np.ndarray):
        return payload.tolist()
    if isinstance(payload, np.floating):
        return float(payload)
    if isinstance(payload, np.integer):
        return int(payload)
    return payload
