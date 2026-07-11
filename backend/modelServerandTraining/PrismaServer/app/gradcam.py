"""Serving-time Grad-CAM for the DenseNet121 TB classifier.

Post-hoc model inspection only — not a clinical explanation. Re-runs a
gradient-enabled forward pass against the already-loaded checkpoint (no
retraining; predict() is untouched). The heatmap is built entirely in memory
and returned as a PNG data URL; neither the upload nor the overlay ever
touches disk.
"""

from __future__ import annotations

import base64
from io import BytesIO

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

from app.model import TBClassifier, preprocess

MAX_OVERLAY_EDGE = 512  # cap the data-URL payload; heatmap is 7x7 upsampled anyway
OVERLAY_ALPHA = 0.4


def gradcamMap(model: TBClassifier, tensor: torch.Tensor) -> np.ndarray:
    """Grad-CAM over the final DenseNet feature map. Returns a 7x7 float map in [0, 1]."""
    model.zero_grad(set_to_none=True)
    with torch.enable_grad():
        # Grad-CAM needs the NON-NEGATIVE activations the head actually
        # consumes: encoder.features ends in BatchNorm (signed output), and
        # weighting that directly turns every cell negative -> all-zero CAM.
        # Mirrors TBClassifier.embed/forward with a NON-inplace ReLU (embed()
        # uses inplace=True, which would mutate the retained tensor).
        activations = F.relu(model.encoder.features(tensor))  # [1, 1024, 7, 7]
        activations.retain_grad()
        pooled = torch.flatten(F.adaptive_avg_pool2d(activations, (1, 1)), 1)
        embedding = model.embedding_layer(pooled)
        if model.normalizeEmbeddings:
            embedding = F.normalize(embedding, dim=1)
        logit = model.classifier(embedding).squeeze(-1)
        logit.backward()

    weights = activations.grad.mean(dim=(2, 3), keepdim=True)  # [1, 1024, 1, 1]
    cam = F.relu((weights * activations).sum(dim=1)).squeeze(0).detach().numpy()
    peak = float(cam.max())
    if peak <= 0.0:
        return np.zeros_like(cam)
    return cam / peak


def overlayDataUrl(imageBytes: bytes, cam: np.ndarray) -> str:
    """Blend the CAM onto the uploaded image; return an in-memory PNG data URL."""
    grayscale = np.array(Image.open(BytesIO(imageBytes)).convert("L"), dtype=np.uint8)

    height, width = grayscale.shape
    scale = min(1.0, MAX_OVERLAY_EDGE / max(height, width))
    if scale < 1.0:
        grayscale = cv2.resize(
            grayscale, (round(width * scale), round(height * scale)), interpolation=cv2.INTER_AREA
        )

    base = cv2.cvtColor(grayscale, cv2.COLOR_GRAY2BGR)
    camResized = cv2.resize(cam, (base.shape[1], base.shape[0]), interpolation=cv2.INTER_LINEAR)
    heat = cv2.applyColorMap((np.clip(camResized, 0.0, 1.0) * 255).astype(np.uint8), cv2.COLORMAP_JET)
    blended = cv2.addWeighted(heat, OVERLAY_ALPHA, base, 1.0 - OVERLAY_ALPHA, 0.0)

    ok, png = cv2.imencode(".png", blended)
    if not ok:
        raise RuntimeError("PNG encoding failed")
    return "data:image/png;base64," + base64.b64encode(png.tobytes()).decode("ascii")


def generateGradcamDataUrl(model: TBClassifier, imageBytes: bytes) -> str:
    """Preprocess -> Grad-CAM -> overlay -> data URL. Raises on failure; caller decides fallback."""
    tensor = preprocess(imageBytes)
    cam = gradcamMap(model, tensor)
    return overlayDataUrl(imageBytes, cam)
