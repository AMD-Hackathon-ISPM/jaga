# Retrieval-Augmented TB Chest X-ray Classification

This package is a modular PyTorch research scaffold for tuberculosis chest X-ray classification built around reusable image embeddings.

## Features

- Configuration-driven experiments with YAML
- Interchangeable backbones: DenseNet121, EfficientNet-B0, BiomedCLIP, Rad-DINO
- Unified model outputs with `embedding` and `logits`
- AMP, early stopping, checkpointing, resume support, TensorBoard, optional Weights & Biases
- Weighted BCE and focal loss
- Evaluation with classification, ranking, and confusion-matrix metrics
- Embedding export for downstream retrieval and metric-learning workflows

## Layout

```text
project/
    configs/
    data/
    evaluation/
    models/
    outputs/
    quantum/
    retrieval/
    scripts/
    training/
    utils/
```

## Setup

1. Create a Python environment with Python 3.10+.
2. Install a PyTorch build that matches your hardware target.
3. Install the project dependencies.

```bash
pip install -r requirements.txt
```

## Dataset

Point `dataset.root` in `configs/default.yaml` at a dataset structured as:

```text
dataset/
    train/
        Normal/
        TB/
    val/
        Normal/
        TB/
    test/
        Normal/
        TB/
```

## Train

```bash
python scripts/train.py --config configs/default.yaml
```

## Evaluate

```bash
python scripts/evaluate.py --config configs/default.yaml
```

## Extract embeddings

```bash
python scripts/extract_embeddings.py --config configs/default.yaml
```

## Notes

- Retrieval, FAISS, Grad-CAM, and quantum modules are intentionally scaffolded but not implemented.
- The same training pipeline can switch backbones through `model.name` and related config values only.
