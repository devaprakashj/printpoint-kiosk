@echo off
title SmartPrint Kiosk Controller (Laptop Test Runner)
echo ================================================================
echo   SmartPrint Kiosk Controller - Laptop Pi Simulation Runner
echo ================================================================
echo.
echo Starting Python Kiosk Daemon for RIT-ATM-01...
echo Press Ctrl+C at any time to simulate Power Cut / Machine Off.
echo.
python "%~dp0smartprint_daemon.py" --machine RIT-ATM-01 --server http://localhost:3000
pause
