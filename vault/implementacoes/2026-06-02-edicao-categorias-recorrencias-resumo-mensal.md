# 2026-06-02 - Edicao de categorias, recorrencias e resumo mensal

## Data
2026-06-02

## Contexto
O usuario solicitou melhorias no FinanceControll para editar categorias cadastradas, editar gastos recorrentes com reflexo nos gastos mensais, adicionar expansao "Ver mais/Ver menos" em gastos recorrentes e reorganizar o campo de credito disponivel no resumo mensal.

## Decisoes
- Categorias e recorrencias agora entram em modo de edicao no proprio formulario existente, com estados Adicionar, Salvar e Cancelar.
- Alteracoes retroativas seguem a regra "pendentes apenas": lancamentos pagos permanecem como historico fechado.
- Gastos gerados por recorrencia sao governados pela edicao da recorrencia, nao pela edicao direta do tipo da categoria.
- Nao houve mudanca no schema CSV/SQLite nem inclusao de novas dependencias.

## Implementacao
- Adicionada edicao de categorias no dashboard, incluindo botao de editar nas linhas, preenchimento do formulario e reclassificacao de gastos manuais pendentes da categoria.
- Adicionada edicao de gastos recorrentes, com reconciliacao dos lancamentos mensais vinculados por grupo_id: pendentes sao recalculados, pagos sao preservados.
- Adicionado "Ver mais/Ver menos" em Gastos recorrentes, usando o mesmo limite e comportamento das listas de categorias/destinos.
- O resumo mensal passou a exibir:
  - Credito disponivel no Cartao = entradas fixas menos todas as despesas.
  - Saldo no Pix = soma das entradas variaveis.
  - Credito Geral Disponivel = todas as entradas menos todas as saidas.
- Adicionado replaceAll no repositorio para salvar categorias/recorrencias e gastos derivados de forma atomica via PUT /api/data.
- Criados testes JS sem dependencias para formulas do resumo, reconciliacao de recorrencias e reclassificacao de categorias.

## Validacao
- npm run check passou com 3 testes JS e 5 testes Python.
- Validacao interativa headless no Edge passou para editar/cancelar categoria, editar/cancelar recorrente, alternar Ver mais/Ver menos nas listas e conferir os novos campos do resumo mensal.
- O servidor local foi validado em http://127.0.0.1:4173 com SQLite conectado.

## Proximos passos
- Opcional: validar manualmente uma edicao real de categoria e recorrencia com dados de baixo risco, para confirmar a experiencia completa de salvamento na UI com dados reais.
