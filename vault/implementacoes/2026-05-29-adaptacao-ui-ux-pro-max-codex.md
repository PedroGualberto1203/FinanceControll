# Adaptacao UI/UX Pro Max para Codex

## Data
2026-05-29

## Contexto
Foi solicitado analisar o repositorio `nextlevelbuilder/ui-ux-pro-max-skill` e implementar o uso das skills de frontend neste projeto `FinanceControll`, adaptando o material originalmente voltado ao Claude para funcionar no Codex.

## Decisoes
- Usar a parte principal do repositorio como skill local Codex do projeto.
- Instalar a skill em `.codex/skills/ui-ux-pro-max` para manter a configuracao isolada ao `FinanceControll`.
- Adaptar as instrucoes para caminhos Codex-first, sem depender de `~/.claude`, `.claude`, slash commands do Claude ou fluxos especificos de Claude.
- Nao adicionar dependencias frontend ao produto apenas por mencao da skill; a regra e reutilizar o stack existente e pedir aprovacao se uma nova dependencia for realmente necessaria.

## Implementacao
- Criada a skill local `.codex/skills/ui-ux-pro-max/SKILL.md` com workflow para design system, buscas focadas e checklist de qualidade frontend.
- Copiados dados e scripts do motor UI/UX Pro Max para `.codex/skills/ui-ux-pro-max/data` e `.codex/skills/ui-ux-pro-max/scripts`.
- Criado metadata `agents/openai.yaml` para a skill local.
- Atualizado `AGENTS.md` do projeto para orientar tarefas futuras de frontend a usar essa skill local antes de UI significativa.
- Removidos artefatos temporarios usados durante a importacao, incluindo clone temporario em `.omx/imports` e cache Python `__pycache__`.

## Validacao
- Testado o gerador de design system com a consulta `personal finance dashboard fintech cashflow` para o projeto `FinanceControll`.
- Testada uma busca focada de UX/acessibilidade com `responsive forms accessibility finance dashboard`.
- Confirmada a presenca dos arquivos essenciais da skill, incluindo `SKILL.md`, scripts `search.py`, `core.py`, `design_system.py`, dados principais e stacks.
- Confirmado que a skill local possui 15 arquivos CSV de dados e 16 arquivos de stacks.

## Observacoes
- O validador oficial `quick_validate.py` nao rodou porque o Python embutido do Codex nao possui o modulo `yaml` instalado.
- Foi feita validacao manual equivalente dos caminhos obrigatorios e frontmatter.
- O diretorio atual ainda nao e um repositorio git, entao `git status --short` retornou `fatal: not a git repository`.

## Proximos passos
- Em futuras tarefas frontend, consultar `.codex/skills/ui-ux-pro-max/scripts/search.py` para gerar design system ou recomendacoes focadas antes de implementar UI relevante.
- Quando um design system definitivo for escolhido para o produto, persistir em `design-system/financecontroll/MASTER.md` ou registrar a decisao no vault.
