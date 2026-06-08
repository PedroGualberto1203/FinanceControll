# 05 - Categorias e reclassificacao

## Data base
2026-06-03

## Fonte principal
`js/services/category-service.js`

## Regra de reclassificacao
Quando o tipo de uma categoria e editado, a regra pode atualizar `tipo_gasto` de gastos existentes.

O novo tipo aplicado ao gasto e:
- `fixa` quando a categoria editada tem `tipo === "fixa"`.
- `variavel` em qualquer outro caso.

## Gastos que podem ser reclassificados
Um gasto so e reclassificado quando todas as condicoes abaixo forem verdadeiras:
- `categoria_id` e igual ao id da categoria editada.
- `grupo_id` esta vazio, ou seja, o gasto e manual.
- `pago` nao e verdadeiro.
- `tipo_gasto` nao e `parcelada`.
- `tipo_gasto` atual e diferente do novo tipo.

## Gastos que nao sao alterados
- Gastos pagos.
- Gastos gerados por recorrencia, pois possuem `grupo_id`.
- Gastos parcelados.
- Gastos de outras categorias.
- Gastos que ja possuem o tipo correto.

## Auditoria de alteracao
Quando um gasto e reclassificado:
- `tipo_gasto` recebe o novo tipo.
- `atualizado_em` recebe a data atual.

## Racional
A categoria governa apenas gastos manuais pendentes. Gastos pagos sao historico fechado. Gastos gerados por recorrencia devem ser governados pela propria recorrencia, nao por uma edicao indireta da categoria.

## Cenario validado em teste
Ao mudar uma categoria para `fixa`, somente o gasto manual, pendente, nao parcelado e da mesma categoria muda de `variavel` para `fixa`. Gasto pago, gasto gerado, gasto parcelado e gasto de outra categoria permanecem inalterados.
