from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.model_selection import StratifiedShuffleSplit, train_test_split
from sklearn.preprocessing import normalize
from sklearn.svm import SVC

from project.quantum.qkernel import QuantumKernel
from project.training.metrics import compute_classification_metrics
from project.utils.config import QuantumConfig


@dataclass(frozen=True)
class QuantumArtifacts:
    embeddings: np.ndarray
    labels: np.ndarray
    paths: np.ndarray
    metadata: pd.DataFrame


@dataclass(frozen=True)
class QuantumPaths:
    embeddings_path: Path
    labels_path: Path
    paths_path: Path
    metadata_path: Path
    output_dir: Path


@dataclass(frozen=True)
class SampledEmbeddings:
    embeddings: np.ndarray
    labels: np.ndarray
    paths: np.ndarray
    metadata: pd.DataFrame
    sampled_indices: np.ndarray


@dataclass(frozen=True)
class QuantumExperimentResult:
    classical_metrics: dict[str, Any]
    quantum_metrics: dict[str, Any]
    pca_embeddings: np.ndarray
    sampled_indices: np.ndarray
    quantum_train_kernel: np.ndarray
    quantum_test_kernel: np.ndarray
    classical_predictions: pd.DataFrame
    quantum_predictions: pd.DataFrame
    payload: dict[str, Any]


def load_quantum_artifacts(paths: QuantumPaths) -> QuantumArtifacts:
    _ensure_exists(paths.embeddings_path)
    _ensure_exists(paths.labels_path)
    _ensure_exists(paths.paths_path)
    _ensure_exists(paths.metadata_path)
    embeddings = np.load(paths.embeddings_path)
    labels = np.load(paths.labels_path)
    image_paths = np.load(paths.paths_path, allow_pickle=True)
    metadata = pd.read_csv(paths.metadata_path)
    sample_count = embeddings.shape[0]
    if labels.shape[0] != sample_count or image_paths.shape[0] != sample_count or len(metadata) != sample_count:
        raise ValueError('Embedding artifacts must all have the same number of samples.')
    return QuantumArtifacts(
        embeddings=np.asarray(embeddings, dtype=np.float64),
        labels=np.asarray(labels, dtype=np.int64),
        paths=np.asarray(image_paths),
        metadata=metadata.reset_index(drop=True),
    )


class QuantumSvmExperiment:
    def __init__(self, config: QuantumConfig, class_names: list[str]) -> None:
        self.config = config
        self.class_names = class_names
        self._validate_config()

    def run(self, paths: QuantumPaths) -> QuantumExperimentResult:
        artifacts = load_quantum_artifacts(paths)
        self._validate_labels(artifacts.labels)
        normalized_embeddings = normalize(artifacts.embeddings, norm='l2')
        sampled = self._sample_embeddings(
            embeddings=normalized_embeddings,
            labels=artifacts.labels,
            paths=artifacts.paths,
            metadata=artifacts.metadata,
        )
        train_indices, test_indices = self._split_indices(sampled.labels)
        train_embeddings = sampled.embeddings[train_indices]
        pca = self._fit_pca(train_embeddings)
        sampled_pca_embeddings = np.asarray(pca.transform(sampled.embeddings), dtype=np.float64)
        train_pca = sampled_pca_embeddings[train_indices]
        test_pca = sampled_pca_embeddings[test_indices]
        train_labels = sampled.labels[train_indices]
        test_labels = sampled.labels[test_indices]

        classical_model = SVC(kernel='rbf', probability=True, random_state=self.config.random_state)
        classical_model.fit(train_pca, train_labels)
        classical_probabilities = classical_model.predict_proba(test_pca)[:, 1]
        classical_metrics = compute_classification_metrics(test_labels, classical_probabilities, threshold=0.5)

        quantum_kernel = QuantumKernel(
            n_wires=self.config.pca_dim,
            n_layers=self.config.n_layers,
            shots=self.config.shots,
        )
        quantum_train_kernel = quantum_kernel.compute_kernel_matrix(train_pca)
        quantum_test_kernel = quantum_kernel.compute_kernel_matrix(test_pca, train_pca)
        quantum_model = SVC(kernel='precomputed', probability=True, random_state=self.config.random_state)
        quantum_model.fit(quantum_train_kernel, train_labels)
        quantum_probabilities = quantum_model.predict_proba(quantum_test_kernel)[:, 1]
        quantum_metrics = compute_classification_metrics(test_labels, quantum_probabilities, threshold=0.5)

        classical_predictions = self._build_predictions(
            sampled=sampled,
            test_indices=test_indices,
            probabilities=classical_probabilities,
        )
        quantum_predictions = self._build_predictions(
            sampled=sampled,
            test_indices=test_indices,
            probabilities=quantum_probabilities,
        )

        payload = {
            'quantum': {
                'enabled': self.config.enabled,
                'pca_dim': self.config.pca_dim,
                'max_samples': self.config.max_samples,
                'test_size': self.config.test_size,
                'random_state': self.config.random_state,
                'shots': self.config.shots,
                'n_layers': self.config.n_layers,
                'output_dir': self.config.output_dir,
            },
            'artifacts': {
                'embeddings_path': str(paths.embeddings_path),
                'labels_path': str(paths.labels_path),
                'paths_path': str(paths.paths_path),
                'metadata_path': str(paths.metadata_path),
                'output_dir': str(paths.output_dir),
            },
            'dataset': {
                'num_total_embeddings': int(artifacts.embeddings.shape[0]),
                'num_sampled_embeddings': int(sampled.embeddings.shape[0]),
                'num_train': int(train_indices.shape[0]),
                'num_test': int(test_indices.shape[0]),
                'class_names': self.class_names,
            },
            'pca': {
                'dim': self.config.pca_dim,
                'explained_variance_ratio': pca.explained_variance_ratio_.tolist(),
            },
            'quantum_backend': asdict(quantum_kernel.device_info),
            'classical_svm': classical_metrics,
            'quantum_kernel_svm': quantum_metrics,
        }

        return QuantumExperimentResult(
            classical_metrics=classical_metrics,
            quantum_metrics=quantum_metrics,
            pca_embeddings=sampled_pca_embeddings,
            sampled_indices=sampled.sampled_indices,
            quantum_train_kernel=quantum_train_kernel,
            quantum_test_kernel=quantum_test_kernel,
            classical_predictions=classical_predictions,
            quantum_predictions=quantum_predictions,
            payload=payload,
        )

    def save(self, result: QuantumExperimentResult, output_dir: Path) -> None:
        output_dir.mkdir(parents=True, exist_ok=True)
        np.save(output_dir / 'pca_embeddings.npy', result.pca_embeddings)
        np.save(output_dir / 'sampled_indices.npy', result.sampled_indices)
        np.save(output_dir / 'quantum_train_kernel.npy', result.quantum_train_kernel)
        np.save(output_dir / 'quantum_test_kernel.npy', result.quantum_test_kernel)
        result.classical_predictions.to_csv(output_dir / 'classical_predictions.csv', index=False)
        result.quantum_predictions.to_csv(output_dir / 'quantum_predictions.csv', index=False)
        with (output_dir / 'quantum_metrics.json').open('w', encoding='utf-8') as handle:
            json.dump(result.payload, handle, indent=2)

    def _validate_config(self) -> None:
        if self.config.pca_dim not in (2, 4, 8):
            raise ValueError('quantum.pca_dim must be one of 2, 4, or 8.')
        if self.config.max_samples is not None and self.config.max_samples < 2:
            raise ValueError('quantum.max_samples must be at least 2 when provided.')
        if not 0.0 < self.config.test_size < 1.0:
            raise ValueError('quantum.test_size must be between 0 and 1.')
        if self.config.n_layers < 1:
            raise ValueError('quantum.n_layers must be at least 1.')
        if self.config.shots is not None and self.config.shots < 1:
            raise ValueError('quantum.shots must be positive when provided.')

    def _validate_labels(self, labels: np.ndarray) -> None:
        unique_labels = np.unique(labels)
        if unique_labels.shape[0] != 2:
            raise ValueError(f'Quantum experiment requires binary labels. Received labels: {unique_labels.tolist()}')

    def _sample_embeddings(
        self,
        embeddings: np.ndarray,
        labels: np.ndarray,
        paths: np.ndarray,
        metadata: pd.DataFrame,
    ) -> SampledEmbeddings:
        sampled_indices = self._sample_indices(labels)
        return SampledEmbeddings(
            embeddings=embeddings[sampled_indices],
            labels=labels[sampled_indices],
            paths=paths[sampled_indices],
            metadata=metadata.iloc[sampled_indices].reset_index(drop=True),
            sampled_indices=sampled_indices,
        )

    def _sample_indices(self, labels: np.ndarray) -> np.ndarray:
        total_samples = int(labels.shape[0])
        if self.config.max_samples is None or self.config.max_samples >= total_samples:
            return np.arange(total_samples, dtype=np.int64)
        try:
            splitter = StratifiedShuffleSplit(
                n_splits=1,
                train_size=self.config.max_samples,
                random_state=self.config.random_state,
            )
            sampled_indices, _ = next(splitter.split(np.zeros(total_samples), labels))
        except ValueError as error:
            raise ValueError(
                'Unable to draw a stratified sample for the requested quantum.max_samples value.'
            ) from error
        return np.asarray(np.sort(sampled_indices), dtype=np.int64)

    def _split_indices(self, labels: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        sample_indices = np.arange(labels.shape[0], dtype=np.int64)
        try:
            train_indices, test_indices = train_test_split(
                sample_indices,
                test_size=self.config.test_size,
                random_state=self.config.random_state,
                stratify=labels,
            )
        except ValueError as error:
            raise ValueError(
                'Unable to perform a stratified train/test split for the sampled embeddings.'
            ) from error
        return np.asarray(train_indices, dtype=np.int64), np.asarray(test_indices, dtype=np.int64)

    def _fit_pca(self, train_embeddings: np.ndarray) -> PCA:
        if train_embeddings.shape[0] < self.config.pca_dim:
            raise ValueError(
                f'Not enough training samples for PCA dimension {self.config.pca_dim}. '
                f'Received {train_embeddings.shape[0]} training samples.'
            )
        if train_embeddings.shape[1] < self.config.pca_dim:
            raise ValueError(
                f'Embedding dimension {train_embeddings.shape[1]} is smaller than requested PCA dimension '
                f'{self.config.pca_dim}.'
            )
        pca = PCA(n_components=self.config.pca_dim, random_state=self.config.random_state)
        pca.fit(train_embeddings)
        return pca

    def _build_predictions(
        self,
        sampled: SampledEmbeddings,
        test_indices: np.ndarray,
        probabilities: np.ndarray,
    ) -> pd.DataFrame:
        rows = sampled.metadata.iloc[test_indices].copy().reset_index(drop=True)
        rows['sampled_index'] = test_indices
        rows['embedding_index'] = sampled.sampled_indices[test_indices]
        rows['path'] = sampled.paths[test_indices]
        rows['label'] = sampled.labels[test_indices]
        if 'label_name' not in rows.columns:
            rows['label_name'] = [self.class_names[int(label)] for label in rows['label'].tolist()]
        rows['probability'] = probabilities
        rows['prediction'] = (probabilities >= 0.5).astype(np.int64)
        return rows


def _ensure_exists(path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(f'Required quantum artifact not found: {path}')
