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
- FAISS-based retrieval over saved embeddings with evidence aggregation

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

## Build retrieval index

```bash
python scripts/build_index.py --config configs/default.yaml
```

## Retrieval demo

Query by saved embedding index:

```bash
python scripts/retrieval_demo.py --config configs/default.yaml --query-index 0
```

Query by image path if a checkpoint is available:

```bash
python scripts/retrieval_demo.py --config configs/default.yaml --query-image-path /path/to/image.png --checkpoint /path/to/best.pt
```

The retrieval demo saves a JSON summary and a CSV neighbor table under the run's `retrieval/` directory.

## Local Docker only

Dockerfiles in this folder are for local validation only.

CPU smoke test:

```bash
docker build -t jaga-tb-cxr-smoke .
docker run --rm jaga-tb-cxr-smoke
```

CUDA smoke test against the local `CLAHE` split dataset:

```bash
docker build -f Dockerfile.cuda -t jaga-tb-cxr-cuda .
docker run --rm --gpus all -v "${PWD}:/app/project" -w /app/project jaga-tb-cxr-cuda python scripts/train.py --config configs/local_cuda_smoke.yaml
docker run --rm --gpus all -v "${PWD}:/app/project" -w /app/project jaga-tb-cxr-cuda python scripts/evaluate.py --config configs/local_cuda_smoke.yaml
docker run --rm --gpus all -v "${PWD}:/app/project" -w /app/project jaga-tb-cxr-cuda python scripts/extract_embeddings.py --config configs/local_cuda_smoke.yaml
docker run --rm -v "${PWD}:/app/project" -w /app/project jaga-tb-cxr-cuda python scripts/build_index.py --config configs/local_cuda_smoke.yaml
docker run --rm -v "${PWD}:/app/project" -w /app/project jaga-tb-cxr-cuda python scripts/retrieval_demo.py --config configs/local_cuda_smoke.yaml --query-index 0
```

For a fuller local run against the same dataset layout, use `configs/local_clahe.yaml`.

## Runpod manual training

Runpod does not need these Dockerfiles. From the project root on the pod:

```bash
cd backend/python/project
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python scripts/train.py --config configs/local_clahe.yaml
python scripts/evaluate.py --config configs/local_clahe.yaml
python scripts/extract_embeddings.py --config configs/local_clahe.yaml
python scripts/build_index.py --config configs/local_clahe.yaml
python scripts/retrieval_demo.py --config configs/local_clahe.yaml --query-index 0
```

If your Runpod dataset path differs, copy `configs/local_clahe.yaml` and update `dataset.root`.

Or use the bundled shell script to download the Kaggle dataset into `data/` and start training:

```bash
cd backend/python/project
chmod +x scripts/download_and_train.sh
export KAGGLE_USERNAME='your_kaggle_username'
export KAGGLE_KEY='your_kaggle_key'
./scripts/download_and_train.sh configs/local_clahe.yaml
```

To run evaluation, embedding extraction, and FAISS index building after training in the same script:

```bash
RUN_FULL_PIPELINE=1 ./scripts/download_and_train.sh configs/local_clahe.yaml
```

## Notes

- Grad-CAM and quantum modules are intentionally scaffolded but not implemented.
- The same training pipeline can switch backbones through `model.name` and related config values only.
