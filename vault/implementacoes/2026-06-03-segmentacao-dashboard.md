# Segmentacao do Dashboard

## Data

2026-06-03

## Contexto

A tela de Dashboard estava extensa porque concentrava metricas anuais, cadastro de entradas, categorias, destinos, recorrentes, resumo mensal e projecao. O objetivo foi segmentar a experiencia em abas especificas na Sidebar, mantendo as funcionalidades existentes e reduzindo a densidade da tela principal.

## Decisoes

- Manter no Dashboard apenas os cards de Renda anual prevista, Saidas anuais, Disponivel anual, Credito disponivel no mes e o cadastro/listagem de Entradas.
- Criar a aba Categorias e Destinos entre Dashboard e Gastos, com Categorias acima de Destinos em largura total.
- Criar a aba Recorrentes para o cadastro/listagem de gastos fixos e parcelados.
- Criar a aba Resumo e Projecao para Resumo Mensal primeiro e Projecao depois.
- Reaproveitar os mesmos formularios, ids internos, renderizadores e servicos, sem alterar schemas, CSVs, calculos financeiros ou regras de negocio.

## Implementacao

- Atualizada a Sidebar em `index.html` para a ordem: Dashboard, Categorias e Destinos, Recorrentes, Resumo e Projecao, Gastos.
- Adicionadas rotas novas em `js/router.js`: `#categorias-destinos`, `#recorrentes` e `#resumo-projecao`.
- Criados os templates `html/categorias-destinos.html`, `html/recorrentes.html` e `html/resumo-projecao.html`.
- Reduzido `html/dashboard.html` para a visao anual e o cadastro de entradas.
- Refatorado `js/screens/dashboard.js` para expor renderizadores por aba e compartilhar os eventos de cadastro, edicao, exclusao e expansao de listas.
- Ajustado o estado de edicao para nao carregar uma edicao antiga ao trocar de aba.
- Ajustado o CSS responsivo em `css/theme.css` para evitar corte de botoes, tags e acoes em telas estreitas.

## Validacao

- `node --check js/router.js`
- `node --check js/screens/dashboard.js`
- `npm run check`
- Validacao visual por capturas headless em desktop para Dashboard, Categorias e Destinos, Recorrentes e Resumo e Projecao.
- Validacao mobile em 375px para Categorias e Destinos, com correcao de overflow antes do fechamento.

## Proximos passos

- Fazer um teste manual de cadastros reais apenas quando desejado, para evitar alterar dados financeiros durante a validacao tecnica.
- Considerar, futuramente, uma revisao de nomes com acentos visuais caso o projeto decida migrar os textos para PT-BR completo.
