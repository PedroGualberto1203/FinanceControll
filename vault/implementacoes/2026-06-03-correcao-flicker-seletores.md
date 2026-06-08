# Correcao do flicker nos seletores

## Data
2026-06-03

## Contexto
A ultima implementacao de UX dos seletores customizados de opcao, data e mes deixou um bug visual: ao abrir, reabrir, trocar datas, navegar meses/anos ou selecionar valores, os popovers piscavam. O comportamento causava incomodo visual porque a caixa de selecao/calendario parecia ser recriada a cada interacao.

## Decisoes
- Priorizar estabilidade visual em vez de manter animacao de entrada nos popovers.
- Manter o comportamento funcional dos controles: abrir, navegar por teclado, selecionar, limpar quando permitido, fechar com Escape/clique externo e preservar foco acessivel.
- Corrigir sem novas dependencias e sem alterar dados, regras de negocio, APIs ou persistencia.

## Implementacao
- `js/ui/field-controls.js`: os renders de `select`, `date` e `month` passaram a preservar o shell/trigger/popover quando o controle ja esta aberto, atualizando apenas atributos e conteudo interno.
- `js/ui/field-controls.js`: selecoes agora fecham o popover antes de disparar `change`, evitando um ultimo redesenho visivel antes do rerender da tela.
- `css/theme.css`: removida a animacao `fc-popover-in`, que era reaplicada quando o DOM do popover era recriado.
- `scripts/check.ps1`: incluido `js\ui\field-controls.js` na verificacao `node --check`.

## Validacao
- `node --check js\ui\field-controls.js`: aprovado.
- `npm run check`: aprovado.
- Validacao headless com Edge local em `http://127.0.0.1:4173`:
  - seletor de ano manteve o mesmo popover durante navegacao por teclado;
  - seletor de mes manteve o mesmo popover ao avancar/voltar ano;
  - calendario de data manteve o mesmo popover ao avancar/voltar mes;
  - `animationName` retornou `none` nos popovers testados.

## Proximos passos
- Fazer uma verificacao visual manual no navegador aberto em `http://127.0.0.1:4173`, especialmente nos formularios de Dashboard e Gastos.
- Se algum controle especifico ainda apresentar instabilidade, instrumentar aquele fluxo isoladamente e corrigir no mesmo componente central.
