# ========================================
# Captura de telas - Navegacao Indoor 3D
# ========================================
Write-Host "`n[1/2] Instalando navegador Chromium do Playwright (só na primeira vez)..." -ForegroundColor Cyan

# Pula confirmação interativa do npx
$env:PLAYWRIGHT_NO_PROMPT = "1"
npx --prefix apps/admin playwright install chromium 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERRO ao instalar o Chromium." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "`n[2/2] Tirando prints de todas as telas..." -ForegroundColor Cyan
node scripts/capturar-todas-telas.mjs
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERRO durante a captura. Veja a mensagem acima." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Concluido! Prints salvos em:" -ForegroundColor Green
Write-Host "    evidence\prints-telas\" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
pause
