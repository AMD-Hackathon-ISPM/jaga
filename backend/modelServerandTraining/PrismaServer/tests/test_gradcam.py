"""Unit tests for serving-time Grad-CAM (app/gradcam.py).

Runs against the real local_clahe checkpoint committed in-repo.
"""

from __future__ import annotations

import base64
from pathlib import Path

import cv2
import numpy as np
import pytest

from app.gradcam import HEATMAP_COLORMAP, generateGradcamDataUrl, gradcamMap
from app.model import checkpointDefault, loadModel, preprocess

BUNDLE_DIR = Path(__file__).resolve().parents[1] / "app" / "models" / "local_clahe"

PNG_PREFIX = "data:image/png;base64,"


def test_heatmap_uses_sequential_non_jet_colormap():
    assert HEATMAP_COLORMAP == cv2.COLORMAP_INFERNO
    assert HEATMAP_COLORMAP != cv2.COLORMAP_JET


@pytest.fixture(scope="module")
def prismaModel():
    checkpoint = checkpointDefault(BUNDLE_DIR)
    assert checkpoint.is_file(), f"checkpoint missing: {checkpoint}"
    return loadModel(str(checkpoint), 0.5)


def syntheticPng(height: int = 320, width: int = 400) -> bytes:
    rng = np.random.default_rng(7)
    image = rng.integers(0, 256, size=(height, width), dtype=np.uint8)
    ok, png = cv2.imencode(".png", image)
    assert ok
    return png.tobytes()


def test_gradcam_map_shape_and_range(prismaModel):
    cam = gradcamMap(prismaModel.model, preprocess(syntheticPng()))
    assert cam.shape == (7, 7)
    assert float(cam.min()) >= 0.0
    assert float(cam.max()) <= 1.0


def test_data_url_decodes_to_png_matching_input_size(prismaModel):
    url = generateGradcamDataUrl(prismaModel.model, syntheticPng())
    assert url.startswith(PNG_PREFIX)
    raw = base64.b64decode(url[len(PNG_PREFIX):])
    decoded = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    assert decoded is not None
    assert decoded.shape[:2] == (320, 400)  # under the 512 cap: kept as-is


def test_large_image_is_capped_to_512(prismaModel):
    url = generateGradcamDataUrl(prismaModel.model, syntheticPng(1024, 2048))
    raw = base64.b64decode(url[len(PNG_PREFIX):])
    decoded = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    assert decoded.shape[:2] == (256, 512)  # longest edge capped at 512


def test_predict_is_unchanged_by_gradcam(prismaModel):
    image = syntheticPng()
    before = prismaModel.predict(image)["probability"]
    generateGradcamDataUrl(prismaModel.model, image)
    after = prismaModel.predict(image)["probability"]
    assert after == pytest.approx(before, abs=1e-12)


def syntheticStructuredPng() -> bytes:
    image = np.full((1024, 1024), 30, dtype=np.uint8)
    cv2.ellipse(image, (340, 512), (180, 320), 0, 0, 360, 160, -1)
    cv2.ellipse(image, (684, 512), (180, 320), 0, 0, 360, 150, -1)
    image = cv2.GaussianBlur(image, (31, 31), 0)
    ok, png = cv2.imencode(".png", image)
    assert ok
    return png.tobytes()


def test_cam_is_not_degenerate_on_structured_image(prismaModel):
    cam = gradcamMap(prismaModel.model, preprocess(syntheticStructuredPng()))
    assert float(cam.max()) == pytest.approx(1.0)  # normalized peak present
    assert np.unique(np.round(cam, 3)).size > 5  # spatial structure, not a flat map
