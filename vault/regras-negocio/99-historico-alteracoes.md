# 99 - Historico de alteracoes das regras de negocio

## Como registrar
Toda mudanca em regra de negocio deve registrar:
- Data.
- Area impactada.
- Regra criada, alterada, removida ou reinterpretada.
- Fonte da mudanca no codigo ou decisao.
- Validacao executada.

## Historico

| Data | Area | Alteracao | Fonte | Validacao |
| --- | --- | --- | --- | --- |
| 2026-06-03 | Documentacao | Criada a secao exclusiva de regras de negocio no vault e documentadas as regras atuais de modelo de dados, resumo mensal, totais, recorrencias, categorias, validacoes e projecoes. | Plano aprovado pelo usuario e leitura de `js/services/*`, `js/data/csv-schema.js`, `scripts/sqlite_schema.py` e `tests/finance_services.test.mjs`. | Revisao manual contra codigo e `npm run check`. |
