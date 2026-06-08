$ErrorActionPreference = "Stop"

<<<<<<< HEAD
$defaultPort = 4173
$root = Split-Path -Parent $PSScriptRoot
$bundledPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

function Test-PortAvailable {
  param([int]$Candidate)

  $listener = $null
  try {
    $address = [System.Net.IPAddress]::Parse("127.0.0.1")
    $listener = [System.Net.Sockets.TcpListener]::new($address, $Candidate)
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    if ($listener) {
      $listener.Stop()
    }
  }
}

function Resolve-DevPort {
  $hasExplicitPort = -not [string]::IsNullOrWhiteSpace($env:PORT)
  $preferredPort = if ($hasExplicitPort) { $env:PORT } else { $defaultPort }

  if (-not ("$preferredPort" -match "^\d+$")) {
    throw "PORT deve ser uma porta numerica."
  }

  $preferredPort = [int]$preferredPort
  if ($preferredPort -lt 1 -or $preferredPort -gt 65535) {
    throw "PORT deve estar entre 1 e 65535."
  }

  if ($hasExplicitPort) {
    if (Test-PortAvailable $preferredPort) {
      return $preferredPort
    }

    throw "A porta PORT=$preferredPort ja esta em uso. Escolha outra porta ou encerre o processo atual."
  }

  for ($candidate = $preferredPort; $candidate -le ($preferredPort + 100); $candidate++) {
    if (Test-PortAvailable $candidate) {
      if ($candidate -ne $defaultPort) {
        Write-Host "Porta $defaultPort em uso; usando $candidate."
      }

      return $candidate
    }
  }

  throw "Nenhuma porta livre encontrada entre $preferredPort e $($preferredPort + 100)."
}

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

$port = Resolve-DevPort
$python = Resolve-Python
if (-not $python) {
  throw "Python nao encontrado. Instale Python ou use o runtime empacotado do Codex."
}

Set-Location $root
Write-Host "FinanceControll em http://127.0.0.1:$port"
& $python (Join-Path $PSScriptRoot "no-cache-server.py") $port
=======
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
>>>>>>> origin/main
