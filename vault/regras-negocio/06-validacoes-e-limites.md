# 06 - Validacoes e limites

## Data base
2026-06-03

## Fontes principais
- `js/services/validation-service.js`
- `js/ui/formatters.js`
- `js/screens/dashboard.js`
- `js/screens/gastos.js`

## Texto obrigatorio
Campos validados com `requireText` precisam ter texto apos `trim`.

Se o valor estiver vazio, a mensagem segue o padrao:
`<Campo> e obrigatorio.`

## Select obrigatorio
Campos validados com `requireSelect` precisam ter valor textual nao vazio.

Se o valor estiver vazio, a mensagem segue o padrao:
`<Campo> e obrigatorio.`

## Valor monetario
Valores monetarios passam por `parseCurrencyToCents`.

Regras de conversao:
- Valor numerico direto e multiplicado por `100` e arredondado.
- Valor textual tem simbolos removidos.
- Pontos sao tratados como separadores de milhar e removidos.
- Virgula e tratada como separador decimal.
- Valor invalido vira `0`.

Depois da conversao, `requireMoney` exige que o valor em centavos seja maior que `0`.

Se o valor for zero, negativo ou invalido, a mensagem segue o padrao:
`<Campo> precisa ser maior que zero.`

## Parcelas
`clampParcelas` converte a entrada para numero e limita:
- minimo: `1`;
- maximo: `120`;
- valor vazio ou invalido: `1`.

No cadastro de recorrencia:
- Recorrencia fixa usa `parcelas_total = 1`.
- Recorrencia parcelada usa a quantidade validada por `clampParcelas`.

## Dia de pagamento
No formulario de recorrencia, `dia_pagamento` e limitado entre `1` e `31`.

Na geracao do gasto mensal, o dia ainda e ajustado para o ultimo dia real do mes quando necessario.

## Periodo de recorrencia
`parseMonthPeriod` espera valores no formato `YYYY-MM`.

Uma recorrencia e invalida quando:
- ano nao e numerico;
- mes nao e numerico;
- mes e menor que `1`;
- mes e maior que `12`;
- fim e anterior ao inicio.

Mensagem de periodo invalido:
`<Label> precisa ter mes e ano validos.`

Mensagem de fim anterior ao inicio:
`Fim precisa ser igual ou posterior ao inicio.`

## Booleanos
`toBoolean` considera verdadeiro apenas:
- booleano `true`;
- string `"true"`;
- string `"1"`;
- numero `1`.

Qualquer outro valor e tratado como falso.
