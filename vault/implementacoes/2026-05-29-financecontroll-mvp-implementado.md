# FinanceControll MVP implementado

- Data: 2026-05-29
- Tipo: Implementação
- Estado: MVP local funcional para testes

## Contexto

Foi implementado o MVP do FinanceControll conforme o planejamento aprovado. O sistema é uma aplicação web local, estática, com HTML, JavaScript puro, CSS/Tailwind e persistência em arquivos CSV, sem backend e sem banco SQL.

O app pode ser testado localmente em:

`http://127.0.0.1:4173`

## Decisões

- Mantida a arquitetura estática e modular com separação entre `html`, `css`, `js`, `data`, `vendor` e `scripts`.
- A UI foi implementada em dark mode, inspirada na referência visual enviada, com layout de dashboard, sidebar, cards, superfícies escuras, sombras suaves e acentos em azul e amarelo.
- A persistência foi implementada com CSV como fonte de dados, usando cache local do navegador e suporte a File System Access API quando o usuário conecta uma pasta no Edge/Chrome.
- Foi incluído fallback de importação/exportação de CSVs para cenários em que o navegador não permite escrita direta em arquivos locais.
- Os cálculos financeiros ficaram centralizados em serviços JS para evitar duplicação entre Dashboard e Registro de Gastos.

## Implementação

Arquivos e áreas principais criadas:

- `index.html`: shell principal da aplicação, sidebar, topbar, ações de CSV e root de telas.
- `html/dashboard.html`: tela de Dashboard com entradas, categorias, destinos, fixos, resumo mensal e projeção.
- `html/gastos.html`: tela de Registro de Gastos com formulário e listagem mensal.
- `css/theme.css`: design system visual do MVP, dark mode, responsividade, cards, tabelas, botões, estados e navegação mobile.
- `js/app.js`: bootstrap, ações globais, conexão/importação/exportação de CSVs.
- `js/router.js`: roteamento local entre Dashboard e Gastos.
- `js/state.js`: estado global de dados e filtros.
- `js/data/*`: schemas CSV, parser/unparser e repositório de persistência.
- `js/services/*`: cálculos financeiros, projeção de fixos/parcelados e validação.
- `js/screens/dashboard.js`: renderização e eventos do Dashboard.
- `js/screens/gastos.js`: renderização e eventos do Registro de Gastos.
- `data/*.csv`: arquivos iniciais com cabeçalhos.
- `vendor/*`: adaptadores locais para CSV e ícones usados pelo MVP.
- `scripts/start-local.ps1`: script para iniciar servidor estático local.

Funcionalidades entregues:

- Cadastro de múltiplas entradas mensais fixas e variáveis.
- Cadastro de categorias fixas, variáveis e parceladas.
- Cadastro de destinos, incluindo cartões com limite, conta/Pix e reserva/cofre.
- Cadastro de gastos fixos recorrentes.
- Registro de gastos do dia a dia com descrição, categoria, data, destino, valor e tipo de pagamento.
- Geração automática de parcelas futuras para categorias parceladas.
- Dashboard com renda total, saídas fixas, variáveis, parceladas, saída geral, saldo líquido e crédito disponível.
- Projeção mensal de fixos e parcelados.
- Importação/exportação de CSVs.
- Layout responsivo desktop/mobile.

## Validação

Foram executadas validações locais após a implementação:

- Checagem de sintaxe JavaScript com `node --check` em 17 arquivos JS.
- Teste de cálculo financeiro com dados sintéticos para resumo mensal e geração de parcelamento.
- Validação headless no Edge via Chrome DevTools Protocol:
  - abertura do app em `http://127.0.0.1:4173`;
  - carregamento do Dashboard;
  - cadastro de entrada;
  - cadastro de categoria parcelada;
  - cadastro de destino/cartão;
  - navegação para Registro de Gastos;
  - registro de gasto parcelado;
  - persistência dos dados em CSV/cache local;
  - verificação de layout mobile sem overflow horizontal.

Resultado da validação: MVP funcional, sem erros de página. O único aviso observado foi o aviso esperado do Tailwind CDN, relevante para produção, mas aceitável para o MVP local.

## Como está depois de implementado

O FinanceControll está pronto para teste manual local. O servidor estático foi iniciado na porta `4173`, e o app pode ser acessado por Edge/Chrome. Sem conectar uma pasta, os dados ficam no cache local do navegador e podem ser exportados por CSV. Ao clicar em "Conectar pasta", navegadores compatíveis podem gravar diretamente os arquivos CSV locais mediante permissão do usuário.

O MVP ainda não possui backend, autenticação, banco SQL, importação bancária, fechamento real de fatura por ciclo ou gráficos avançados. Esses pontos permanecem fora do escopo inicial e só devem ser implementados mediante autorização explícita.

## Próximos passos

- Testar manualmente com dados financeiros reais ou simulados do usuário.
- Ajustar regras de cartão caso seja necessário trabalhar com fechamento/vencimento de fatura em vez de mês da data de pagamento.
- Substituir Tailwind CDN por build local antes de qualquer uso mais próximo de produção.
- Avaliar melhorias futuras somente após aprovação: gráficos, metas, filtros avançados, edição detalhada e importação bancária.
