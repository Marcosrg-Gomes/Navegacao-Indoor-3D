#!/usr/bin/env pwsh
param([string]$spec)

$port = 8765

# Parar processos existentes
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Iniciar servidor com audit_server.py (funciona com workers via string de importação)
Start-Process -FilePath ".venv\Scripts\python.exe" -ArgumentList "services/api/audit_server.py --port $port --workers 1" -WindowStyle Hidden -PassThru | Out-Null
Start-Sleep -Seconds 6

# Verificar se servidor está ativo
$t = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -WarningAction SilentlyContinue
if (-not $t.TcpTestSucceeded) {
    Write-Host "ERRO: Servidor não iniciou na porta $port" -ForegroundColor Red
    exit 1
}

Write-Host "Servidor ativo na porta $port" -ForegroundColor Green

# Executar o spec no diretório do admin
Push-Location "apps/admin"
npm run test:e2e -- --project=chrome "$spec" --reporter=list 2>&1
Pop-Location

# Parar servidor
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
