"""API tests for /api/v1/cxr inspection (Grad-CAM enabled / disabled / graceful failure)."""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

import app.main as mainModule
from app.model import checkpointDefault, loadModel

BUNDLE_DIR = Path(__file__).resolve().parents[1] / "app" / "models" / "local_clahe"

SAFETY_LABEL = "Model inspection; not a clinical explanation."


@pytest.fixture()
def client():
    return TestClient(mainModule.app)


def syntheticUpload() -> dict[str, tuple[str, bytes, str]]:
    rng = np.random.default_rng(11)
    image = rng.integers(0, 256, size=(320, 400), dtype=np.uint8)
    ok, png = cv2.imencode(".png", image)
    assert ok
    return {"image": ("synthetic.png", png.tobytes(), "image/png")}


def test_gradcam_enabled_returns_data_url(client, monkeypatch):
    monkeypatch.setenv("PRISMA_GRADCAM", "true")
    response = client.post("/api/v1/cxr", files=syntheticUpload())
    assert response.status_code == 200
    body = response.json()
    inspection = body["inspection"]
    assert inspection["available"] is True
    assert inspection["url"].startswith("data:image/png;base64,")
    assert inspection["label"] == SAFETY_LABEL
    assert 0.0 <= body["estimate"]["probability"] <= 1.0


def test_gradcam_disabled_keeps_classification(client, monkeypatch):
    monkeypatch.setenv("PRISMA_GRADCAM", "false")
    response = client.post("/api/v1/cxr", files=syntheticUpload())
    assert response.status_code == 200
    body = response.json()
    assert body["inspection"] == {"available": False, "label": SAFETY_LABEL}
    assert body["estimate"]["probability"] is not None


def test_gradcam_failure_preserves_classification(client, monkeypatch):
    monkeypatch.setenv("PRISMA_GRADCAM", "true")

    def boom(model, imageBytes):
        raise RuntimeError("synthetic gradcam failure")

    monkeypatch.setattr(mainModule, "generateGradcamDataUrl", boom)
    response = client.post("/api/v1/cxr", files=syntheticUpload())
    assert response.status_code == 200
    body = response.json()
    assert body["inspection"] == {"available": False, "label": SAFETY_LABEL}
    assert 0.0 <= body["estimate"]["probability"] <= 1.0


def test_probability_identical_with_and_without_gradcam(client, monkeypatch):
    files = syntheticUpload()
    monkeypatch.setenv("PRISMA_GRADCAM", "false")
    without = client.post("/api/v1/cxr", files=files).json()["estimate"]["probability"]
    monkeypatch.setenv("PRISMA_GRADCAM", "true")
    with_ = client.post("/api/v1/cxr", files=files).json()["estimate"]["probability"]
    assert with_ == pytest.approx(without, abs=1e-12)

    direct = loadModel(str(checkpointDefault(BUNDLE_DIR)), mainModule.THRESHOLD).predict(
        files["image"][1]
    )["probability"]
    assert with_ == pytest.approx(direct, abs=1e-12)
