@echo off
chcp 65001 >nul
echo ========================================
echo  Captura de telas - Navegacao Indoor 3D
echo ========================================
echo.

echo [1/2] Instalando navegador Chromium do Playwright (só na primeira vez)...
npx playwright install chromium
if %ERRORLEVEL% neq 0 (
    echo ERRO ao instalar o Chromium.
    pause
    exit /b 1
)

echo.
echo [2/2] Tirando prints de todas as telas...
node scripts/capturar-todas-telas.mjs
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERRO durante a captura. Veja a mensagem acima.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Concluido! Prints salvos em:
echo    evidence\prints-telas\
echo ========================================
pause
