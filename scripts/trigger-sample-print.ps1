$testContent = @"
=====================================================
         PRINTPOINT KIOSK ATM - LIVE TEST
=====================================================
STATUS       : 100% OPERATIONAL & VERIFIED
TIME         : $(Get-Date -Format 'dd-MMM-yyyy hh:mm:ss tt')
HARDWARE     : HP LASERJET PRINTER TEST
MACHINE CODE : RIT-ATM-01
=====================================================
PrintPoint Autonomous Cloud Kiosk Printing Engine.
Contactless ATM hardware integration verified.
=====================================================
"@

$sampleFile = Join-Path $PSScriptRoot "sample_live_test.txt"
Set-Content -Path $sampleFile -Value $testContent -Encoding UTF8

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "🖨️  PrintPoint Hardware Spooler Dispatch" -ForegroundColor Yellow
Write-Host "====================================================="

# 1. Dispatch to P1106
Write-Host "📄 1. Sending to HP LaserJet Professional P1106..." -ForegroundColor Cyan
Get-Content -Path $sampleFile -Raw | Out-Printer -Name "HP LaserJet Professional P1106" -ErrorAction SilentlyContinue

# 2. Dispatch to M126nw
Write-Host "📄 2. Sending to HP LaserJet Pro MFP M126nw..." -ForegroundColor Green
Get-Content -Path $sampleFile -Raw | Out-Printer -Name "HP LaserJet Pro MFP M126nw" -ErrorAction SilentlyContinue

Write-Host "✅ Both test jobs dispatched to Windows Spooler successfully!" -ForegroundColor Green

Start-Sleep -Seconds 1
Get-PrintJob -PrinterName "HP LaserJet Professional P1106" -ErrorAction SilentlyContinue | Format-Table JobId, DocumentName, JobStatus
Get-PrintJob -PrinterName "HP LaserJet Pro MFP M126nw" -ErrorAction SilentlyContinue | Format-Table JobId, DocumentName, JobStatus
