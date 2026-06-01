$ErrorActionPreference = "Stop"

$port = if ($env:PORT) { $env:PORT } else { "4173" }
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
Write-Host "FinanceControll em http://127.0.0.1:$port"
& $python (Join-Path $PSScriptRoot "no-cache-server.py") $port
