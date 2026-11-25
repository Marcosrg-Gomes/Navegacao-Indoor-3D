# ========================================
# Captura de TODAS as telas - um por um
# Sobe o servidor, captura uma tela, encerra, repete
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CAPTURA DE TODAS AS TELAS (22)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseUrl = "http://127.0.0.1:8766"
$outDir = "evidence\prints-telas"
$pythonExe = "C:\Users\marco\OneDrive\Documentos\ChatGPT\Navegacao-Indoor-3D\.venv\Scripts\python.exe"

# Array de telas: Nome | URL | Largura | Altura | Descricao (apenas ASCII)
$telas = @(
    @{ nome="v-desktop-entrada-qr"; url="$baseUrl/?qr=MINI-ENTRADA-PRINCIPAL"; w=1280; h=800; desc="Visitante - mapa 2D com origem por QR" },
    @{ nome="v-desktop-origem-manual"; url="$baseUrl/?manualOrigin=1"; w=1280; h=800; desc="Visitante - selecao manual de origem" },
    @{ nome="v-desktop-locate"; url="$baseUrl/?locate=1"; w=1280; h=800; desc="Visitante - localizar posicao no mapa" },
    @{ nome="v-desktop-explorar"; url="$baseUrl/(tabs)/explore"; w=1280; h=800; desc="Visitante - explorar destinos (desktop)" },
    @{ nome="v-desktop-explorar-filtros"; url="$baseUrl/(tabs)/explore?shortcut=shops&status=aberto"; w=1280; h=800; desc="Visitante - explorar com filtros (desktop)" },
    @{ nome="v-desktop-scan"; url="$baseUrl/(tabs)/scan"; w=1280; h=800; desc="Visitante - ler QR Code (desktop)" },
    @{ nome="v-mobile-entrada-qr"; url="$baseUrl/?qr=MINI-ENTRADA-PRINCIPAL"; w=375; h=667; desc="Visitante mobile - mapa 2D com origem por QR" },
    @{ nome="v-mobile-origem-manual"; url="$baseUrl/?manualOrigin=1"; w=375; h=667; desc="Visitante mobile - selecao manual de origem" },
    @{ nome="v-mobile-explorar"; url="$baseUrl/(tabs)/explore"; w=375; h=667; desc="Visitante mobile - explorar destinos" },
    @{ nome="v-mobile-scan"; url="$baseUrl/(tabs)/scan"; w=375; h=667; desc="Visitante mobile - ler QR Code" },
    @{ nome="a-desktop-login"; url="$baseUrl/admin/login"; w=1280; h=800; desc="Admin - login" },
    @{ nome="a-desktop-dashboard"; url="$baseUrl/admin/"; w=1280; h=800; desc="Admin - dashboard" },
    @{ nome="a-desktop-shoppings"; url="$baseUrl/admin/shoppings"; w=1280; h=800; desc="Admin - shoppings" },
    @{ nome="a-desktop-pisos"; url="$baseUrl/admin/pisos"; w=1280; h=800; desc="Admin - pisos" },
    @{ nome="a-desktop-nos"; url="$baseUrl/admin/nos"; w=1280; h=800; desc="Admin - nos do grafo" },
    @{ nome="a-desktop-arestas"; url="$baseUrl/admin/arestas"; w=1280; h=800; desc="Admin - arestas" },
    @{ nome="a-desktop-lojas"; url="$baseUrl/admin/lojas"; w=1280; h=800; desc="Admin - lojas" },
    @{ nome="a-desktop-categorias"; url="$baseUrl/admin/categorias"; w=1280; h=800; desc="Admin - categorias" },
    @{ nome="a-desktop-qr"; url="$baseUrl/admin/qr"; w=1280; h=800; desc="Admin - QR Codes" },
    @{ nome="a-desktop-validacao"; url="$baseUrl/admin/validacao"; w=1280; h=800; desc="Admin - validacao de cena" },
    @{ nome="a-desktop-cena-3d"; url="$baseUrl/admin/cena-3d"; w=1280; h=800; desc="Admin - cena 3D" },
    @{ nome="a-desktop-auditoria"; url="$baseUrl/admin/auditoria"; w=1280; h=800; desc="Admin - auditoria" }
)

# Garante diretorio de saida
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$ok = 0
$falha = 0

for ($i = 0; $i -lt $telas.Count; $i++) {
    $t = $telas[$i]
    Write-Host "`n[$($i + 1)/$($telas.Count)] $($t.nome) - $($t.desc)" -ForegroundColor Yellow

    # 1. Inicia o servidor uvicorn
    Write-Host "  [Servidor] Iniciando uvicorn na porta 8766..." -ForegroundColor DarkGray
    Start-Process cmd.exe -ArgumentList "/c", "$pythonExe -m uvicorn app.main:app --host 127.0.0.1 --port 8766 > C:\Users\marco\AppData\Local\Temp\opencode\uvicorn_cap.log 2>&1" -WorkingDirectory "services/api"

    # 2. Aguarda o servidor inicializar (15 segundos)
    Write-Host "  [Servidor] Aguardando inicializacao (15s)..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 15

    # 3. Captura a tela com Node.js
    Write-Host "  [Captura] Executando Node.js..." -ForegroundColor DarkGray
    & node scripts/capturar-uma-tela.mjs $t.url $t.nome $t.w $t.h
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] $($t.nome)" -ForegroundColor Green
        $ok++
    } else {
        Write-Host "  [FALHA] $($t.nome) (codigo de saida $LASTEXITCODE)" -ForegroundColor Red
        $falha++
    }

    # 4. Encerra o servidor antes da proxima tela
    Write-Host "  [Servidor] Encerrando processos Python..." -ForegroundColor DarkGray
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 5
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  CONCLUIDO: $ok OK, $falha falha(s)" -ForegroundColor Green
Write-Host "  Prints salvos em: $outDir" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
