from __future__ import annotations

import math


SCHEMA_VERSION = 2


COLLECTION_SCHEMAS = {
    "entradas": {
        "file": "entradas.csv",
        "columns": (
            "id",
            "ano",
            "mes",
            "descricao",
            "tipo",
            "valor_centavos",
            "criado_em",
            "atualizado_em",
        ),
        "numeric": ("ano", "mes", "valor_centavos"),
    },
    "gastos": {
        "file": "gastos.csv",
        "columns": (
            "id",
            "grupo_id",
            "descricao",
            "categoria_id",
            "data_pagamento",
            "ano",
            "mes",
            "destino_id",
            "valor_centavos",
            "tipo_pagamento",
            "tipo_gasto",
            "parcela_atual",
            "parcelas_total",
            "criado_em",
            "pago",
            "atualizado_em",
        ),
        "numeric": ("ano", "mes", "valor_centavos", "parcela_atual", "parcelas_total"),
    },
    "categorias": {
        "file": "categorias.csv",
        "columns": ("id", "nome", "tipo", "parcelas_padrao", "ativo", "criado_em"),
        "numeric": ("parcelas_padrao",),
    },
    "destinos": {
        "file": "destinos.csv",
        "columns": ("id", "nome", "tipo", "limite_centavos", "ativo", "criado_em"),
        "numeric": ("limite_centavos",),
    },
    "recorrencias_fixas": {
        "file": "recorrencias_fixas.csv",
        "columns": (
            "id",
            "descricao",
            "categoria_id",
            "destino_id",
            "valor_centavos",
            "tipo_pagamento",
            "dia_pagamento",
            "mes_inicio",
            "mes_fim",
            "tipo_recorrencia",
            "parcelas_total",
            "ativo",
            "criado_em",
        ),
        "numeric": ("valor_centavos", "dia_pagamento", "mes_inicio", "mes_fim", "parcelas_total"),
    },
    "controle_mensal_gastos": {
        "file": "controle_mensal_gastos.csv",
        "columns": (
            "id",
            "descricao",
            "categoria_id",
            "data_gasto",
            "ano",
            "mes",
            "fonte",
            "valor_centavos",
            "observacao",
            "criado_em",
            "atualizado_em",
        ),
        "numeric": ("ano", "mes", "valor_centavos"),
    },
    "controle_mensal_categorias": {
        "file": "controle_mensal_categorias.csv",
        "columns": ("id", "nome", "ativo", "criado_em", "atualizado_em"),
        "numeric": (),
    },
}


COLLECTIONS = tuple(COLLECTION_SCHEMAS.keys())


INDEX_SQL = (
    'CREATE INDEX IF NOT EXISTS "idx_entradas_ano_mes" ON "entradas" ("ano", "mes")',
    'CREATE INDEX IF NOT EXISTS "idx_gastos_ano_mes" ON "gastos" ("ano", "mes")',
    'CREATE INDEX IF NOT EXISTS "idx_gastos_grupo" ON "gastos" ("grupo_id")',
    'CREATE INDEX IF NOT EXISTS "idx_gastos_categoria" ON "gastos" ("categoria_id")',
    'CREATE INDEX IF NOT EXISTS "idx_gastos_destino" ON "gastos" ("destino_id")',
    'CREATE INDEX IF NOT EXISTS "idx_recorrencias_categoria" ON "recorrencias_fixas" ("categoria_id")',
    'CREATE INDEX IF NOT EXISTS "idx_recorrencias_destino" ON "recorrencias_fixas" ("destino_id")',
    'CREATE INDEX IF NOT EXISTS "idx_controle_mensal_gastos_ano_mes" '
    'ON "controle_mensal_gastos" ("ano", "mes")',
    'CREATE INDEX IF NOT EXISTS "idx_controle_mensal_gastos_categoria" '
    'ON "controle_mensal_gastos" ("categoria_id")',
)


def collection_schema(collection: str) -> dict:
    if collection not in COLLECTION_SCHEMAS:
        raise KeyError(collection)
    return COLLECTION_SCHEMAS[collection]


def columns_for(collection: str) -> tuple[str, ...]:
    return collection_schema(collection)["columns"]


def numeric_columns_for(collection: str) -> set[str]:
    return set(collection_schema(collection)["numeric"])


def quote_identifier(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def create_table_sql(collection: str) -> str:
    numeric_columns = numeric_columns_for(collection)
    definitions = []

    for column in columns_for(collection):
        quoted = quote_identifier(column)
        if column == "id":
            definitions.append(f"{quoted} TEXT PRIMARY KEY NOT NULL")
        elif column in numeric_columns:
            definitions.append(f"{quoted} INTEGER NOT NULL DEFAULT 0")
        else:
            definitions.append(f"{quoted} TEXT NOT NULL DEFAULT ''")

    return f"CREATE TABLE IF NOT EXISTS {quote_identifier(collection)} ({', '.join(definitions)})"


def coerce_value(collection: str, column: str, value):
    if column in numeric_columns_for(collection):
        return coerce_integer(value)

    if value is None:
        return ""
    return str(value)


def coerce_integer(value) -> int:
    if value is None or value == "":
        return 0

    if isinstance(value, bool):
        return int(value)

    if isinstance(value, int):
        return value

    if isinstance(value, float):
        if not math.isfinite(value) or not value.is_integer():
            raise ValueError(f"valor numerico invalido: {value}")
        return int(value)

    text = str(value).strip()
    if not text:
        return 0

    try:
        number = float(text)
    except ValueError as exc:
        raise ValueError(f"valor numerico invalido: {value}") from exc

    if not math.isfinite(number) or not number.is_integer():
        raise ValueError(f"valor numerico invalido: {value}")

    return int(number)
