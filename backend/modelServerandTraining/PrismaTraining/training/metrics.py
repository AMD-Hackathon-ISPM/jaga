from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


def compute_classification_metrics(
    targets: np.ndarray,
    probabilities: np.ndarray,
    threshold: float,
) -> dict[str, Any]:
    binary_predictions = (probabilities >= threshold).astype(np.int64)
    metrics: dict[str, Any] = {
        'accuracy': float(accuracy_score(targets, binary_predictions)),
        'precision': float(precision_score(targets, binary_predictions, zero_division=0)),
        'recall': float(recall_score(targets, binary_predictions, zero_division=0)),
        'f1': float(f1_score(targets, binary_predictions, zero_division=0)),
        'sensitivity': float(recall_score(targets, binary_predictions, zero_division=0)),
    }
    confusion = confusion_matrix(targets, binary_predictions, labels=[0, 1])
    tn, fp, fn, tp = confusion.ravel()
    specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    metrics['specificity'] = specificity
    metrics['confusion_matrix'] = confusion.tolist()
    if len(np.unique(targets)) > 1:
        metrics['roc_auc'] = float(roc_auc_score(targets, probabilities))
        metrics['pr_auc'] = float(average_precision_score(targets, probabilities))
    else:
        metrics['roc_auc'] = float('nan')
        metrics['pr_auc'] = float('nan')
    return metrics
