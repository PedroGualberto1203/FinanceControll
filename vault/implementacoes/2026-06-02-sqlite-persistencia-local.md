# SQLite persistencia local

- Data: 2026-06-02
- Tipo: Implementacao

## Contexto

O FinanceControll armazenava a fonte principal dos dados em CSV/localStorage no navegador. Ao limpar cache/dados do navegador, os dados sumiam. A decisao foi migrar a persistencia principal para SQLite local, mantendo CSV apenas como importacao, exportacao, seed e backup manual.

## Decisoes

- Usar SQLite local em vez de banco SQL via Docker nesta etapa.
- Manter o app local/single-user, sem autenticacao e sem dependencias npm novas.
- Criar o banco em storage/financecontroll.sqlite3 dentro da pasta do projeto e proteger esse caminho com .gitignore.
- Aproveitar o servidor Python local existente e usar sqlite3 da biblioteca padrao.
- Preservar a interface publica usada pelas telas: init, getAll, append, appendMany, replace, update, remove, reload, exportAll, importFiles e syncRecurringGeneratedExpenses.
- Manter CSV como interoperabilidade e backup, nao mais como fonte principal de persistencia.

## Implementacao

- Criado backend SQLite em Python com schema, store, import/export CSV e rotas HTTP JSON.
- Adicionados endpoints /api/health, /api/data e /api/collections/:collection para CRUD das colecoes.
- Criadas tabelas para entradas, gastos, categorias, destinos e recorrencias_fixas, preservando os campos do schema CSV existente.
- Adicionados schema_migrations, indices, WAL, busy_timeout e backup antes de migracoes futuras.
- Substituida a persistencia frontend por ApiRepository, mantendo compatibilidade com o contrato anterior do CsvRepository.
- Implementada migracao unica de dados legados do localStorage para SQLite quando ainda existirem registros antigos no navegador.
- Atualizada a UI da sidebar de CSV local para Banco local, mantendo importar/exportar CSV.
- Atualizado npm run check para validar JavaScript, compilar Python e rodar testes automatizados.

## Validacao

- npm run check executado com sucesso.
- Testes Python passaram: 5 testes OK.
- /api/health respondeu com SQLite ativo e schemaVersion 1.
- Servidor atualizado ficou rodando em http://127.0.0.1:4173, porta usada pelo fluxo do Rider/npm run dev.
- Confirmado que a porta temporaria 4175 nao ficou em uso.

## Proximos passos

- Fazer teste manual completo criando entrada, gasto, categoria, destino e recorrencia pelo navegador.
- Limpar cache/dados do navegador e confirmar que os dados persistem porque a fonte de verdade agora e storage/financecontroll.sqlite3.
- Considerar uma tela futura de backup/restauracao explicita para o arquivo SQLite, alem da exportacao CSV.

