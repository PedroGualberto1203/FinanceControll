# Recorrentes sincronizados e listas compactas

## Data

2026-06-01

## Contexto

Foi corrigido o fluxo de gastos recorrentes do FinanceControll para que despesas fixas e parceladas gerem lançamentos reais em `gastos.csv` nos meses correspondentes. O problema observado era que uma recorrência parcelada de fevereiro de 2026 a janeiro de 2027 aparecia na lista de recorrentes, mas não entrava automaticamente nos meses cobertos, como julho de 2026.

Também foi ajustada a visualização de Categorias e Destinos, pois listas com muitos itens deixavam a seção muito extensa verticalmente.

## Decisões

- Recorrências salvas devem gerar lançamentos reais em `gastos.csv`, usando `grupo_id` igual ao id da recorrência.
- A sincronização de recorrências deve ser idempotente: cria somente lançamentos faltantes e não duplica ao recarregar, importar CSVs ou reconectar a pasta.
- Lançamentos já existentes, pagos ou editados manualmente não devem ser sobrescritos.
- Parcelados usam o valor informado como valor da parcela, não como valor total.
- Dados legados podem ser inferidos como parcelados quando houver `tipo_recorrencia=parcelada`, `parcelas_total > 1` ou categoria antiga marcada como parcelada.
- Recorrências fixas antigas sem período final suficiente não têm meses inventados automaticamente; ficam visíveis para correção manual.
- Categorias e Destinos devem iniciar compactados quando houver mais de 5 itens.

## Implementação

- Criada sincronização idempotente em `js/services/recurring-service.js` para varrer `recorrencias_fixas` e gerar lançamentos faltantes em `gastos.csv`.
- O repositório CSV passou a executar a sincronização ao carregar, recarregar, importar CSVs e conectar pasta.
- O cadastro de recorrentes no dashboard passou a salvar a recorrência e chamar a sincronização compartilhada, em vez de depender de uma geração isolada no submit.
- Parcelados agora geram descrições com sequência automática, como `1/12`, `6/12` e `12/12`, nos meses corretos.
- Categorias e Destinos receberam controle no cabeçalho da seção com contador, por exemplo `5 de 12`, e botão acessível `Ver mais` / `Ver menos` com `aria-expanded`.
- O servidor local foi ajustado para servir arquivos com `Cache-Control: no-store`, reduzindo risco de o navegador manter JavaScript antigo durante desenvolvimento.

## Validação

- `node --check` executado nos módulos JavaScript alterados com sucesso.
- `npm run check` executado com sucesso.
- `python -m py_compile` executado no servidor local sem cache com sucesso.
- Teste funcional via Node confirmou:
  - parcelado 12x iniciado em fevereiro de 2026 gera lançamentos até janeiro de 2027;
  - julho de 2026 aparece como parcela `6/12`;
  - janeiro de 2027 aparece como parcela `12/12`;
  - despesa fixa com intervalo gera todos os meses do período;
  - segunda sincronização não duplica lançamentos;
  - categoria legada parcelada ainda permite inferir parcelamento.
- Servidor local validado retornando cabeçalho `Cache-Control: no-store`.

## Próximos passos

- Ao encontrar recorrências fixas antigas sem mês final, editar ou recriar com intervalo explícito.
- Fazer uma passada visual manual no navegador com dados reais para confirmar o comportamento das listas compactas em desktop e mobile.
