$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$bundledPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

function Resolve-Python {
  foreach ($candidate in @($bundledPython, "python", "python3")) {
    $pythonPath = $null

    if (Test-Path -LiteralPath $candidate) {
      $pythonPath = (Resolve-Path -LiteralPath $candidate).Path
    } else {
      $command = Get-Command $candidate -ErrorAction SilentlyContinue
      if ($command) {
        $pythonPath = $command.Source
      }
    }

    if (-not $pythonPath) {
      continue
    }

    if ($pythonPath -like "*\Microsoft\WindowsApps\python*.exe") {
      continue
    }

    try {
      $version = & $pythonPath --version 2>&1
      if ($LASTEXITCODE -eq 0 -and "$version" -match "^Python 3\.") {
        return $pythonPath
      }
    } catch {
      continue
    }
  }

  return $null
}

$python = Resolve-Python
if (-not $python) {
  throw "Python nao encontrado. Instale Python ou use o runtime empacotado do Codex."
}

Set-Location $root

function Invoke-Checked {
  param(
    [string]$Command,
    [string[]]$Arguments
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Comando falhou: $Command $($Arguments -join ' ')"
  }
}

$jsFiles = @(
  "js\app.js",
  "js\data\api-repository.js",
  "js\data\csv-repository.js",
  "js\data\csv-schema.js",
  "js\data\csv-utils.js",
  "js\screens\dashboard.js",
  "js\screens\gastos.js",
  "js\services\category-service.js",
  "js\services\finance-service.js",
  "js\services\projection-service.js",
  "js\services\recurring-service.js",
  "js\services\validation-service.js",
  "js\state.js"
)

foreach ($file in $jsFiles) {
  Invoke-Checked "node" @("--check", $file)
}

Invoke-Checked $python @(
  "-m",
  "py_compile",
  "scripts\no-cache-server.py",
  "scripts\sqlite_schema.py",
  "scripts\sqlite_store.py",
  "scripts\csv_io.py"
)

Invoke-Checked "node" @("--test", "tests\finance_services.test.mjs")

Invoke-Checked $python @("-m", "unittest", "discover", "-s", "tests")
