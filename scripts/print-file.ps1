param(
    [Parameter(Mandatory=$true)][string]$FilePath,
    [Parameter(Mandatory=$true)][string]$PrinterName,
    [int]$Copies = 1
)

$ext = [System.IO.Path]::GetExtension($FilePath).ToLower()
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

Write-Host "🖨️ [PrintPoint Spooler] Dispatching: $FilePath to [$PrinterName] ($Copies copies)"

for ($i = 0; $i -lt $Copies; $i++) {
    if ($ext -eq ".txt") {
        Get-Content -Path $FilePath -Raw | Out-Printer -Name $PrinterName
    }
    elseif ($ext -eq ".pdf" -and (Test-Path $edgePath)) {
        & $edgePath --headless --print-to-printer --printer-name="$PrinterName" "$FilePath"
    }
    elseif ($ext -in @(".png", ".jpg", ".jpeg", ".bmp")) {
        $p = Start-Process -FilePath "mspaint.exe" -ArgumentList "/pt", "`"$FilePath`"", "`"$PrinterName`"" -PassThru
        Start-Sleep -Seconds 3
        if ($p -and (-not $p.HasExited)) {
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        }
    }
    else {
        # Generic Windows Shell PrintTo
        $p = Start-Process -FilePath $FilePath -Verb PrintTo -ArgumentList "`"$PrinterName`"" -PassThru
        Start-Sleep -Seconds 3
        if ($p -and (-not $p.HasExited)) {
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "✅ Job dispatched to [$PrinterName] successfully!"
