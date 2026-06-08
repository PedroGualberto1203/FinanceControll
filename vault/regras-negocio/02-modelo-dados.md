# 02 - Modelo de dados

## Data base
2026-06-03

## Colecoes
O mesmo contrato de campos e usado nos CSVs do frontend e nas tabelas SQLite locais.

### `entradas`
Campos: `id`, `ano`, `mes`, `descricao`, `tipo`, `valor_centavos`, `criado_em`, `atualizado_em`.

Campos numericos: `ano`, `mes`, `valor_centavos`.

Semantica:
- `tipo`: classifica a entrada como `fixa` ou `variavel`.
- `valor_centavos`: valor positivo em centavos usado nos calculos de renda.
- `ano` e `mes`: mes de competencia da entrada.

### `gastos`
Campos: `id`, `grupo_id`, `descricao`, `categoria_id`, `data_pagamento`, `ano`, `mes`, `destino_id`, `valor_centavos`, `tipo_pagamento`, `tipo_gasto`, `parcela_atual`, `parcelas_total`, `criado_em`, `pago`, `atualizado_em`.

Campos numericos: `ano`, `mes`, `valor_centavos`, `parcela_atual`, `parcelas_total`.

Semantica:
- `grupo_id`: identifica a recorrencia que gerou o gasto. Vazio significa gasto manual.
- `tipo_gasto`: `fixa`, `variavel` ou `parcelada`.
- `tipo_pagamento`: forma de pagamento informada, como `pix` ou `credito`.
- `pago`: trava historico quando verdadeiro.
- `parcela_atual` e `parcelas_total`: usados para gastos parcelados; gastos simples usam `1`.
- `data_pagamento`: data gerada ou informada no formato `YYYY-MM-DD`.

### `categorias`
Campos: `id`, `nome`, `tipo`, `parcelas_padrao`, `ativo`, `criado_em`.

Campos numericos: `parcelas_padrao`.

Semantica:
- `tipo`: classifica a categoria como `fixa` ou `variavel` no fluxo atual.
- `parcelas_padrao`: suporte legado para categorias parceladas; ainda pode influenciar a normalizacao de recorrencias se dados antigos tiverem categoria do tipo `parcelada`.
- `ativo`: categorias inativas nao devem ser oferecidas em novos cadastros.

### `destinos`
Campos: `id`, `nome`, `tipo`, `limite_centavos`, `ativo`, `criado_em`.

Campos numericos: `limite_centavos`.

Semantica:
- `tipo`: classifica o destino, por exemplo Pix ou credito.
- `limite_centavos`: campo persistido, mas sem uso em calculos atuais.
- `ativo`: destinos inativos nao devem ser oferecidos em novos cadastros.

### `recorrencias_fixas`
Campos: `id`, `descricao`, `categoria_id`, `destino_id`, `valor_centavos`, `tipo_pagamento`, `dia_pagamento`, `mes_inicio`, `mes_fim`, `tipo_recorrencia`, `parcelas_total`, `ativo`, `criado_em`.

Campos numericos: `valor_centavos`, `dia_pagamento`, `mes_inicio`, `mes_fim`, `parcelas_total`.

Semantica:
- `mes_inicio` e `mes_fim`: periodos numericos `YYYYMM`.
- `tipo_recorrencia`: `fixa` ou `parcelada`.
- `parcelas_total`: quantidade de parcelas quando `tipo_recorrencia` e `parcelada`; para fixa usa `1`.
- `dia_pagamento`: dia desejado para geracao da data mensal.
- `ativo`: somente recorrencias ativas geram gastos.

## Conversoes e persistencia
- Campos numericos vazios ou nulos sao persistidos como `0`.
- Campos textuais vazios ou nulos sao persistidos como string vazia.
- Campos monetarios devem ser inteiros em centavos antes de persistir.
- O SQLite usa `id` como chave primaria textual e cria indices para busca por ano/mes, grupo, categoria e destino.

## Identificadores gerados
- Entradas usam prefixo `ent`.
- Gastos gerados usam prefixo `gas`.
- Categorias usam prefixo `cat`.
- Destinos usam prefixo `dst`.
- Recorrencias fixas usam prefixo `fix`.
- Recorrencias parceladas usam prefixo `par`.
