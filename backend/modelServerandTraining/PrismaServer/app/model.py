"""Chest X-ray TB classifier (local_clahe bundle).

Reconstructs the training architecture — a DenseNet121 backbone, a 1024->256
embedding head, and a single-logit classifier — loads best.pt, and runs CLAHE
preprocessing to match how the model was trained.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from torchvision.models import densenet121

IMAGE_SIZE = 224
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
CLASS_NAMES = ["Normal", "Tuberculosis"]


class TBClassifier(nn.Module):
    """DenseNet121 encoder -> embedding head -> single TB logit."""

    def __init__(self, embeddingDim: int = 256, dropout: float = 0.2, normalizeEmbeddings: bool = True):
        super().__init__()
        self.encoder = densenet121(weights=None)
        featureDim = self.encoder.classifier.in_features  # 1024
        self.encoder.classifier = nn.Identity()
        self.embedding_layer = nn.Linear(featureDim, embeddingDim)
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(embeddingDim, 1)
        self.normalizeEmbeddings = normalizeEmbeddings

    def embed(self, x: torch.Tensor) -> torch.Tensor:
        features = self.encoder.features(x)
        pooled = F.adaptive_avg_pool2d(F.relu(features, inplace=True), (1, 1))
        pooled = torch.flatten(pooled, 1)
        embedding = self.embedding_layer(pooled)
        if self.normalizeEmbeddings:
            embedding = F.normalize(embedding, dim=1)
        return embedding

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.dropout(self.embed(x))).squeeze(-1)


def applyClahe(grayscale: np.ndarray) -> np.ndarray:
    """Contrast-limited adaptive histogram equalization, as used in training."""
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(grayscale)


def preprocess(imageBytes: bytes) -> torch.Tensor:
    image = Image.open(_asBuffer(imageBytes)).convert("L")
    grayscale = np.array(image, dtype=np.uint8)
    equalized = applyClahe(grayscale)

    resized = cv2.resize(equalized, (IMAGE_SIZE, IMAGE_SIZE), interpolation=cv2.INTER_AREA)
    rgb = np.stack([resized, resized, resized], axis=-1).astype(np.float32) / 255.0
    normalized = (rgb - IMAGENET_MEAN) / IMAGENET_STD

    tensor = torch.from_numpy(normalized).permute(2, 0, 1).unsqueeze(0).contiguous()
    return tensor


def _asBuffer(imageBytes: bytes):
    from io import BytesIO

    return BytesIO(imageBytes)


class PrismaModel:
    def __init__(self, model: TBClassifier, threshold: float):
        self.model = model
        self.threshold = threshold

    @torch.no_grad()
    def predict(self, imageBytes: bytes) -> dict[str, object]:
        tensor = preprocess(imageBytes)
        logit = self.model(tensor)
        probability = torch.sigmoid(logit).item()
        return {
            "probability": probability,
            "predicted": CLASS_NAMES[int(probability >= self.threshold)],
            "threshold": self.threshold,
        }


@lru_cache(maxsize=1)
def loadModel(checkpointPath: str, threshold: float = 0.5) -> PrismaModel:
    checkpoint = torch.load(checkpointPath, map_location="cpu", weights_only=False)
    stateDict = checkpoint.get("model", checkpoint)

    config = checkpoint.get("config", {}) or {}
    modelConfig = config.get("model", {}) if isinstance(config, dict) else {}
    embeddingDim = int(modelConfig.get("embedding_dim", 256))
    dropout = float(modelConfig.get("dropout", 0.2))
    normalize = bool(modelConfig.get("normalize_embeddings", True))

    model = TBClassifier(embeddingDim=embeddingDim, dropout=dropout, normalizeEmbeddings=normalize)
    model.load_state_dict(stateDict, strict=True)
    model.eval()
    return PrismaModel(model=model, threshold=threshold)


def checkpointDefault(bundleDir: Path) -> Path:
    return bundleDir / "checkpoints" / "best.pt"
