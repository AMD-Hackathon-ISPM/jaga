"""Region-occlusion ablation for the Prisma TB classifier.

Answers one question: *which part of the image is actually driving the TB
score?* We take the exact serving preprocess (CLAHE -> resize -> normalize),
then zero out a rectangular region of the normalized 224x224 tensor (zero == the
per-channel ImageNet mean, i.e. neutral gray) and re-run the model. A large
probability drop when a region is blanked means the model *needs* that region to
call TB.

This is the causal companion to the Grad-CAM overlay: Grad-CAM shows where the
gradient concentrates; this shows what the decision actually depends on.

Run from the PrismaServer directory:
    python -m tools.occlusion_ablation path/to/cxr.png [more.png ...]
"""

from __future__ import annotations

import sys
from pathlib import Path

import torch

from app.model import IMAGE_SIZE, checkpointDefault, loadModel, preprocess

# (name, row0, row1, col0, col1) as fractions of the 224x224 tensor.
# "hot" regions are what the CAM keeps highlighting; the rest are controls.
REGIONS: list[tuple[str, float, float, float, float]] = [
    ("bottom band (hot)",       0.80, 1.00, 0.00, 1.00),
    ("bottom-left corner (hot)", 0.72, 1.00, 0.00, 0.32),
    ("bottom-right corner (hot)",0.72, 1.00, 0.68, 1.00),
    ("upper zones (TB home)",   0.12, 0.45, 0.10, 0.90),
    ("mid zones",               0.40, 0.70, 0.10, 0.90),
    ("top band (control)",      0.00, 0.20, 0.00, 1.00),
    ("center (control)",        0.35, 0.65, 0.35, 0.65),
]


def occlude(tensor: torch.Tensor, box: tuple[float, float, float, float]) -> torch.Tensor:
    """Return a copy of the tensor with the fractional box set to 0 (neutral gray)."""
    r0, r1, c0, c1 = box
    out = tensor.clone()
    y0, y1 = int(r0 * IMAGE_SIZE), int(r1 * IMAGE_SIZE)
    x0, x1 = int(c0 * IMAGE_SIZE), int(c1 * IMAGE_SIZE)
    out[:, :, y0:y1, x0:x1] = 0.0
    return out


@torch.no_grad()
def probability(model, tensor: torch.Tensor) -> float:
    return torch.sigmoid(model.model(tensor)).item()


def run(imagePath: Path, model) -> None:
    imageBytes = imagePath.read_bytes()
    tensor = preprocess(imageBytes)
    baseline = probability(model, tensor)

    print(f"\n{imagePath.name}")
    print(f"  baseline TB probability: {baseline:.4f}")
    print(f"  {'region':<28} {'prob':>8} {'delta':>9}  (blanked)")
    print(f"  {'-' * 28} {'-' * 8} {'-' * 9}")
    for name, *box in REGIONS:
        prob = probability(model, occlude(tensor, tuple(box)))
        delta = prob - baseline
        flag = "  <-- decisive" if delta <= -0.25 else ""
        print(f"  {name:<28} {prob:>8.4f} {delta:>+9.4f}{flag}")


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 2

    checkpoint = checkpointDefault(Path("app/models/local_clahe"))
    if not checkpoint.is_file():
        print(f"checkpoint not found: {checkpoint}", file=sys.stderr)
        return 1
    model = loadModel(str(checkpoint))

    for arg in argv:
        path = Path(arg)
        if not path.is_file():
            print(f"skip (not a file): {path}", file=sys.stderr)
            continue
        run(path, model)

    print(
        "\nReading it: a large negative delta on a 'hot' region means the model "
        "leans on that area to call TB. If 'bottom band' is decisive while "
        "'upper zones' barely moves the score, the model is not reading TB "
        "pathology -- it is keying on the lower zone."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
