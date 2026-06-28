from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

import yaml
from PIL import Image, ImageDraw


def main() -> None:
    project_root = Path(__file__).resolve().parents[1]
    runtime_root = project_root / 'outputs' / 'smoke_test'
    dataset_root = runtime_root / 'dataset'
    config_path = runtime_root / 'smoke.yaml'
    if runtime_root.exists():
        shutil.rmtree(runtime_root)
    dataset_root.mkdir(parents=True, exist_ok=True)
    _create_synthetic_dataset(dataset_root)
    config = _build_smoke_config(project_root, dataset_root, runtime_root)
    config_path.parent.mkdir(parents=True, exist_ok=True)
    with config_path.open('w', encoding='utf-8') as handle:
        yaml.safe_dump(config, handle, sort_keys=False)
    _run_command([sys.executable, 'scripts/train.py', '--config', str(config_path)], project_root)
    _run_command([sys.executable, 'scripts/evaluate.py', '--config', str(config_path)], project_root)
    _run_command([sys.executable, 'scripts/extract_embeddings.py', '--config', str(config_path)], project_root)
    _assert_exists(runtime_root / 'runs' / 'docker_smoke' / 'densenet121_cpu' / 'checkpoints' / 'best.pt')
    _assert_exists(runtime_root / 'runs' / 'docker_smoke' / 'densenet121_cpu' / 'metrics' / 'test_metrics.json')
    _assert_exists(runtime_root / 'runs' / 'docker_smoke' / 'densenet121_cpu' / 'embeddings' / 'smoke' / 'embeddings.npy')
    _assert_exists(runtime_root / 'runs' / 'docker_smoke' / 'densenet121_cpu' / 'embeddings' / 'smoke' / 'labels.npy')
    _assert_exists(runtime_root / 'runs' / 'docker_smoke' / 'densenet121_cpu' / 'embeddings' / 'smoke' / 'paths.npy')
    _assert_exists(runtime_root / 'runs' / 'docker_smoke' / 'densenet121_cpu' / 'embeddings' / 'smoke' / 'metadata.csv')
    print('Smoke test completed successfully.')


def _build_smoke_config(project_root: Path, dataset_root: Path, runtime_root: Path) -> dict[str, object]:
    config_path = project_root / 'configs' / 'default.yaml'
    with config_path.open('r', encoding='utf-8') as handle:
        config = yaml.safe_load(handle)
    config['dataset']['root'] = str(dataset_root)
    config['dataloader']['train_batch_size'] = 2
    config['dataloader']['eval_batch_size'] = 2
    config['dataloader']['num_workers'] = 0
    config['dataloader']['persistent_workers'] = False
    config['model']['name'] = 'densenet121'
    config['model']['pretrained'] = False
    config['model']['embedding_dim'] = 32
    config['optimizer']['lr'] = 0.0005
    config['training']['epochs'] = 1
    config['training']['amp'] = False
    config['training']['early_stopping_patience'] = 1
    config['training']['monitor'] = 'loss'
    config['training']['monitor_mode'] = 'min'
    config['logging']['use_tensorboard'] = False
    config['logging']['use_wandb'] = False
    config['evaluation']['save_curves'] = False
    config['embeddings']['output_name'] = 'smoke'
    config['output']['root'] = str(runtime_root / 'runs')
    config['output']['experiment_name'] = 'docker_smoke'
    config['output']['run_name'] = 'densenet121_cpu'
    return config


def _create_synthetic_dataset(dataset_root: Path) -> None:
    splits = {'train': 4, 'val': 2, 'test': 2}
    for split, samples_per_class in splits.items():
        for class_name in ('Normal', 'TB'):
            class_dir = dataset_root / split / class_name
            class_dir.mkdir(parents=True, exist_ok=True)
            for index in range(samples_per_class):
                image = _make_image(class_name, index)
                image.save(class_dir / f'{class_name.lower()}_{index}.png')


def _make_image(class_name: str, index: int) -> Image.Image:
    image = Image.new('RGB', (128, 128), color=(30, 30, 30) if class_name == 'Normal' else (200, 200, 200))
    drawer = ImageDraw.Draw(image)
    if class_name == 'Normal':
        drawer.ellipse((24 + index, 24, 104, 104), outline=(90, 120, 180), width=4)
    else:
        drawer.line((20, 20 + index * 3, 108, 108 - index * 3), fill=(180, 40, 40), width=6)
        drawer.rectangle((28, 28, 100, 100), outline=(120, 20, 20), width=3)
    return image


def _run_command(command: list[str], project_root: Path) -> None:
    subprocess.run(command, cwd=project_root, check=True)


def _assert_exists(path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(f'Expected smoke-test artifact was not created: {path}')


if __name__ == '__main__':
    main()
