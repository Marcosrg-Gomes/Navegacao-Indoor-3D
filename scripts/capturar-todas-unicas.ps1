# ========================================
# Captura de TODAS as telas - uma por uma
# Servidor dedicado para cada tela, com verificação de tamanho
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CAPTURA DE TODAS AS TELAS (22)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseUrl = "http://127.0.0.1:8766"
$outDir = "evidence\prints-telas"
$pythonExe = "C:\Users\marco\OneDrive\Documentos\ChatGPT\Navegacao-Indoor-3D\.venv\Scripts\python.exe"
$minKB = 20  # tamanho mínimo esperado para considerar que tem conteúdo

# Array de telas: Nome | URL | Largura | Altura | Descricao
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

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$ok = 0
$falha = 0

for ($i = 0; $i -lt $telas.Count; $i++) {
    $t = $telas[$i]
    $arquivo = "$outDir\$($t.nome).png"
    Write-Host "`n[$($i + 1)/$($telas.Count)] $($t.nome) - $($t.desc)" -ForegroundColor Yellow

    $capturado = $false
    for ($tentativa = 1; $tentativa -le 3; $tentativa++) {
        Write-Host "  [Servidor] Iniciando uvicorn (tentativa $tentativa/3)..." -ForegroundColor DarkGray
        Start-Process cmd.exe -ArgumentList "/c", "$pythonExe -m uvicorn app.main:app --host 127.0.0.1 --port 8766 > C:\Users\marco\AppData\Local\Temp\opencode\uvicorn_cap.log 2>&1" -WorkingDirectory "services/api"
        Start-Sleep -Seconds 15

        Write-Host "  [Captura] Executando Node.js..." -ForegroundColor DarkGray
        & node scripts/capturar-tela-unica.mjs $t.nome $t.url $t.w $t.h
        $exitCode = $LASTEXITCODE

        if ($exitCode -ne 0) {
            Write-Host "  [FALHA] Node.js saiu com codigo $exitCode" -ForegroundColor Red
            Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
            Start-Sleep -Seconds 5
            continue
        }

        # Verificar tamanho do arquivo
        if (Test-Path $arquivo) {
            $tamanhoBytes = (Get-Item $arquivo).Length
            $tamanhoKB = [math]::Round($tamanhoBytes / 1KB, 1)
            Write-Host "  [Arquivo] $($t.nome).png - $tamanhoKB KB" -ForegroundColor DarkGray

            if ($tamanhoKB -ge $minKB) {
                $capturado = $true
                $ok++
                Write-Host "  [OK] $($t.nome) ($tamanhoKB KB)" -ForegroundColor Green
                break
            } else {
                Write-Host "  [AVISO] Arquivo muito pequeno ($tamanhoKB KB), pode estar em branco. Tentando novamente..." -ForegroundColor Yellow
                Remove-Item $arquivo -Force
            }
        } else {
            Write-Host "  [FALHA] Arquivo nao foi gerado" -ForegroundColor Red
        }

        Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Seconds 5
    }

    if (-not $capturado) {
        $falha++
        Write-Host "  [FALHA FINAL] $($t.nome) nao foi capturado com sucesso apos 3 tentativas" -ForegroundColor Red
    }

    # Encerrar servidor antes da proxima tela
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 3
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  CONCLUIDO: $ok OK, $falha falha(s)" -ForegroundColor Green
Write-Host "  Prints salvos em: $outDir" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
