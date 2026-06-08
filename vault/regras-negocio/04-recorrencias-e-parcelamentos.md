# 04 - Recorrencias e parcelamentos

## Data base
2026-06-03

## Fonte principal
`js/services/recurring-service.js`

## Conceitos
- Recorrencia e um cadastro em `recorrencias_fixas`.
- Cada recorrencia pode gerar um ou mais registros em `gastos`.
- Gastos gerados recebem `grupo_id` igual ao `id` da recorrencia.
- Gastos gerados sempre nascem com `pago: "false"`.

## Periodos
- Entradas de formulario usam mes no formato `YYYY-MM`.
- Regras internas usam periodo numerico `YYYYMM`.
- `mes_inicio` e `mes_fim` sao inclusivos.
- Avancar meses usa calendario real, atravessando anos corretamente.

## Tipo da recorrencia
Uma recorrencia e tratada como parcelada quando qualquer condicao abaixo for verdadeira:
- `tipo_recorrencia === "parcelada"`.
- `parcelas_total > 1`.
- A categoria vinculada tiver `tipo === "parcelada"` em dados legados.

Caso contrario, a recorrencia e tratada como fixa.

## Normalizacao antes de gerar gastos
Uma recorrencia so gera gastos quando:
- Possui `id`.
- Possui `descricao`.
- Esta ativa por `ativo` verdadeiro.
- Possui `mes_inicio` valido.
- Possui `mes_fim` valido ou parcelas suficientes para derivar o fim.
- O fim e igual ou posterior ao inicio.

Para recorrencias parceladas:
- `parcelas_total` e no minimo `1`.
- Se `parcelas_total` nao vier preenchido, pode ser usado `categorias.parcelas_padrao`.
- `mes_fim` e calculado como `mes_inicio + parcelas_total - 1`.

Para recorrencias fixas:
- `parcelas_total` e `1`.
- `mes_fim` vem do cadastro.

## Geracao de gastos
Para cada periodo entre `mes_inicio` e `mes_fim`, a regra cria um gasto com:
- `grupo_id`: id da recorrencia.
- `descricao`, `categoria_id`, `destino_id`, `valor_centavos` e `tipo_pagamento`: copiados da recorrencia.
- `ano` e `mes`: derivados do periodo `YYYYMM`.
- `data_pagamento`: ano/mes do periodo e dia ajustado.
- `tipo_gasto`: `fixa` ou `parcelada`.
- `parcela_atual`: indice mensal com inicio em `1` para parceladas; `1` para fixas.
- `parcelas_total`: total de parcelas para parceladas; `1` para fixas.
- `pago`: `"false"`.
- `criado_em` e `atualizado_em`: data atual.

## Dia de pagamento
O dia informado e limitado ao intervalo de `1` a `31` no formulario.

Na geracao da data mensal:
- Dia menor que `1` vira `1`.
- Dia maior que o ultimo dia do mes vira o ultimo dia valido.
- Exemplo: dia `31` em fevereiro vira `28` ou `29`, conforme o ano.

## Prevencao de duplicidade
Ao sincronizar recorrencias, a regra evita criar gasto duplicado.

Para gastos parcelados, a duplicidade e detectada por:
- mesmo `grupo_id`;
- mesmo `tipo_gasto`;
- mesma `parcela_atual`.

Para gastos fixos, a duplicidade e detectada por:
- mesmo `grupo_id`;
- mesmo `tipo_gasto`;
- mesmo `ano`;
- mesmo `mes`.

## Edicao de recorrencia
Ao editar uma recorrencia:
- Gastos pagos vinculados ao `grupo_id` sao preservados.
- Gastos pendentes vinculados ao `grupo_id` sao descartados e recalculados.
- Gastos manuais ou de outros grupos sao preservados.
- Se um periodo ja possui gasto pago, a regra nao recria pendente para o mesmo ano/mes.
- Quando possivel, gastos pendentes recalculados reaproveitam `id` e `criado_em` anteriores.
- Gastos pendentes recalculados recebem `pago: "false"` e `atualizado_em` com a data atual.

## Remocao de recorrencia
No fluxo atual do dashboard:
- Remover uma recorrencia remove tambem gastos pendentes gerados por ela.
- Gastos pagos gerados por ela sao preservados como historico.

## Cenario validado em teste
Uma recorrencia editada de junho a agosto preserva o gasto pago de junho, recalcula o gasto pendente de julho, cria o pendente de agosto e remove o pendente de setembro que ficou fora do novo intervalo.
