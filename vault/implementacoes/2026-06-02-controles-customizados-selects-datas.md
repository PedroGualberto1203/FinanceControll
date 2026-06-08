# Controles customizados para selects e datas

## Data
2026-06-02

## Contexto
Foi solicitado melhorar a UX dos campos de escolha de data e selecao, que ainda apareciam com popups nativos crus e fora do padrao dark premium/amarelo do FinanceControll.

## Decisoes
- Substituir a experiencia visual de `select`, `date` e `month` por controles customizados em JS/CSS.
- Manter os campos HTML originais no DOM como fonte de valor para preservar `FormData`, `value`, `selectedOptions`, `required` e eventos `change`.
- Usar o amarelo do sistema para foco, selecao, icones e estados ativos.
- Nao adicionar dependencia de runtime.
- Preservar campos sem `id`, usando identificador interno em `data-fc-control-id` apenas para os componentes customizados.

## Implementacao
- Criado `js/ui/field-controls.js` com `enhanceFormControls(scope)` para aprimorar globalmente selects, datas e meses.
- Integrado o enhancement ao roteador apos cada renderizacao de rota e rerender.
- Reexecutado o enhancement em estados dinamicos de dashboard e gastos, como edicao/reset de formulario.
- Adicionados estilos `.fc-control`, `.fc-popover`, `.fc-option`, `.fc-calendar`, `.fc-calendar-day` e seletor mensal em `css/theme.css`.
- Ajustada a regra de label para `.field > span`, evitando conflito visual com spans internos dos componentes.
- Adicionados icones locais `check`, `chevron-down`, `chevron-left` e `chevron-right` em `vendor/lucide-icons.js`.

## Validacao
- `npm run check` executado com sucesso.
- `node --check js\ui\field-controls.js` executado com sucesso.
- Validacao headless com Edge/Playwright em 375px, 768px, 1024px e 1440px sem overflow horizontal.
- Verificados selects, date picker, month picker, escrita nos inputs originais, evento de mudanca e navegacao basica por teclado.
- Conferida captura visual final do select aberto com texto legivel sobre amarelo e icones no padrao do sistema.

## Proximos passos
- Fazer uma passada manual final no navegador real para sentir microinteracoes com mouse/teclado.
- Considerar testes automatizados permanentes para o modulo `field-controls.js` caso a camada de UI continue crescendo.