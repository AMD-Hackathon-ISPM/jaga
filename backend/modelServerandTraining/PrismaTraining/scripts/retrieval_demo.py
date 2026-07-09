from __future__ import annotations

import argparse
import sys
from dataclasses import asdict
from pathlib import Path

import numpy as np
import torch
from PIL import Image

PROJECT_PARENT = Path(__file__).resolve().parents[2]
if str(PROJECT_PARENT) not in sys.path:
    sys.path.insert(0, str(PROJECT_PARENT))

from PrismaTraining.data.transforms import build_eval_transform
from PrismaTraining.models.registry import build_model
from PrismaTraining.retrieval.index import RetrievalIndex
from PrismaTraining.retrieval.retrieve import (
    aggregate_retrieval_evidence,
    load_retrieval_assets,
    retrieve_neighbors,
    save_retrieval_outputs,
)
from PrismaTraining.utils.checkpoint import load_checkpoint
from PrismaTraining.utils.config import (
    ExperimentConfig,
    RuntimePaths,
    load_experiment_config,
    resolve_retrieval_paths,
    resolve_runtime_paths,
)
from PrismaTraining.utils.logger import setup_logger
from PrismaTraining.retrieval.retrieve import RetrievalAssets


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', type=str, default='configs/default.yaml')
    parser.add_argument('--query-index', type=int, default=None)
    parser.add_argument('--query-image-path', type=str, default=None)
    parser.add_argument('--checkpoint', type=str, default=None)
    parser.add_argument('--k', type=int, default=None)
    parser.add_argument('--output-name', type=str, default='retrieval_demo')
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.query_index is None and args.query_image_path is None:
        raise ValueError('Provide either --query-index or --query-image-path.')
    if args.query_index is not None and args.query_image_path is not None:
        raise ValueError('Provide only one of --query-index or --query-image-path.')
    project_root = Path(__file__).resolve().parents[1]
    config = load_experiment_config(project_root / args.config)
    runtime_paths = resolve_runtime_paths(project_root, config)
    retrieval_paths = resolve_retrieval_paths(runtime_paths, config)
    logger = setup_logger(runtime_paths.logs_dir / 'retrieval_demo.log')
    assets = load_retrieval_assets(
        embeddings_path=retrieval_paths.embeddings_path,
        labels_path=retrieval_paths.labels_path,
        paths_path=retrieval_paths.paths_path,
        metadata_path=retrieval_paths.metadata_path,
        class_names=config.dataset.class_names,
    )
    index = RetrievalIndex.load(
        path=retrieval_paths.index_path,
        metric=config.retrieval.metric,
        normalized=True,
    )
    query_info, query_embedding, exclude_index = resolve_query(
        args=args,
        config=config,
        assets=assets,
        runtime_paths=runtime_paths,
        logger=logger,
    )
    k = args.k or config.retrieval.k
    neighbors = retrieve_neighbors(
        index=index,
        assets=assets,
        query_embedding=query_embedding,
        k=k,
        exclude_index=exclude_index,
    )
    evidence = aggregate_retrieval_evidence(neighbors, config.dataset.class_names)
    output_prefix = retrieval_paths.output_dir / f'{args.output_name}_{query_info["query_id"]}'
    payload = {
        'query': query_info,
        'retrieval': asdict(evidence),
    }
    json_path, csv_path = save_retrieval_outputs(output_prefix, payload, neighbors)
    logger.info('Saved retrieval JSON to %s', json_path)
    logger.info('Saved retrieval CSV to %s', csv_path)


def resolve_query(
    args: argparse.Namespace,
    config: ExperimentConfig,
    assets: RetrievalAssets,
    runtime_paths: RuntimePaths,
    logger: object,
) -> tuple[dict[str, object], np.ndarray, int | None]:
    if args.query_index is not None:
        query_index = int(args.query_index)
        if query_index < 0 or query_index >= len(assets.embeddings):
            raise IndexError(f'query-index {query_index} is out of bounds for {len(assets.embeddings)} embeddings.')
        query_row = assets.metadata.iloc[query_index].to_dict()
        query_info = {
            'query_id': f'index_{query_index}',
            'query_type': 'embedding_index',
            'query_index': query_index,
            'query_path': str(query_row.get('path', assets.paths[query_index])),
            'query_label': int(query_row.get('label', assets.labels[query_index])),
            'query_label_name': str(query_row.get('label_name', config.dataset.class_names[int(assets.labels[query_index])])),
        }
        return query_info, assets.embeddings[query_index], query_index
    query_image_path = Path(args.query_image_path).resolve()
    checkpoint_path = Path(args.checkpoint).resolve() if args.checkpoint else runtime_paths.checkpoint_dir / 'best.pt'
    query_embedding = extract_query_embedding(
        config=config,
        image_path=query_image_path,
        checkpoint_path=checkpoint_path,
        logger=logger,
    )
    query_info = {
        'query_id': query_image_path.stem,
        'query_type': 'image_path',
        'query_index': None,
        'query_path': str(query_image_path),
        'query_label': None,
        'query_label_name': None,
    }
    return query_info, query_embedding, None


def extract_query_embedding(
    config: ExperimentConfig,
    image_path: Path,
    checkpoint_path: Path,
    logger: object,
) -> np.ndarray:
    if not image_path.exists():
        raise FileNotFoundError(f'Query image not found: {image_path}')
    if not checkpoint_path.exists():
        raise FileNotFoundError(f'Checkpoint not found: {checkpoint_path}')
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model, model_spec = build_model(config.model)
    transform = build_eval_transform(model_spec)
    load_checkpoint(checkpoint_path, model=model, map_location=device)
    model = model.to(device)
    model.eval()
    image = Image.open(image_path).convert('RGB')
    tensor = transform(image).unsqueeze(0).to(device)
    amp_enabled = config.training.amp and device.type == 'cuda'
    with torch.no_grad():
        with torch.autocast(device_type=device.type, enabled=amp_enabled):
            outputs = model(tensor)
    logger.info('Generated query embedding on %s using %s', device, checkpoint_path)
    return outputs.embedding.squeeze(0).detach().cpu().numpy()


if __name__ == '__main__':
    main()
