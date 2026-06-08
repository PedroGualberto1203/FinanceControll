# FinanceControll MVP

- Data: 2026-05-29
- Tipo: Plano de implementação

## Contexto

Foi aprovado o plano para criar o FinanceControll, um sistema web local para controle financeiro pessoal com foco em entradas, saídas, limites de cartão, gastos fixos e gastos parcelados. O projeto deve usar HTML, JavaScript puro, CSS com Tailwind e persistência em arquivos CSV locais, sem backend e sem banco SQL.

## Decisões

- O MVP terá duas telas principais: Dashboard e Registro de Gastos.
- A arquitetura será estática, modular e organizada por responsabilidades em `html`, `css`, `js`, `data` e `vendor`.
- A persistência será em CSV, com leitura/escrita local via File System Access API quando disponível e fallback de importação/exportação.
- A UI seguirá dark mode obrigatório, inspirada na referência visual enviada, com superfícies escuras, cards, sombras suaves, acentos azuis e amarelos e tipografia Inter.
- O escopo inicial fica restrito às funcionalidades descritas no plano aprovado.

## Plano

1. Criar arquivos CSV iniciais com cabeçalhos.
2. Criar layout principal com sidebar, topo, roteamento local e navegação entre Dashboard e Registro de Gastos.
3. Implementar repositório CSV com suporte a persistência local e fallback de exportação/importação.
4. Implementar cadastros de entradas, categorias, destinos, gastos fixos e gastos parcelados.
5. Implementar projeção mensal de fixos e parcelados.
6. Implementar cálculos centrais de renda total, saídas, saldo líquido e crédito disponível.
7. Refinar visual com tema dark, tokens de design, responsividade e estados de interação.

## Validação

A validação prevista inclui abrir a aplicação localmente, testar cadastros de entradas, categorias e destinos, registrar gastos Pix e Crédito, validar parcelamento, conferir atualização dos resumos mensais, verificar exportação/importação CSV e testar responsividade em mobile e desktop.

## Próximos passos

Implementar o MVP no workspace FinanceControll e validar os fluxos principais no navegador local.
