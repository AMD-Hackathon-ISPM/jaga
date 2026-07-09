from __future__ import annotations

from pathlib import Path

import matplotlib
import numpy as np
from sklearn.metrics import PrecisionRecallDisplay, RocCurveDisplay

matplotlib.use('Agg')
import matplotlib.pyplot as plt


def save_confusion_matrix(
    confusion_matrix: list[list[int]],
    class_names: list[str],
    output_path: Path,
) -> None:
    matrix = np.asarray(confusion_matrix)
    figure, axis = plt.subplots(figsize=(5, 5))
    image = axis.imshow(matrix, cmap='Blues')
    axis.set_xticks(range(len(class_names)))
    axis.set_yticks(range(len(class_names)))
    axis.set_xticklabels(class_names)
    axis.set_yticklabels(class_names)
    axis.set_xlabel('Predicted')
    axis.set_ylabel('Actual')
    for row in range(matrix.shape[0]):
        for column in range(matrix.shape[1]):
            axis.text(column, row, str(matrix[row, column]), ha='center', va='center')
    figure.colorbar(image, ax=axis)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    figure.tight_layout()
    figure.savefig(output_path, dpi=200)
    plt.close(figure)


def save_roc_curve(targets: np.ndarray, probabilities: np.ndarray, output_path: Path) -> None:
    figure, axis = plt.subplots(figsize=(6, 6))
    RocCurveDisplay.from_predictions(targets, probabilities, ax=axis)
    figure.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(output_path, dpi=200)
    plt.close(figure)


def save_pr_curve(targets: np.ndarray, probabilities: np.ndarray, output_path: Path) -> None:
    figure, axis = plt.subplots(figsize=(6, 6))
    PrecisionRecallDisplay.from_predictions(targets, probabilities, ax=axis)
    figure.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(output_path, dpi=200)
    plt.close(figure)
