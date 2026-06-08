# 07 - Projecoes

## Data base
2026-06-03

## Fonte principal
`js/services/projection-service.js`

## Periodo calculado
A projecao percorre os 12 meses do ano informado.

Para cada mes, considera gastos com:
- `Number(row.ano) === year`;
- `Number(row.mes) === month`.

## Itens incluidos
A projecao atual inclui:
- Gastos parcelados com `tipo_gasto === "parcelada"`.
- Gastos fixos lancados com `tipo_gasto === "fixa"`.

Gastos variaveis nao entram na projecao atual.

## Formula
Todos os valores sao calculados em centavos.

| Campo | Regra |
| --- | --- |
| `installments` | Lista de gastos parcelados do mes. |
| `fixedRows` | Lista de gastos fixos lancados do mes. |
| `recurring` | Lista vazia no comportamento atual. |
| `total` | Soma de `valor_centavos` de `installments` e `fixedRows`. |

## Exibicao
No dashboard, cada item projetado mostra:
- descricao;
- categoria quando encontrada;
- numero da parcela para gasto parcelado;
- valor formatado.

## Observacoes importantes
- A projecao usa gastos ja presentes em `gastos`.
- A lista `recurring` existe no retorno, mas hoje permanece vazia.
- Se futuramente a projecao passar a simular recorrencias ainda nao materializadas em `gastos`, este arquivo deve ser atualizado.
