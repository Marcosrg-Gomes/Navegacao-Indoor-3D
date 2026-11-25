# Executar servidor e testes de acessibilidade juntos
$env:AUDIT_URL = 'http://127.0.0.1:8766'
$env:AUDIT_REPORT = '../../evidence/accessibility-final.json'

# Iniciar servidor em background
Start-Process -FilePath ".venv\Scripts\python.exe" -ArgumentList "services/api/mini_server.py --port 8766" -WorkingDirectory "." -NoNewWindow

# Aguardar servidor iniciar
Write-Host "Aguardando servidor iniciar..."
Start-Sleep -Seconds 5

# Verificar se servidor está online
$tentativas = 0
while ($tentativas -lt 30) {
    try {
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:8766/health" -TimeoutSec 2
        Write-Host "Servidor online!"
        break
    } catch {
        Start-Sleep -Seconds 1
        $tentativas++
    }
}

if ($tentativas -eq 30) {
    Write-Host "ERRO: Servidor não iniciou"
    exit 1
}

# Executar testes de acessibilidade
Write-Host "Executando testes de acessibilidade..."
npx playwright test --project=chromium tests/accessibility.spec.ts --reporter=list