from __future__ import annotations

from pathlib import Path
import re

import pandas as pd


DATA_DIR = Path(__file__).resolve().parent / 'data'
OUTPUT_FILE = DATA_DIR / 'merged.csv'
MERGE_KEY = 'participant'


def to_camel_case(value: str) -> str:
	parts = re.split(r'[^0-9a-zA-Z]+', value.strip())
	parts = [part for part in parts if part]
	if not parts:
		return value

	first_part = parts[0].lower()
	rest_parts = [part[:1].upper() + part[1:].lower() for part in parts[1:]]
	return first_part + ''.join(rest_parts)


def camelcase_columns(frame: pd.DataFrame) -> pd.DataFrame:
	frame = frame.copy()
	frame.columns = [MERGE_KEY if column == MERGE_KEY else to_camel_case(column) for column in frame.columns]
	return frame


def load_csv(file_name: str) -> pd.DataFrame:
	return camelcase_columns(pd.read_csv(DATA_DIR / file_name))


def aggregate_solicited_data(solicited: pd.DataFrame) -> pd.DataFrame:
	if solicited.empty:
		return solicited

	return (
		solicited.groupby(MERGE_KEY, as_index=False)
		.agg(
			filenames=('filename', lambda values: ';'.join(sorted(values.dropna().astype(str).unique()))),
			soundPredictionScoreCount=('soundPredictionScore', 'count'),
			soundPredictionScoreMean=('soundPredictionScore', 'mean'),
			soundPredictionScoreMin=('soundPredictionScore', 'min'),
			soundPredictionScoreMax=('soundPredictionScore', 'max'),
		)
	)


def main() -> None:
	primary = load_csv('primary.csv')
	additional = load_csv('additional.csv')
	solicited = load_csv('solicited.csv')

	merged = primary.merge(additional, on=MERGE_KEY, how='outer')
	solicited_summary = aggregate_solicited_data(solicited)

	if not solicited_summary.empty:
		merged = merged.merge(solicited_summary, on=MERGE_KEY, how='left')

	merged.to_csv(OUTPUT_FILE, index=False)
	print(f'Wrote {OUTPUT_FILE}')


if __name__ == '__main__':
	main()
