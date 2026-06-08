# FinanceControll

Sistema web local para controle financeiro pessoal com HTML, JavaScript, Python e SQLite.

## Requisitos no macOS

- Node.js 20 ou superior
- npm
- Python 3

Nao ha dependencias npm externas neste momento; o projeto usa bibliotecas versionadas em `vendor/`.

## Rodar localmente

```bash
npm run dev
```

Por padrao a aplicacao tenta abrir em:

```text
http://127.0.0.1:4173
```

Se essa porta estiver ocupada, o script usa a proxima porta livre e mostra a URL correta no terminal.

Para usar outra porta:

```bash
PORT=4200 npm run dev
```

## Validar o projeto

```bash
npm run check
```

Esse comando verifica a sintaxe dos arquivos JavaScript, compila os scripts Python e executa os testes de servicos e persistencia.

## Windows

Os scripts PowerShell originais continuam disponiveis:

```bash
npm run dev:windows
npm run check:windows
```
