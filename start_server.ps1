# Inicia o servidor de auditoria em background e mantém o processo vivo
$ErrorActionPreference = "Stop"

# Mata processos python existentes
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Inicia o servidor
$process = Start-Process -FilePath "C:\Users\marco\OneDrive\Documentos\ChatGPT\Navegacao-Indoor-3D\.venv\Scripts\python.exe" `
    -ArgumentList "services/api/mini_server.py --port 8765" `
    -WorkingDirectory "C:\Users\marco\OneDrive\Documentos\ChatGPT\Navegacao-Indoor-3D" `
    -PassThru

Write-Host "Servidor iniciado com PID: $($process.Id)"

# Espera o servidor ficar disponível
for ($i = 0; $i -lt 30; $i++) {
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
