# Ajustes de gastos, parcelamento e dashboard

## Data

2026-05-29

## Contexto

Foram implementadas melhorias na aba de gastos e no dashboard do FinanceControll para corrigir o fluxo de registro de saídas, permitir edição posterior, controlar pagamento de cada lançamento e alinhar o resumo mensal com a regra real de saldo disponível.

## Decisões

- O controle de pago/não pago fica somente na aba de gastos, pois é ali que os lançamentos reais são registrados.
- A seção de fixos no dashboard continua servindo apenas para cadastro/projeção, sem controle de pagamento.
- Uma categoria parcelada representa a compra parcelada em si, por exemplo `Macbook`; por isso a sequência de parcelas é agrupada apenas pela categoria.
- O campo/valor de limite em Destinos deixa de participar do dashboard. Destinos passam a ser apenas classificação do local/meio de pagamento.
- O “crédito disponível” do mês passa a representar `entradas do mês - saídas registradas no mês`.

## Implementação

- Adicionados os campos `pago` e `atualizado_em` ao schema e cabeçalho de `gastos.csv`, mantendo compatibilidade com CSVs antigos.
- Adicionado método de atualização por id no repositório CSV para edição de lançamentos e alternância de status pago sem duplicar registros.
- Na aba de gastos:
  - adicionada edição de gastos já registrados usando o mesmo formulário;
  - adicionado botão de cancelar edição;
  - adicionados botões de editar/remover por linha;
  - adicionado checkbox pago/não pago por lançamento;
  - adicionada mudança visual para linhas pagas;
  - preservada a categoria/destino ao alterar a data de pagamento.
- Para categorias parceladas:
  - removida a geração automática de parcelas futuras;
  - cada registro cria apenas uma linha no mês selecionado;
  - o valor informado é mantido integralmente;
  - `parcela_atual` avança conforme a quantidade já registrada na mesma categoria.
- No dashboard:
  - removido o campo visual de limite no cadastro de destinos;
  - destinos não exibem mais limite;
  - o cálculo financeiro mensal agora usa apenas entradas e gastos registrados;
  - o resumo mensal removeu a duplicidade entre saldo líquido e crédito disponível.

## Validação

- `npm run check` executado com sucesso.
- `node --check` executado em todos os arquivos JS de `js` e `vendor` com sucesso.
- Teste de UI em navegador real via Edge headless confirmou:
  - lançamento parcelado cria apenas uma linha com valor integral;
  - segunda parcela da mesma categoria avança para `2/12`;
  - categoria permanece selecionada ao mudar a data de pagamento;
  - checkbox pago persiste no armazenamento local;
  - edição altera o registro existente sem duplicar;
  - destinos não exibem campo de limite;
  - dashboard mostra R$ 2.000,00 no exemplo de R$ 3.250,00 em entradas e R$ 1.250,00 em saídas.

## Próximos passos

- Usar uma categoria parcelada por compra específica para evitar que duas compras diferentes sejam agrupadas na mesma sequência.
- Se no futuro houver necessidade de controlar múltiplas compras dentro da mesma categoria, adicionar um campo explícito de grupo/compra parcelada.
