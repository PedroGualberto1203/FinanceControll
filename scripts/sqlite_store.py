from __future__ import annotations

from contextlib import contextmanager
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

from csv_io import read_collection_csv
from sqlite_schema import (
    COLLECTIONS,
    INDEX_SQL,
    SCHEMA_VERSION,
    collection_schema,
    columns_for,
    coerce_value,
    create_table_sql,
    quote_identifier,
)


class StoreError(Exception):
    def __init__(self, code: str, message: str, status: int = 400):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status


class FinanceStore:
    def __init__(self, project_root: Path | str):
        self.project_root = Path(project_root)
        self.storage_dir = self.project_root / "storage"
        self.data_dir = self.project_root / "data"
        self.db_path = self.storage_dir / "financecontroll.sqlite3"

    def initialize(self) -> None:
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        previous_version = self._read_schema_version()
        if self.db_path.exists() and self.db_path.stat().st_size > 0 and previous_version < SCHEMA_VERSION:
            self._backup_database()

        with self._connection() as connection:
            self._apply_migrations(connection, previous_version)
            if self._database_is_empty(connection):
                with connection:
                    self._seed_from_csv(connection)

    def health(self) -> dict:
        with self._connection() as connection:
            version = self._current_schema_version(connection)
            connection.execute("SELECT 1").fetchone()

        return {
            "database": "sqlite",
            "status": "ok",
            "schemaVersion": version,
            "path": str(self.db_path),
        }

    def get_all(self) -> dict[str, list[dict]]:
        with self._connection() as connection:
            return self._get_all(connection)

    def get_collection(self, collection: str) -> list[dict]:
        self._ensure_collection(collection)
        with self._connection() as connection:
            return self._fetch_collection(connection, collection)

    def insert(self, collection: str, row: dict) -> dict:
        self._ensure_collection(collection)
        normalized = self._normalize_row(collection, row)
        with self._connection() as connection:
            try:
                with connection:
                    self._insert_normalized_row(connection, collection, normalized)
            except sqlite3.IntegrityError as exc:
                raise StoreError("duplicate_id", "Ja existe um registro com este id.", 409) from exc
        return normalized

    def insert_many(self, collection: str, rows: list[dict]) -> list[dict]:
        self._ensure_collection(collection)
        if not isinstance(rows, list):
            raise StoreError("invalid_payload", "Bulk precisa receber uma lista de registros.", 400)

        normalized_rows = [self._normalize_row(collection, row) for row in rows]
        with self._connection() as connection:
            try:
                with connection:
                    for row in normalized_rows:
                        self._insert_normalized_row(connection, collection, row)
            except sqlite3.IntegrityError as exc:
                raise StoreError("duplicate_id", "Ja existe um registro com este id.", 409) from exc
        return normalized_rows

    def replace(self, collection: str, rows: list[dict]) -> list[dict]:
        self._ensure_collection(collection)
        if not isinstance(rows, list):
            raise StoreError("invalid_payload", "Replace precisa receber uma lista de registros.", 400)

        normalized_rows = [self._normalize_row(collection, row) for row in rows]
        with self._connection() as connection:
            try:
                with connection:
                    connection.execute(f"DELETE FROM {quote_identifier(collection)}")
                    for row in normalized_rows:
                        self._insert_normalized_row(connection, collection, row)
            except sqlite3.IntegrityError as exc:
                raise StoreError("duplicate_id", "A lista contem ids duplicados.", 409) from exc
            return self._fetch_collection(connection, collection)

    def replace_many(self, data: dict[str, list[dict]]) -> dict[str, list[dict]]:
        if not isinstance(data, dict):
            raise StoreError("invalid_payload", "Payload precisa ser um objeto com colecoes.", 400)

        normalized_by_collection = {}
        for collection, rows in data.items():
            self._ensure_collection(collection)
            if not isinstance(rows, list):
                raise StoreError("invalid_payload", f"Colecao {collection} precisa ser uma lista.", 400)
            normalized_by_collection[collection] = [self._normalize_row(collection, row) for row in rows]

        with self._connection() as connection:
            try:
                with connection:
                    for collection, rows in normalized_by_collection.items():
                        connection.execute(f"DELETE FROM {quote_identifier(collection)}")
                        for row in rows:
                            self._insert_normalized_row(connection, collection, row)
            except sqlite3.IntegrityError as exc:
                raise StoreError("duplicate_id", "Uma colecao contem ids duplicados.", 409) from exc
            return self._get_all(connection)

    def update(self, collection: str, row_id: str, patch: dict) -> dict:
        self._ensure_collection(collection)
        if not row_id:
            raise StoreError("invalid_payload", "Id do registro e obrigatorio.", 400)

        normalized_patch = self._normalize_patch(collection, row_id, patch)
        if not normalized_patch:
            return self._get_existing_row(collection, row_id)

        assignments = ", ".join(f"{quote_identifier(column)} = ?" for column in normalized_patch)
        values = list(normalized_patch.values()) + [row_id]

        with self._connection() as connection:
            with connection:
                cursor = connection.execute(
                    f"UPDATE {quote_identifier(collection)} SET {assignments} WHERE id = ?",
                    values,
                )
                if cursor.rowcount == 0:
                    raise StoreError("not_found", "Registro nao encontrado.", 404)
            return self._fetch_one(connection, collection, row_id)

    def delete(self, collection: str, row_id: str) -> None:
        self._ensure_collection(collection)
        if not row_id:
            raise StoreError("invalid_payload", "Id do registro e obrigatorio.", 400)

        with self._connection() as connection:
            with connection:
                cursor = connection.execute(f"DELETE FROM {quote_identifier(collection)} WHERE id = ?", (row_id,))
                if cursor.rowcount == 0:
                    raise StoreError("not_found", "Registro nao encontrado.", 404)

    def _connect(self) -> sqlite3.Connection:
        try:
            connection = sqlite3.connect(self.db_path, timeout=5)
            connection.row_factory = sqlite3.Row
            connection.execute("PRAGMA busy_timeout = 5000")
            connection.execute("PRAGMA journal_mode = WAL")
            return connection
        except sqlite3.OperationalError as exc:
            raise self._operational_error(exc) from exc

    @contextmanager
    def _connection(self):
        connection = self._connect()
        try:
            yield connection
        finally:
            connection.close()

    def _read_schema_version(self) -> int:
        if not self.db_path.exists() or self.db_path.stat().st_size == 0:
            return 0

        try:
            connection = sqlite3.connect(self.db_path, timeout=5)
            try:
                cursor = connection.execute(
                    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'"
                )
                if cursor.fetchone() is None:
                    return 0
                row = connection.execute("SELECT MAX(version) AS version FROM schema_migrations").fetchone()
                return int(row[0] or 0)
            finally:
                connection.close()
        except sqlite3.Error:
            return 0

    def _backup_database(self) -> None:
        stamp = datetime.now().strftime("%Y%m%d%H%M%S")
        backup_path = self.db_path.with_name(f"{self.db_path.name}.bak-{stamp}")
        shutil.copy2(self.db_path, backup_path)

        for suffix in ("-wal", "-shm"):
            sidecar = Path(str(self.db_path) + suffix)
            if sidecar.exists():
                shutil.copy2(sidecar, Path(str(backup_path) + suffix))

    def _apply_migrations(self, connection: sqlite3.Connection, previous_version: int) -> None:
        with connection:
            connection.execute(
                "CREATE TABLE IF NOT EXISTS schema_migrations "
                "(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)"
            )

            if previous_version < 1:
                for collection in COLLECTIONS:
                    connection.execute(create_table_sql(collection))
                for statement in INDEX_SQL:
                    connection.execute(statement)
                connection.execute(
                    "INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                    (1, datetime.now().isoformat(timespec="seconds")),
                )

<<<<<<< HEAD
            if previous_version < 2:
                for collection in ("controle_mensal_gastos", "controle_mensal_categorias"):
                    connection.execute(create_table_sql(collection))
                for statement in INDEX_SQL:
                    connection.execute(statement)
                connection.execute(
                    "INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                    (2, datetime.now().isoformat(timespec="seconds")),
                )

=======
>>>>>>> origin/main
    def _current_schema_version(self, connection: sqlite3.Connection) -> int:
        row = connection.execute("SELECT MAX(version) AS version FROM schema_migrations").fetchone()
        return int(row["version"] or 0)

    def _database_is_empty(self, connection: sqlite3.Connection) -> bool:
        for collection in COLLECTIONS:
            row = connection.execute(f"SELECT COUNT(*) AS total FROM {quote_identifier(collection)}").fetchone()
            if int(row["total"]) > 0:
                return False
        return True

    def _seed_from_csv(self, connection: sqlite3.Connection) -> None:
        for collection in COLLECTIONS:
            rows = [self._normalize_row(collection, row) for row in read_collection_csv(self.data_dir, collection)]
            for row in rows:
                self._insert_normalized_row(connection, collection, row)

    def _get_all(self, connection: sqlite3.Connection) -> dict[str, list[dict]]:
        return {collection: self._fetch_collection(connection, collection) for collection in COLLECTIONS}

    def _fetch_collection(self, connection: sqlite3.Connection, collection: str) -> list[dict]:
        rows = connection.execute(f"SELECT * FROM {quote_identifier(collection)} ORDER BY rowid").fetchall()
        return [self._row_to_dict(collection, row) for row in rows]

    def _fetch_one(self, connection: sqlite3.Connection, collection: str, row_id: str) -> dict:
        row = connection.execute(f"SELECT * FROM {quote_identifier(collection)} WHERE id = ?", (row_id,)).fetchone()
        if row is None:
            raise StoreError("not_found", "Registro nao encontrado.", 404)
        return self._row_to_dict(collection, row)

    def _get_existing_row(self, collection: str, row_id: str) -> dict:
        with self._connection() as connection:
            return self._fetch_one(connection, collection, row_id)

    def _insert_normalized_row(self, connection: sqlite3.Connection, collection: str, row: dict) -> None:
        columns = columns_for(collection)
        quoted_columns = ", ".join(quote_identifier(column) for column in columns)
        placeholders = ", ".join("?" for _ in columns)
        values = [row[column] for column in columns]
        connection.execute(
            f"INSERT INTO {quote_identifier(collection)} ({quoted_columns}) VALUES ({placeholders})",
            values,
        )

    def _normalize_row(self, collection: str, row: dict) -> dict:
        if not isinstance(row, dict):
            raise StoreError("invalid_payload", "Registro precisa ser um objeto.", 400)

        columns = columns_for(collection)
        unknown_columns = [column for column in row if column not in columns]
        if unknown_columns:
            raise StoreError("invalid_payload", f"Colunas desconhecidas: {', '.join(unknown_columns)}", 400)

        normalized = {}
        for column in columns:
            try:
                normalized[column] = coerce_value(collection, column, row.get(column, ""))
            except ValueError as exc:
                raise StoreError("invalid_payload", f"Campo {column}: {exc}", 400) from exc

        if not normalized["id"].strip():
            raise StoreError("invalid_payload", "Id do registro e obrigatorio.", 400)

        return normalized

    def _normalize_patch(self, collection: str, row_id: str, patch: dict) -> dict:
        if not isinstance(patch, dict):
            raise StoreError("invalid_payload", "Patch precisa ser um objeto.", 400)

        columns = columns_for(collection)
        normalized = {}
        for column, value in patch.items():
            if column not in columns:
                raise StoreError("invalid_payload", f"Coluna desconhecida: {column}", 400)

            if column == "id":
                if str(value) != str(row_id):
                    raise StoreError("invalid_payload", "Id do registro nao pode ser alterado.", 400)
                continue

            try:
                normalized[column] = coerce_value(collection, column, value)
            except ValueError as exc:
                raise StoreError("invalid_payload", f"Campo {column}: {exc}", 400) from exc

        return normalized

    def _row_to_dict(self, collection: str, row: sqlite3.Row) -> dict:
        return {column: row[column] for column in columns_for(collection)}

    def _ensure_collection(self, collection: str) -> None:
        try:
            collection_schema(collection)
        except KeyError as exc:
            raise StoreError("unknown_collection", "Colecao inexistente.", 404) from exc

    def _operational_error(self, exc: sqlite3.OperationalError) -> StoreError:
        text = str(exc).lower()
        if "locked" in text or "busy" in text:
            return StoreError("database_busy", "Banco SQLite ocupado. Tente novamente em instantes.", 503)
        return StoreError("database_error", "Falha ao acessar o banco SQLite.", 500)
