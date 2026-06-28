from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass
class DatasetConfig:
    root: str
    split_dirs: dict[str, str]
    class_names: list[str]
    file_extensions: list[str]
    max_samples_per_class: int | None = None


@dataclass
class DataloaderConfig:
    train_batch_size: int
    eval_batch_size: int
    num_workers: int
    pin_memory: bool
    persistent_workers: bool
    drop_last: bool


@dataclass
class AugmentationConfig:
    train_resize_scale: list[float]
    horizontal_flip_prob: float
    rotation_degrees: float
    color_jitter_brightness: float
    color_jitter_contrast: float


@dataclass
class ModelConfig:
    name: str
    pretrained: bool
    model_id: str | None
    embedding_dim: int
    dropout: float
    freeze_backbone: bool
    normalize_embeddings: bool
    image_size: int | None
    mean: list[float] | None
    std: list[float] | None


@dataclass
class OptimizerConfig:
    name: str
    lr: float
    weight_decay: float


@dataclass
class SchedulerConfig:
    name: str
    min_lr: float


@dataclass
class LossConfig:
    name: str
    auto_pos_weight: bool
    pos_weight: float | None
    focal_alpha: float
    focal_gamma: float


@dataclass
class TrainingConfig:
    epochs: int
    amp: bool
    early_stopping_patience: int
    monitor: str
    monitor_mode: str
    threshold: float
    grad_clip_norm: float | None


@dataclass
class LoggingConfig:
    use_tensorboard: bool
    use_wandb: bool
    wandb_project: str
    log_every_n_steps: int


@dataclass
class CheckpointConfig:
    resume_path: str | None
    save_best_only: bool


@dataclass
class EvaluationConfig:
    split: str
    save_curves: bool


@dataclass
class EmbeddingConfig:
    splits: list[str]
    normalize: bool
    output_name: str


@dataclass
class RetrievalConfig:
    enabled: bool
    k: int
    metric: str
    index_path: str | None
    embeddings_path: str | None
    labels_path: str | None
    paths_path: str | None
    metadata_path: str | None


@dataclass
class QuantumConfig:
    enabled: bool
    pca_dim: int
    max_samples: int | None
    test_size: float
    random_state: int
    shots: int | None
    n_layers: int
    output_dir: str


@dataclass
class OutputConfig:
    root: str
    experiment_name: str
    run_name: str


@dataclass
class ExperimentConfig:
    seed: int
    deterministic: bool
    dataset: DatasetConfig
    dataloader: DataloaderConfig
    augmentation: AugmentationConfig
    model: ModelConfig
    optimizer: OptimizerConfig
    scheduler: SchedulerConfig
    loss: LossConfig
    training: TrainingConfig
    logging: LoggingConfig
    checkpoint: CheckpointConfig
    evaluation: EvaluationConfig
    embeddings: EmbeddingConfig
    retrieval: RetrievalConfig
    quantum: QuantumConfig
    output: OutputConfig


@dataclass
class RuntimePaths:
    project_root: Path
    output_root: Path
    run_dir: Path
    checkpoint_dir: Path
    tensorboard_dir: Path
    metrics_dir: Path
    embeddings_dir: Path
    retrieval_dir: Path
    quantum_dir: Path
    logs_dir: Path


@dataclass(frozen=True)
class RetrievalPaths:
    index_path: Path
    embeddings_path: Path
    labels_path: Path
    paths_path: Path
    metadata_path: Path
    output_dir: Path


def _load_yaml(path: Path) -> dict[str, Any]:
    with path.open('r', encoding='utf-8') as handle:
        data = yaml.safe_load(handle)
    if not isinstance(data, dict):
        raise ValueError(f'Config file must deserialize to a mapping: {path}')
    return data


def load_experiment_config(path: str | Path) -> ExperimentConfig:
    config_path = Path(path).resolve()
    data = _load_yaml(config_path)
    return ExperimentConfig(
        seed=int(data['seed']),
        deterministic=bool(data['deterministic']),
        dataset=DatasetConfig(**data['dataset']),
        dataloader=DataloaderConfig(**data['dataloader']),
        augmentation=AugmentationConfig(**data['augmentation']),
        model=ModelConfig(**data['model']),
        optimizer=OptimizerConfig(**data['optimizer']),
        scheduler=SchedulerConfig(**data['scheduler']),
        loss=LossConfig(**data['loss']),
        training=TrainingConfig(**data['training']),
        logging=LoggingConfig(**data['logging']),
        checkpoint=CheckpointConfig(**data['checkpoint']),
        evaluation=EvaluationConfig(**data['evaluation']),
        embeddings=EmbeddingConfig(**data['embeddings']),
        retrieval=RetrievalConfig(**data['retrieval']),
        quantum=QuantumConfig(**data['quantum']),
        output=OutputConfig(**data['output']),
    )


def resolve_runtime_paths(project_root: Path, config: ExperimentConfig) -> RuntimePaths:
    output_root = _resolve_path(project_root, config.output.root)
    run_dir = output_root / config.output.experiment_name / config.output.run_name
    paths = RuntimePaths(
        project_root=project_root,
        output_root=output_root,
        run_dir=run_dir,
        checkpoint_dir=run_dir / 'checkpoints',
        tensorboard_dir=run_dir / 'tensorboard',
        metrics_dir=run_dir / 'metrics',
        embeddings_dir=run_dir / 'embeddings',
        retrieval_dir=run_dir / 'retrieval',
        quantum_dir=_resolve_run_subdir(run_dir, config.quantum.output_dir),
        logs_dir=run_dir / 'logs',
    )
    for path in (
        paths.output_root,
        paths.run_dir,
        paths.checkpoint_dir,
        paths.tensorboard_dir,
        paths.metrics_dir,
        paths.embeddings_dir,
        paths.retrieval_dir,
        paths.quantum_dir,
        paths.logs_dir,
    ):
        path.mkdir(parents=True, exist_ok=True)
    return paths


def save_resolved_config(config: ExperimentConfig, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', encoding='utf-8') as handle:
        yaml.safe_dump(asdict(config), handle, sort_keys=False)


def _resolve_path(project_root: Path, raw_path: str) -> Path:
    path = Path(raw_path)
    if path.is_absolute():
        return path
    return (project_root / path).resolve()


def resolve_retrieval_paths(runtime_paths: RuntimePaths, config: ExperimentConfig) -> RetrievalPaths:
    embedding_root = runtime_paths.embeddings_dir / config.embeddings.output_name
    output_dir = runtime_paths.retrieval_dir
    return RetrievalPaths(
        index_path=_resolve_optional_path(runtime_paths.project_root, config.retrieval.index_path, output_dir / 'faiss.index'),
        embeddings_path=_resolve_optional_path(runtime_paths.project_root, config.retrieval.embeddings_path, embedding_root / 'embeddings.npy'),
        labels_path=_resolve_optional_path(runtime_paths.project_root, config.retrieval.labels_path, embedding_root / 'labels.npy'),
        paths_path=_resolve_optional_path(runtime_paths.project_root, config.retrieval.paths_path, embedding_root / 'paths.npy'),
        metadata_path=_resolve_optional_path(runtime_paths.project_root, config.retrieval.metadata_path, embedding_root / 'metadata.csv'),
        output_dir=output_dir,
    )


def _resolve_optional_path(project_root: Path, raw_path: str | None, default_path: Path) -> Path:
    if raw_path is None:
        return default_path
    return _resolve_path(project_root, raw_path)


def _resolve_run_subdir(run_dir: Path, raw_path: str) -> Path:
    path = Path(raw_path)
    if path.is_absolute():
        return path
    return (run_dir / path).resolve()
