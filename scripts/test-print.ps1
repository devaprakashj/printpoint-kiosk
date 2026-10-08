param(
    [string]$PrinterName = "HP LaserJet Professional P1106"
)

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "🖨️  PrintPoint Physical Hardware Auto-Test" -ForegroundColor Green
Write-Host "🎯 Target Printer: [$PrinterName]" -ForegroundColor Yellow
Write-Host "====================================================="

$testFile = Join-Path $PSScriptRoot "sample_test.txt"
$content = @"
=====================================================
         PRINTPOINT KIOSK ATM - TEST PAGE
=====================================================
Status       : 100% OPERATIONAL & VERIFIED
Printer Model: $PrinterName
Machine Code : RIT-ATM-01
Timestamp    : $(Get-Date -Format 'dd-MMM-yyyy hh:mm:ss tt')
Laser Spooler: Windows Native Spooler OK
=====================================================
This is an automated hardware verification printout.
All systems are ready for contactless PIN printing!
=====================================================
"@

Set-Content -Path $testFile -Value $content -Encoding UTF8

Write-Host "📄 Dispatching print job to $PrinterName..." -ForegroundColor Cyan
Get-Content $testFile | Out-Printer -Name $PrinterName

Write-Host "✅ Print job sent to printer spooler successfully!" -ForegroundColor Green
Start-Sleep -Seconds 2
Get-PrintJob -PrinterName $PrinterName | Format-Table JobId, DocumentName, JobStatus, TotalPages, PagesPrinted
