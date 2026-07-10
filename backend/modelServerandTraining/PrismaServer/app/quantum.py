"""Quantum-kernel evaluation surface for the CXR bundle.

The local_clahe bundle ships a quantum-kernel SVM trained on PCA-reduced DenseNet
embeddings (PennyLane, lightning.qubit, 4 qubits). This module loads its recorded
evaluation so the API can surface it as a first-class, highlighted result
alongside the classical DenseNet classifier.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=1)
def loadQuantumSummary(quantumDir: str) -> dict[str, object]:
    directory = Path(quantumDir)
    metricsPath = directory / "quantum_metrics.json"
    if not metricsPath.is_file():
        return {"available": False, "reason": "quantum_metrics.json not found"}

    metrics = json.loads(metricsPath.read_text())
    quantum = metrics.get("quantum", {})
    backend = metrics.get("quantum_backend", {})
    pca = metrics.get("pca", {})
    quantumSvm = metrics.get("quantum_kernel_svm", {})
    classicalSvm = metrics.get("classical_svm", {})
    dataset = metrics.get("dataset", {})

    explained = pca.get("explained_variance_ratio", [])
    explainedTotal = round(sum(explained), 4) if explained else None

    return {
        "available": True,
        "highlight": (
            "Quantum-kernel SVM on PCA-reduced chest X-ray embeddings, evaluated with "
            f"PennyLane {backend.get('name', 'lightning.qubit')} across "
            f"{backend.get('wires', 4)} qubits."
        ),
        "method": {
            "backend": backend.get("name", "lightning.qubit"),
            "qubits": backend.get("wires", 4),
            "shots": backend.get("shots"),
            "n_layers": quantum.get("n_layers"),
            "pca_dim": pca.get("dim"),
            "pca_explained_variance": explainedTotal,
        },
        "dataset": {
            "num_train": dataset.get("num_train"),
            "num_test": dataset.get("num_test"),
            "class_names": dataset.get("class_names"),
        },
        "quantum_kernel_svm": _metricSubset(quantumSvm),
        "classical_svm": _metricSubset(classicalSvm),
    }


def _metricSubset(metrics: dict[str, object]) -> dict[str, object]:
    keys = ("accuracy", "precision", "recall", "f1", "sensitivity", "specificity", "roc_auc")
    return {key: metrics.get(key) for key in keys if key in metrics}
