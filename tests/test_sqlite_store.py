import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from sqlite_schema import COLLECTIONS, COLLECTION_SCHEMAS, create_table_sql
from sqlite_store import FinanceStore, StoreError


class FinanceStoreTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        write_csv_seed(
            self.root,
            {
                "categorias": [
                    {
                        "id": "cat-seed",
                        "nome": "Internet",
                        "tipo": "fixa",
                        "parcelas_padrao": "1",
                        "ativo": "true",
                        "criado_em": "2026-01-01",
                    }
                ]
            },
        )
        self.store = FinanceStore(self.root)
        self.store.initialize()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_initializes_schema_and_seeds_csv(self):
        data = self.store.get_all()

        self.assertTrue((self.root / "storage" / "financecontroll.sqlite3").exists())
        self.assertEqual(data["categorias"][0]["id"], "cat-seed")
        self.assertEqual(data["categorias"][0]["parcelas_padrao"], 1)
        self.assertEqual(self.store.health()["schemaVersion"], 2)

    def test_crud_and_duplicate_id_errors(self):
        row = {
            "id": "ent-1",
            "ano": 2026,
            "mes": 6,
            "descricao": "Salario",
            "tipo": "fixa",
            "valor_centavos": 100000,
            "criado_em": "2026-06-01",
            "atualizado_em": "2026-06-01",
        }

        self.assertEqual(self.store.insert("entradas", row)["valor_centavos"], 100000)

        with self.assertRaises(StoreError) as duplicate:
            self.store.insert("entradas", row)
        self.assertEqual(duplicate.exception.status, 409)

        updated = self.store.update("entradas", "ent-1", {"descricao": "Salario atualizado", "id": "ent-1"})
        self.assertEqual(updated["descricao"], "Salario atualizado")

        self.store.delete("entradas", "ent-1")
        self.assertEqual(self.store.get_collection("entradas"), [])

    def test_replace_rolls_back_when_insert_fails(self):
        original = {
            "id": "dst-original",
            "nome": "Conta",
            "tipo": "conta",
            "limite_centavos": 0,
            "ativo": "true",
            "criado_em": "2026-01-01",
        }
        self.store.insert("destinos", original)

        duplicate_rows = [
            {
                "id": "dst-new",
                "nome": "Cartao",
                "tipo": "cartao",
                "limite_centavos": 10000,
                "ativo": "true",
                "criado_em": "2026-01-02",
            },
            {
                "id": "dst-new",
                "nome": "Cartao duplicado",
                "tipo": "cartao",
                "limite_centavos": 20000,
                "ativo": "true",
                "criado_em": "2026-01-03",
            },
        ]

        with self.assertRaises(StoreError) as duplicate:
            self.store.replace("destinos", duplicate_rows)

        self.assertEqual(duplicate.exception.status, 409)
        self.assertEqual(self.store.get_collection("destinos"), [original])

    def test_invalid_collection_and_payload_errors(self):
        with self.assertRaises(StoreError) as unknown:
            self.store.get_collection("inexistente")
        self.assertEqual(unknown.exception.status, 404)

        with self.assertRaises(StoreError) as invalid_number:
            self.store.insert(
                "entradas",
                {
                    "id": "ent-invalid",
                    "ano": "dois-mil-e-vinte-seis",
                    "mes": 6,
                    "descricao": "Salario",
                    "tipo": "fixa",
                    "valor_centavos": 100000,
                    "criado_em": "2026-06-01",
                    "atualizado_em": "2026-06-01",
                },
            )
        self.assertEqual(invalid_number.exception.status, 400)

    def test_replace_many_is_atomic(self):
        self.store.insert(
            "entradas",
            {
                "id": "ent-original",
                "ano": 2026,
                "mes": 6,
                "descricao": "Original",
                "tipo": "fixa",
                "valor_centavos": 1000,
                "criado_em": "2026-06-01",
                "atualizado_em": "2026-06-01",
            },
        )

        with self.assertRaises(StoreError):
            self.store.replace_many(
                {
                    "entradas": [
                        {
                            "id": "ent-new",
                            "ano": 2026,
                            "mes": 7,
                            "descricao": "Nova",
                            "tipo": "fixa",
                            "valor_centavos": 2000,
                            "criado_em": "2026-07-01",
                            "atualizado_em": "2026-07-01",
                        },
                        {
                            "id": "ent-new",
                            "ano": 2026,
                            "mes": 8,
                            "descricao": "Duplicada",
                            "tipo": "fixa",
                            "valor_centavos": 3000,
                            "criado_em": "2026-08-01",
                            "atualizado_em": "2026-08-01",
                        },
                    ],
                    "categorias": [],
                }
            )

        entradas = self.store.get_collection("entradas")
        self.assertEqual(len(entradas), 1)
        self.assertEqual(entradas[0]["id"], "ent-original")
        self.assertEqual(self.store.get_collection("categorias")[0]["id"], "cat-seed")

    def test_monthly_control_collections_crud(self):
        category = {
            "id": "cmc-1",
            "nome": "Farmacia",
            "ativo": "true",
            "criado_em": "2026-06-01",
            "atualizado_em": "2026-06-01",
        }
        expense = {
            "id": "cmg-1",
            "descricao": "Remedio",
            "categoria_id": "cmc-1",
            "data_gasto": "2026-06-05",
            "ano": 2026,
            "mes": 6,
            "fonte": "credito",
            "valor_centavos": 3000,
            "observacao": "Controle do mes",
            "criado_em": "2026-06-05",
            "atualizado_em": "2026-06-05",
        }

        self.assertEqual(self.store.insert("controle_mensal_categorias", category), category)
        self.assertEqual(self.store.insert("controle_mensal_gastos", expense), expense)

        updated = self.store.update("controle_mensal_gastos", "cmg-1", {"valor_centavos": "4500"})
        self.assertEqual(updated["valor_centavos"], 4500)

        self.store.delete("controle_mensal_gastos", "cmg-1")
        self.assertEqual(self.store.get_collection("controle_mensal_gastos"), [])

    def test_migrates_v1_database_to_monthly_control_schema(self):
        self.temp_dir.cleanup()
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        storage_dir = self.root / "storage"
        storage_dir.mkdir(parents=True)
        db_path = storage_dir / "financecontroll.sqlite3"

        connection = sqlite3.connect(db_path)
        try:
            connection.execute("CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)")
            for collection in (
                "entradas",
                "gastos",
                "categorias",
                "destinos",
                "recorrencias_fixas",
            ):
                connection.execute(create_table_sql(collection))
            connection.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                (1, "2026-06-01"),
            )
            connection.execute(
                'INSERT INTO "entradas" '
                "(id, ano, mes, descricao, tipo, valor_centavos, criado_em, atualizado_em) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                ("ent-v1", 2026, 6, "Salario", "fixa", 100000, "2026-06-01", "2026-06-01"),
            )
            connection.commit()
        finally:
            connection.close()

        self.store = FinanceStore(self.root)
        self.store.initialize()

        self.assertEqual(self.store.health()["schemaVersion"], 2)
        self.assertEqual(self.store.get_collection("entradas")[0]["id"], "ent-v1")
        self.assertEqual(self.store.get_collection("controle_mensal_gastos"), [])
        self.assertEqual(self.store.get_collection("controle_mensal_categorias"), [])


def write_csv_seed(root: Path, rows_by_collection: dict[str, list[dict]]) -> None:
    data_dir = root / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    for collection in COLLECTIONS:
        schema = COLLECTION_SCHEMAS[collection]
        columns = schema["columns"]
        rows = rows_by_collection.get(collection, [])
        lines = [";".join(columns)]
        for row in rows:
            lines.append(";".join(str(row.get(column, "")) for column in columns))
        (data_dir / schema["file"]).write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
