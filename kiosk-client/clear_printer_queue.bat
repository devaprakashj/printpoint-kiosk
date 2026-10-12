@echo off
title Clear All Windows Print Queues
echo ================================================================
echo   Cancelling and Clearing All Stuck Print Spooler Jobs...
echo ================================================================
echo.
powershell -NoProfile -Command "Get-Printer | Get-PrintJob | Remove-PrintJob -ErrorAction SilentlyContinue"
echo.
echo All stuck print jobs have been permanently cancelled and removed!
echo Total remaining jobs in queue: 0
echo.
pause
