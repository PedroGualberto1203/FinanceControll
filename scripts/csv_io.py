from __future__ import annotations

import csv
from io import StringIO
from pathlib import Path

from sqlite_schema import collection_schema, columns_for, coerce_value


def read_collection_csv(data_dir: Path, collection: str) -> list[dict]:
    schema = collection_schema(collection)
    path = data_dir / schema["file"]
    if not path.exists():
        return []

    return parse_csv_text(collection, path.read_text(encoding="utf-8-sig"))


def parse_csv_text(collection: str, text: str) -> list[dict]:
    columns = columns_for(collection)
    source = text if text and text.strip() else ";".join(columns)
    reader = csv.DictReader(StringIO(source), delimiter=";")

    if reader.fieldnames is None:
        return []

    missing_columns = [column for column in columns if column not in reader.fieldnames]
    if missing_columns:
        raise ValueError(f"CSV {collection} sem colunas obrigatorias: {', '.join(missing_columns)}")

    rows = []
    for row in reader:
        if not row or all(not str(value or "").strip() for value in row.values()):
            continue

        rows.append({column: coerce_value(collection, column, row.get(column, "")) for column in columns})

    return rows


def serialize_csv_text(collection: str, rows: list[dict]) -> str:
    columns = columns_for(collection)
    buffer = StringIO()
    writer = csv.DictWriter(buffer, fieldnames=columns, delimiter=";", lineterminator="\n")
    writer.writeheader()
    for row in rows:
        writer.writerow({column: row.get(column, "") for column in columns})
    return buffer.getvalue()
