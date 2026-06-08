# 01 - Visao geral das regras de negocio

## Data base
2026-06-03

## Escopo
O FinanceControll registra entradas, gastos, categorias, destinos e recorrencias para montar resumos mensais, totais anuais e projecoes de saidas futuras.

Esta documentacao descreve o comportamento atual implementado no codigo. Quando houver divergencia entre esta documentacao e o codigo, a divergencia deve ser tratada como pendencia de manutencao: confirmar a regra desejada, ajustar codigo ou documentacao e registrar no historico.

## Principios atuais
- Valores monetarios sao armazenados como inteiros em centavos, principalmente no campo `valor_centavos`.
- Valores de entrada e gasto cadastrados devem ser maiores que zero; saldos calculados podem ser negativos.
- Meses sao tratados por par `ano` e `mes`, e recorrencias usam periodo numerico `YYYYMM`.
- Gastos pagos sao historico fechado: edicoes de recorrencia e limpeza de recorrencia preservam gastos com `pago` verdadeiro.
- Gastos pendentes gerados por recorrencia podem ser recalculados, substituidos ou removidos quando a recorrencia de origem muda.
- Gastos manuais sem `grupo_id` sao independentes de recorrencias.
- A classificacao financeira principal usa:
  - Entradas: `tipo` igual a `fixa` ou `variavel`.
  - Gastos: `tipo_gasto` igual a `fixa`, `variavel` ou `parcelada`.

## Areas de regra
- Resumo mensal: calcula renda, saidas, credito disponivel no cartao, saldo no Pix e credito geral.
- Totais anuais: somam os resultados mensais de renda, saidas e caixa liquido.
- Projecoes: mostram saidas previstas por mes considerando gastos fixos e parcelados ja existentes.
- Recorrencias e parcelamentos: geram gastos mensais a partir de uma definicao recorrente.
- Categorias: podem reclassificar gastos manuais pendentes quando o tipo da categoria muda.
- Validacoes: impedem dados vazios ou valores invalidos antes de salvar.

## Fora do escopo atual
- `destinos.limite_centavos` existe no modelo, mas nao participa dos calculos atuais.
- Nao ha regra atual de fechamento de fatura, vencimento de cartao ou limite por destino.
- Nao ha regra atual de conciliacao bancaria externa.
- Nao ha regra atual de rateio, centro de custo ou multiusuario.
