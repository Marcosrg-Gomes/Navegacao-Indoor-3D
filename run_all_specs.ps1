#!/usr/bin/env pwsh
param([string]$project = "chrome")

$apiDir = "services/api"
$port = 8765
$specs = @(
    "tests/diag3d.spec.ts",
    "tests/scene.spec.ts",
    "tests/simulation-engine.spec.ts",
    "tests/simulation-rerouting.spec.ts",
    "tests/navigation.spec.ts",
    "tests/visitor-journey.spec.ts",
    "tests/visitor-experience.spec.ts",
    "tests/business-rules.spec.ts",
    "tests/evidence.spec.ts",
    "tests/evidence3d.spec.ts",
    "tests/layout-accessibility.spec.ts",
    "tests/map-interactions.spec.ts",
    "tests/map-orientation.spec.ts",
    "tests/map2d.spec.ts",
    "tests/mobile-navigation.spec.ts",
    "tests/mobile-wayfinding.spec.ts",
    "tests/chegada-mobile.spec.ts",
    "tests/native-support.spec.ts",
    "tests/navigation-orientation.spec.ts",
    "tests/positioning-session.spec.ts",
    "tests/scanner.spec.ts",
    "tests/simulation-catalog.spec.ts",
    "tests/simulation-context.spec.ts",
    "tests/wayfinding.spec.ts",
    "tests/waze-navigation.spec.ts",
    "tests/admin-crud.spec.ts",
    "tests/accessibility.spec.ts",
    "tests/multiuser.spec.ts",
    "tests/performance.spec.ts"
)

$totalPassed = 0
$totalFailed = 0
$failedSpecs = @()

foreach ($spec in $specs) {
    # Parar servidor anterior
    Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    
    # Iniciar servidor
    $proc = Start-Process -FilePath ".venv\Scripts\python.exe" -ArgumentList "$apiDir\mini_server.py --port $port --workers 1" -WindowStyle Hidden -PassThru
    Start-Sleep -Seconds 6
    
    # Verificar se servidor está ativo
    $t = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -WarningAction SilentlyContinue
    if (-not $t.TcpTestSucceeded) {
        Write-Host ("ERRO: Servidor não iniciou para {0}" -f $spec) -ForegroundColor Red
        continue
    }
    
    # Executar spec
    Write-Host ("=== {0} ===" -f $spec) -ForegroundColor Cyan
    Push-Location "apps/admin"
    $output = npm run test:e2e -- --project=$project "$spec" --reporter=list 2>&1 | Out-String
    Pop-Location
    
    # Extrair resultados
    $passed = 0; $failed = 0
    if ($output -match "(\d+) passed") { $passed = [int]$matches[1] }
    if ($output -match "(\d+) failed") { $failed = [int]$matches[1] }
    
    $totalPassed += $passed
    $totalFailed += $failed
    
    if ($failed -gt 0) {
        $failedSpecs += $spec
    }
    
    Write-Host ("{0}: {1} passed, {2} failed" -f $spec, $passed, $failed) -ForegroundColor Green
    
    # Parar servidor antes do próximo spec
    Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

Write-Host "`n=== RESUMO FINAL ===" -ForegroundColor Magenta
Write-Host ("Total: {0} passed, {1} failed" -f $totalPassed, $totalFailed) -ForegroundColor Magenta
if ($failedSpecs.Count -gt 0) {
    Write-Host "Specs com falhas:" -ForegroundColor Red
    foreach ($s in $failedSpecs) { Write-Host ("  {0}" -f $s) -ForegroundColor Red }
}
