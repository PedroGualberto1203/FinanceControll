# Regras de negocio - FinanceControll

## Data base
2026-06-03

## Objetivo
Esta secao e a referencia oficial do projeto para regras de negocio, calculos, validacoes, classificacoes financeiras, recorrencias, parcelamentos e semantica dos campos.

Sempre que uma regra de negocio for criada, alterada, removida ou reinterpretada, o arquivo tematico correspondente e o historico de alteracoes devem ser atualizados no mesmo trabalho.

## Mapa da documentacao
- [01 - Visao geral](01-visao-geral.md)
- [02 - Modelo de dados](02-modelo-dados.md)
- [03 - Resumo mensal e totais](03-resumo-mensal-e-totais.md)
- [04 - Recorrencias e parcelamentos](04-recorrencias-e-parcelamentos.md)
- [05 - Categorias e reclassificacao](05-categorias-e-reclassificacao.md)
- [06 - Validacoes e limites](06-validacoes-e-limites.md)
- [07 - Projecoes](07-projecoes.md)
- [99 - Historico de alteracoes](99-historico-alteracoes.md)

## Fontes canonicas no codigo
- `js/services/finance-service.js`
- `js/services/projection-service.js`
- `js/services/recurring-service.js`
- `js/services/category-service.js`
- `js/services/validation-service.js`
- `js/data/csv-schema.js`
- `scripts/sqlite_schema.py`
- `tests/finance_services.test.mjs`

## Regra de manutencao
- Mudancas em formulas financeiras atualizam `03-resumo-mensal-e-totais.md` ou `07-projecoes.md`.
- Mudancas em recorrencias, parcelas, periodos, gastos pagos ou gastos pendentes atualizam `04-recorrencias-e-parcelamentos.md`.
- Mudancas em categorias ou classificacao de gastos atualizam `05-categorias-e-reclassificacao.md`.
- Mudancas em campos, tipos, persistencia ou significado de dados atualizam `02-modelo-dados.md`.
- Mudancas em validacoes, limites ou conversoes atualizam `06-validacoes-e-limites.md`.
- Toda mudanca documentada recebe uma linha em `99-historico-alteracoes.md`.
