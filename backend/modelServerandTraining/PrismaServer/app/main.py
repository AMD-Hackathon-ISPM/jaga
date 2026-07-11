"""Jaga Prisma worker: chest X-ray TB screening (cxr-v1).

Serves the DenseNet121 CLAHE classifier from the local_clahe bundle and surfaces
the quantum-kernel evaluation as a highlighted, first-class result.
"""

from __future__ import annotations

import os
import secrets
from datetime import UTC, datetime
from pathlib import Path

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

from app.gradcam import generateGradcamDataUrl
from app.model import checkpointDefault, loadModel
from app.quantum import loadQuantumSummary

app = FastAPI(title="jaga-prisma-worker")

CONTRACT_VERSION = "cxr-v1"
SCHEMA_VERSION = "cxr-image-v1"
MODEL_VERSION = "prisma-densenet121-clahe-v1"
COHORT = "tb-chest-radiography-clahe"
THRESHOLD = float(os.getenv("PRISMA_THRESHOLD", "0.5"))
INSPECTION_LABEL = "Model inspection; not a clinical explanation."


def gradcamEnabled() -> bool:
    # Read per-request so PRISMA_GRADCAM can be toggled without code changes.
    return os.getenv("PRISMA_GRADCAM", "true").strip().lower() in ("1", "true", "yes")


LIMITATIONS = [
    "Screening aid only; not a diagnostic test.",
    "Trained on the TB Chest Radiography (CLAHE) cohort; performance varies by source.",
    "A chest X-ray screen does not replace microbiological confirmation.",
]


def artifactRoot() -> Path:
    return Path(os.getenv("PRISMA_ARTIFACT_ROOT", str(Path(__file__).parent / "models"))).resolve()


def bundleDir() -> Path:
    return artifactRoot() / "local_clahe"


def requestId() -> str:
    return "prisma_" + secrets.token_hex(8)


def riskBand(probability: float) -> str:
    if probability < 0.33:
        return "lower"
    if probability < 0.66:
        return "intermediate"
    return "higher"


def nextStep(band: str) -> str:
    if band in ("higher", "intermediate"):
        return (
            "The chest X-ray screen suggests findings that warrant follow-up. Refer for "
            "radiological review and confirmatory TB testing (a WHO-recommended rapid "
            "molecular test such as Xpert)."
        )
    return (
        "The chest X-ray screen did not raise a concern. Continue routine clinical "
        "judgment; if TB symptoms persist, proceed to confirmatory testing."
    )


@app.get("/health")
def health() -> dict[str, object]:
    checkpoint = checkpointDefault(bundleDir())
    return {
        "status": "ok",
        "service": "prisma-worker",
        "timestamp": datetime.now(UTC).isoformat(),
        "artifacts_ready": checkpoint.is_file(),
        "quantum_available": (bundleDir() / "quantum" / "quantum_metrics.json").is_file(),
    }


@app.get("/api/v1/status")
def status() -> dict[str, object]:
    checkpoint = checkpointDefault(bundleDir())
    config = bundleDir() / "resolved_config.yaml"
    quantumDir = bundleDir() / "quantum"
    return {
        "service": "prisma-worker",
        "ready": checkpoint.is_file() and config.is_file(),
        "model_version": MODEL_VERSION,
        "checkpoint_path": str(checkpoint),
        "checkpoint_exists": checkpoint.is_file(),
        "quantum_dir": str(quantumDir),
        "quantum_exists": quantumDir.is_dir(),
    }


@app.get("/api/v1/quantum")
def quantum() -> dict[str, object]:
    """Highlighted quantum-kernel evaluation for the CXR bundle."""
    return loadQuantumSummary(str(bundleDir() / "quantum"))


def buildInspection(model, imageBytes: bytes) -> dict[str, object]:
    """Grad-CAM inspection artifact; must never break a successful classification."""
    if not gradcamEnabled():
        return {"available": False, "label": INSPECTION_LABEL}
    try:
        return {
            "available": True,
            "url": generateGradcamDataUrl(model.model, imageBytes),
            "label": INSPECTION_LABEL,
        }
    except Exception as error:  # noqa: BLE001 - inspection is best-effort by contract
        print(f"gradcam generation failed: {error}", flush=True)
        return {"available": False, "label": INSPECTION_LABEL}


@app.post("/api/v1/cxr")
async def analyzeCxr(image: UploadFile = File(...)) -> JSONResponse:
    checkpoint = checkpointDefault(bundleDir())
    if not checkpoint.is_file():
        return JSONResponse(
            status_code=503,
            content={"status": "error", "message": "model checkpoint is not available"},
        )

    imageBytes = await image.read()
    if not imageBytes:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "image file is empty"},
        )

    try:
        model = loadModel(str(checkpoint), THRESHOLD)
        prediction = model.predict(imageBytes)
    except Exception as error:  # noqa: BLE001 - surface a clean API error
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": f"could not analyze image: {error}"},
        )

    probability = float(prediction["probability"])
    band = riskBand(probability)
    quantumSummary = loadQuantumSummary(str(bundleDir() / "quantum"))

    result = {
        "request_id": requestId(),
        "signal": "prisma",
        "contract_version": CONTRACT_VERSION,
        "schema_version": SCHEMA_VERSION,
        "estimate": {
            "probability": probability,
            "band": band,
            "calibrated": True,
            "calibration_status": "densenet121-clahe-v1",
        },
        "mandatory_next_step": nextStep(band),
        "metadata": {
            "model_version": MODEL_VERSION,
            "contract_version": CONTRACT_VERSION,
            "cohort": COHORT,
            "limitations": LIMITATIONS,
        },
        "inspection": buildInspection(model, imageBytes),
        "quantum": quantumSummary,
    }
    return JSONResponse(content=result)
