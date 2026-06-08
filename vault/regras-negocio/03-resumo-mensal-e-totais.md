# 03 - Resumo mensal e totais

## Data base
2026-06-03

## Fonte principal
`js/services/finance-service.js`

## Periodo calculado
O resumo mensal percorre os 12 meses do ano informado. Para cada mes, considera:
- Entradas com `Number(row.ano) === year` e `Number(row.mes) === month`.
- Gastos com `Number(row.ano) === year` e `Number(row.mes) === month`.

## Formula base
Todos os valores abaixo sao calculados em centavos.

| Campo | Regra |
| --- | --- |
| `income` | Soma de todas as entradas do mes. |
| `fixedIncome` | Soma das entradas com `tipo === "fixa"`. |
| `variableIncome` | Soma das entradas com `tipo === "variavel"`. |
| `fixed` | Soma dos gastos com `tipo_gasto === "fixa"`. |
| `variable` | Soma dos gastos com `tipo_gasto === "variavel"`. |
| `installments` | Soma dos gastos com `tipo_gasto === "parcelada"`. |
| `outgoing` | `fixed + variable + installments`. |
| `cardCreditAvailable` | `fixedIncome - outgoing`. |
| `pixBalance` | `variableIncome`. |
| `generalCreditAvailable` | `income - outgoing`. |
| `netCash` | Alias de `generalCreditAvailable`. |
| `creditAvailable` | Alias de `generalCreditAvailable`. |

## Semantica financeira atual
- "Credito disponivel no Cartao" usa somente entradas fixas como base e subtrai todas as saidas do mes.
- "Saldo no Pix" e somente a soma das entradas variaveis do mes; gastos nao sao subtraidos desse campo.
- "Credito Geral Disponivel" soma entradas fixas e variaveis e subtrai todas as saidas.
- Saidas incluem gastos fixos, variaveis e parcelados.
- O resumo nao filtra por `pago`; gastos pagos e pendentes entram no calculo mensal se estiverem em `gastos`.

## Totais anuais
Fonte: `getAnnualTotals(summary)`.

| Campo | Regra |
| --- | --- |
| `income` | Soma de `income` de todos os meses. |
| `outgoing` | Soma de `outgoing` de todos os meses. |
| `netCash` | Soma de `netCash` de todos os meses. |
| `creditAvailable` | Valor de `creditAvailable` do ultimo mes processado no resumo, atualmente dezembro. |

Observacao: no dashboard atual, o card "Credito disponivel no mes" usa o mes corrente diretamente do resumo mensal, nao o `creditAvailable` retornado por `getAnnualTotals`.

## Exemplo validado em teste
Para junho de 2026:
- Entradas fixas: R$ 3.000,00.
- Entradas variaveis: R$ 500,00.
- Gastos fixos: R$ 1.000,00.
- Gastos variaveis: R$ 200,00.
- Gastos parcelados: R$ 300,00.

Resultado:
- `income`: R$ 3.500,00.
- `outgoing`: R$ 1.500,00.
- `cardCreditAvailable`: R$ 1.500,00.
- `pixBalance`: R$ 500,00.
- `generalCreditAvailable`: R$ 2.000,00.
