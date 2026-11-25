#!/usr/bin/env pwsh
# Executa testes Playwright spec por spec, reiniciando o servidor quando necessário

$adminDir = "apps/admin"
$apiDir = "services/api"
$port = 8765
$results = New-Object System.Collections.ArrayList

function Start-Server {
    Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    $proc = Start-Process -FilePath ".venv\Scripts\python.exe" -ArgumentList "$apiDir\audit_server.py --port $port --workers 1" -WindowStyle Hidden -PassThru
    Start-Sleep -Seconds 6
    return $proc
}

function Test-PortLocal {
    $t = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -WarningAction SilentlyContinue
    return $t.TcpTestSucceeded
}

function Ensure-Server {
    if (-not (Test-PortLocal)) {
        Write-Host "Servidor caiu, reiniciando..." -ForegroundColor Yellow
        Start-Server
    }
}

function Run-Spec {
    param([string]$spec)
    Ensure-Server
    Write-Host "Executando: $spec" -ForegroundColor Cyan
    $output = npm run test:e2e -- --project=chrome "$spec" --reporter=list 2>&1 | Out-String
    $passedCount = 0
    $failedCount = 0
    if ($output -match "(\d+) passed") { $passedCount = [int]$matches[1] }
    if ($output -match "(\d+) failed") { $failedCount = [int]$matches[1] }
    $result = New-Object PSObject
    $result | Add-Member -MemberType NoteProperty -Name Spec -Value $spec
    $result | Add-Member -MemberType NoteProperty -Name Passed -Value $passedCount
    $result | Add-Member -MemberType NoteProperty -Name Failed -Value $failedCount
    $result | Add-Member -MemberType NoteProperty -Name Output -Value $output
    $results.Add($result) | Out-Null
    Write-Host ("  {0}: {1} passed, {2} failed" -f $spec, $passedCount, $failedCount) -ForegroundColor Green
}

# Lista de specs do Chrome
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

# Iniciar servidor
$serverProc = Start-Server

# Executar cada spec
foreach ($spec in $specs) {
    Run-Spec -spec $spec
}

# Resumo
Write-Host "`n=== RESUMO ===" -ForegroundColor Magenta
$totalPassed = 0
$totalFailed = 0
foreach ($r in $results) {
    $totalPassed += [int]$r.Passed
    $totalFailed += [int]$r.Failed
    Write-Host ("{0}: {1} passed, {2} failed" -f $r.Spec, $r.Passed, $r.Failed)
}
Write-Host ("Total: {0} passed, {1} failed" -f $totalPassed, $totalFailed) -ForegroundColor Magenta

# Parar servidor
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
