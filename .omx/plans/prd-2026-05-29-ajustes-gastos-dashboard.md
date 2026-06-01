# Plano: Ajustes de gastos, pagamento e dashboard

Data: 2026-05-29

## Resumo dos requisitos

1. Permitir editar gastos ja registrados na tela de gastos do mes.
2. Corrigir a perda/alteracao involuntaria da categoria ao alterar a data de pagamento no formulario de saida.
3. Simplificar o resumo mensal do dashboard para deixar apenas o valor de credito/saldo disponivel conforme a regra nova.
4. Corrigir categorias parceladas para registrar somente uma parcela no mes atual, com o valor integral informado, sem gerar lancamentos automaticos nos meses seguintes.
5. Adicionar status de pagamento por saida registrada: pago ou nao pago, com checkbox e diferenca visual na linha.
6. Remover valor/limite de "Destinos" como conceito financeiro do saldo do dashboard; destino fica apenas como local/meio para onde o pagamento vai.
7. Recalcular "Fluxo e limite disponivel" como: entradas do mes - todas as saidas do mes.

## Leitura do codigo atual

- `html/gastos.html`: formulario e tabela de saidas do mes.
- `js/screens/gastos.js`: renderiza tabela, sincroniza filtros/data, registra gastos e hoje chama `createInstallmentRows` para categorias parceladas.
- `js/services/projection-service.js`: hoje divide `valor_centavos` pelo numero de parcelas e cria linhas futuras.
- `js/services/finance-service.js`: hoje calcula `creditAvailable` a partir de limites dos destinos tipo cartao e uso no credito.
- `js/screens/dashboard.js`: exibe destinos com limite, resumo mensal com saldo liquido e credito disponivel.
- `js/data/csv-schema.js`: schema de `gastos.csv` ainda nao tem campo de status de pagamento nem campo de atualizacao.
- `js/data/csv-repository.js`: ja tem `replace`, `append`, `appendMany` e `remove`, mas nao tem helper direto de update por id.
- `css/theme.css`: ja tem padroes de tabela, tags, botoes e estados que podem ser reaproveitados.

## Decisoes de produto

- "Credito disponivel" passa a significar o saldo disponivel do mes, nao limite de cartao: `entradas - saidas`.
- O destino continua existindo para classificar onde a saida sera paga, mas sem valor/limite no cadastro e sem impacto direto no saldo.
- Categoria parcelada nao cria mais lancamentos futuros automaticamente. Ao registrar R$ 180,00 em uma categoria 12x, cria uma unica linha no mes selecionado com R$ 180,00 e `parcela_atual` calculada conforme registros anteriores do mesmo grupo/categoria.
- Status de pagamento vive em cada linha de `gastos.csv`, com default `false` para dados antigos/importados.
- Edicao de gasto deve ser individual por linha. Se a linha for parcelada, editar uma parcela nao altera outras parcelas ja registradas.

## Pontos que precisam de confirmacao antes da implementacao

1. Para identificar a continuacao de uma compra parcelada lancada manualmente mes a mes, devemos agrupar automaticamente por mesma descricao + categoria + destino, ou voce prefere escolher um "grupo/compra parcelada" explicitamente?
2. O status "pago" deve existir apenas para gastos lancados em `gastos.csv`, ou tambem para recorrencias fixas projetadas no dashboard?

## Plano de implementacao

### 1. Preparar persistencia para edicao e status pago

- Em `js/data/csv-schema.js`, adicionar em `gastos.columns`:
  - `pago`
  - `atualizado_em`
- Manter compatibilidade: `normalizeRow` em `js/data/csv-utils.js` ja preenche colunas ausentes com string vazia; tratar `pago` vazio como falso no uso da UI.
- Em `js/data/csv-repository.js`, adicionar metodo `update(collection, id, patch)` ou usar `replace` com mapeamento. Preferivel criar `update` para evitar repeticao nas telas.
- Atualizar registros novos em `js/screens/gastos.js` para gravar `pago: "false"` e `atualizado_em: todayIso()`.

### 2. Corrigir a perda de categoria ao mudar data

- Em `js/screens/gastos.js`, revisar o fluxo:
  - `change` em `data_pagamento` muda `expenseYear`/`expenseMonth` e chama `appState.emit()`.
  - `renderExpenses -> setupControls -> populateCategorySelect` recria o `<select>` e perde a selecao atual.
- Ajustar `populateCategorySelect(select, categories, selectedId)` e `populateDestinationSelect(select, destinations, selectedId)` para preservar valores ja escolhidos.
- Antes de emitir mudanca por data, guardar valores atuais do formulario ou derivar o valor do proprio select antes de repopular.
- Criterio: mudar a data dentro do formulario nao deve exigir selecionar categoria novamente.

### 3. Mudar regra de parcelados para lancamento manual mensal

- Remover o comportamento de `appendMany("gastos", createInstallmentRows(...))` em `js/screens/gastos.js`.
- Substituir por criacao de uma unica linha de gasto quando categoria for `parcelada`.
- Criar uma funcao no `projection-service.js` ou no proprio `gastos.js` para calcular:
  - `parcelas_total = category.parcelas_padrao`
  - `parcela_atual = proxima parcela` conforme historico
  - `valor_centavos = payload.valor_centavos`, sem dividir por `parcelas_total`
- Regra inicial sugerida para `parcela_atual`:
  - procurar gastos parcelados anteriores com mesma `descricao`, `categoria_id` e `destino_id`;
  - usar maior `parcela_atual + 1`, limitado por `parcelas_total`;
  - se nao houver historico, usar `1`.
- Manter `grupo_id` para conectar parcelas da mesma compra quando possivel. Se nao houver grupo anterior compativel, criar novo `grupo_id`.
- Ajustar notificacao: "Parcela registrada" em vez de "Parcelas registradas".
- Considerar remover ou renomear `createInstallmentRows` para evitar uso futuro do comportamento antigo.

### 4. Adicionar edicao de gastos do mes

- Em `html/gastos.html`, preparar formulario para modo "novo" e modo "edicao":
  - campo oculto `id` ou estado JS `editingExpenseId`;
  - titulo muda para "Editar saida";
  - botao muda para "Salvar";
  - botao secundario "Cancelar" aparece no modo edicao.
- Em `js/ui/components.js`, criar uma acao de linha para editar usando icone existente, ou um helper separado `rowActions` com editar + remover.
- Em `js/screens/gastos.js`:
  - adicionar click handler para `[data-edit-id]`;
  - preencher formulario com os dados da linha;
  - no submit, se houver `editingExpenseId`, chamar `repository.update("gastos", id, payloadAtualizado)`;
  - recalcular `ano` e `mes` a partir de `data_pagamento`;
  - preservar `grupo_id`, `tipo_gasto`, `parcela_atual`, `parcelas_total`, `criado_em` quando editar;
  - atualizar `atualizado_em`.
- Criterio: editar descricao, categoria, data, destino, valor ou tipo de pagamento reflete na tabela e no CSV/localStorage sem duplicar registro.

### 5. Adicionar status pago/nao pago na aba de gastos

- Em `html/gastos.html`, adicionar coluna "Pago" ou incorporar checkbox na coluna de pagamento.
- Em `js/screens/gastos.js`, renderizar checkbox por linha:
  - `checked` quando `toBoolean(row.pago)`;
  - `data-paid-id` para atualizar rapidamente.
- No change handler, quando checkbox mudar:
  - `repository.update("gastos", id, { pago: "true"|"false", atualizado_em: todayIso() })`.
- Em `css/theme.css`, adicionar classes para a linha paga:
  - reduzir destaque visual;
  - tag verde "Pago" ou row com borda/tonalidade verde discreta;
  - manter contraste acessivel e foco visivel.
- Criterio: alternar pago/nao pago altera visualmente a linha e persiste ao recarregar.

### 6. Ajustar dashboard: destinos sem valor/limite

- Em `html/dashboard.html`, remover campo "Limite" do formulario de destino ou deixar escondido sem impacto.
- Em `js/screens/dashboard.js`:
  - `buildDestination` deve salvar `limite_centavos: 0`;
  - `renderCatalogs` deve parar de exibir `limite ${formatCurrency(...)}`;
  - textos do dashboard devem evitar "limite de cartao" quando nao for mais regra de saldo.
- Em `data/destinos.csv`, em uma implementacao final, os valores antigos de `limite_centavos` podem permanecer por compatibilidade, mas nao devem ser usados no calculo.

### 7. Ajustar resumo mensal e overview

- Em `js/services/finance-service.js`:
  - remover `cardLimit` e `creditUsed` do calculo principal;
  - manter `income`, `fixed`, `variable`, `installments`, `outgoing`;
  - definir `availableBalance = income - outgoing`;
  - se manter nome interno antigo temporariamente, garantir que `creditAvailable` receba `availableBalance` para reduzir impacto.
- Em `js/screens/dashboard.js`:
  - em `renderMonthlySummary`, remover a linha "Saldo liquido" e exibir somente "Credito disponivel" ou renomear para "Disponivel no mes".
  - em `renderOverview`, revisar cards para nao duplicar saldo liquido e credito disponivel se ficarem semanticamente iguais.
- Criterio: para entrada R$ 3.250,00 e saidas R$ 1.250,00, o dashboard mostra R$ 2.000,00 como disponivel do mes.

### 8. UI/UX e acessibilidade

- Reaproveitar o tema dark atual em `css/theme.css`.
- Usar controles conhecidos:
  - checkbox para pago/nao pago;
  - icone de edicao em botao pequeno;
  - tag verde/amarela para status quando ajudar na leitura;
  - foco visivel para checkbox e botoes.
- Evitar novas dependencias.
- Verificar responsividade em tabela mobile/desktop, especialmente porque uma nova coluna e novas acoes aumentam a largura minima.

## Criterios de aceite

- Ao mudar `data_pagamento`, categoria e destino escolhidos nao sao resetados indevidamente.
- Gasto ja registrado pode ser editado e salvo sem criar duplicata.
- Gasto pode ser removido como hoje.
- Gasto pode ser marcado como pago ou nao pago depois de registrado.
- A linha paga tem diferenca visual clara e acessivel.
- `gastos.csv` exportado contem `pago` e `atualizado_em`.
- CSV antigo sem `pago` continua carregando sem erro.
- Categoria parcelada 12x com valor R$ 180,00 cria uma linha de R$ 180,00 no mes atual, nao 12 linhas nem valores divididos.
- Proximos meses nao recebem parcelas automaticamente.
- Ao registrar novamente a mesma compra parcelada em outro mes, a parcela atual avanca quando o agrupamento bater.
- Destinos nao exibem limite/valor no dashboard.
- Resumo mensal mostra o disponivel do mes calculado por `entradas - saidas`.
- Exemplo validado: entradas R$ 3.250,00, saidas R$ 1.250,00, disponivel R$ 2.000,00.

## Verificacao

- Rodar `npm run check`.
- Testar manualmente no navegador:
  - criar destino sem limite;
  - criar categoria parcelada 12x;
  - registrar saida parcelada de R$ 180,00;
  - conferir valor na tabela e ausencia de parcelas futuras;
  - mudar data no formulario apos selecionar categoria e confirmar que a categoria permanece;
  - editar um gasto e confirmar persistencia;
  - marcar/desmarcar pago e recarregar;
  - conferir dashboard com um cenario de entradas e saidas conhecido.
- Exportar CSVs e verificar cabecalho/valores de `gastos.csv`.

## Riscos e mitigacoes

- Agrupamento automatico de parcelas pode errar quando descricoes parecidas representam compras diferentes.
  - Mitigacao: confirmar se basta descricao+categoria+destino ou se precisa um seletor de grupo/compra.
- Alterar schema de CSV pode afetar dados antigos no localStorage.
  - Mitigacao: manter defaults e validar importacao de CSV antigo.
- Nova coluna de checkbox pode apertar a tabela em telas pequenas.
  - Mitigacao: revisar `min-width` da tabela e estados responsivos.
- "Credito disponivel" pode ficar semanticamente confuso se nao for mais limite de cartao.
  - Mitigacao: considerar label final "Disponivel no mes" ou "Saldo disponivel".

## Ordem sugerida

1. Schema + repository update + defaults.
2. Correcao do reset de categoria/data.
3. Nova regra de parcelados.
4. Edicao de gastos.
5. Pago/nao pago com visual.
6. Dashboard/destinos/saldo disponivel.
7. Verificacao completa e ajustes finos de UI.
