# Correcao do seletor de ano nas telas

## Data
2026-06-03

## Contexto
Nas telas com filtro de ano, ao abrir o seletor customizado o bloco de cabecalho ficava visualmente bugado. O texto do hero, como "Resumo mensal", podia sumir ou ficar parcialmente deslocado. O problema aparecia em Dashboard, Resumo e Projecao, Gastos e Recorrentes.

## Decisoes
- Corrigir o problema no componente central de controles customizados e no CSS do hero, sem alterar cada tela individualmente.
- Manter o seletor customizado existente, sem voltar para o select nativo.
- Nao alterar calculos, filtros, persistencia, templates HTML ou regras de negocio.
- Nao adicionar novas dependencias.

## Implementacao
- `css/theme.css`: `.hero-strip` passou a usar `overflow: visible`, permitindo que o popover do seletor escape do bloco sem ser recortado.
- `css/theme.css`: adicionado `z-index: 2` ao `.hero-strip` para manter o dropdown acima dos paineis seguintes enquanto aberto.
- `js/ui/field-controls.js`: substituido o uso de `scrollIntoView` por `keepSelectOptionInView`, que ajusta apenas o `scrollTop` da propria `.fc-select-popover`.
- A nova rolagem interna mantem o ano ativo visivel sem rolar ancestrais como `.hero-strip`, `body` ou `view-root`.

## Validacao
- `npm run check`: aprovado.
- Validacao visual headless com Edge local em `http://127.0.0.1:4173`: aprovado para Dashboard, Resumo e Projecao, Gastos e Recorrentes nos viewports 375px, 768px, 1024px e 1440px.
- Validacao de teclado headless: `Enter`, `ArrowDown`, `Enter` para selecionar e `Escape` para fechar aprovados nos mesmos 4 fluxos e 4 viewports.

## Proximos passos
- Fazer uma conferencia visual manual rapida no navegador se o layout for alterado novamente no futuro.
- Se novos filtros forem adicionados em heroes compactos, reutilizar o mesmo controle central para evitar regressao.
