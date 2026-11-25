# Inicia o servidor uvicorn diretamente em background
$ErrorActionPreference = "Stop"

# Mata processos python existentes
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Configura variáveis de ambiente
$env:DATABASE_URL = "sqlite:///" + ([System.IO.Path]::GetTempPath() + "indoor-uvicorn.db")
$env:ADMIN_API_KEY = "audit-local-admin-key-with-32-characters"
$env:ADMIN_API_KEYS = "{}"
$env:SECRET_KEY = "audit-local-only"

# Inicia o servidor uvicorn
$process = Start-Process -FilePath "C:\Users\marco\OneDrive\Documentos\ChatGPT\Navegacao-Indoor-3D\.venv\Scripts\python.exe" `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8765", "--workers", "1" `
    -WorkingDirectory "C:\Users\marco\OneDrive\Documentos\ChatGPT\Navegacao-Indoor-3D\services/api" `
    -PassThru

Write-Host "Servidor uvicorn iniciado com PID: $($process.Id)"

# Espera o servidor ficar disponível
for ($i = 0; $i < 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:8765/api/shoppings" -Method Get -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "Servidor disponível na porta 8765"
            break
        }
    } catch {
        # Servidor ainda não está disponível, continua esperando
    }
}

# Mantém o script vivo para manter o servidor rodando
while ($true) {
    Start-Sleep -Seconds 60
}
