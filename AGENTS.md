# FinanceControll Agent Instructions

## Registro no vault

Quando o usuário disser algo relacionado a "Registre no vault", registrar o resumo do que foi discutido, planejado, implementado ou validado em arquivos Markdown dentro deste diretório exclusivo do vault:

`C:\Users\PedroGualberto\OneDrive - DOTKON TECNOLOGIA LTDA\Documentos\PortalDotkon\vault\FinanceControll`

Não registrar notas deste projeto em outras pastas do vault `PortalDotkon`.

### Formato dos registros

- Planos: `planos/YYYY-MM-DD-titulo.md`
- Implementações: `implementacoes/YYYY-MM-DD-titulo.md`
- Discussões e decisões: `discussoes/YYYY-MM-DD-titulo.md`

Cada registro deve conter, quando aplicável:

- Data
- Contexto
- Decisões
- Implementação ou plano
- Validação
- Próximos passos

Atualizar `00-index.md` quando um novo registro relevante for criado.

## Frontend UI/UX

Para tarefas de frontend que envolvam criar, redesenhar, revisar ou melhorar interfaces, usar a skill local:

`C:\Users\PedroGualberto\OneDrive - DOTKON TECNOLOGIA LTDA\Documentos\FinanceControll\.codex\skills\ui-ux-pro-max\SKILL.md`

Antes de implementar UI significativa, consultar o gerador local de design system em `.codex\skills\ui-ux-pro-max\scripts\search.py` e transformar as recomendações em tokens, componentes, layout, acessibilidade e estados de interação coerentes com o stack existente do projeto.

Nao usar caminhos ou comandos especificos do Claude, como `~/.claude`, `.claude` ou slash commands. Esta adaptacao e local para Codex neste projeto.
