@echo off
title Mobil.az Launcher
color 0A

echo ============================================
echo   Mobil.az - Starting up...
echo ============================================
echo.

echo [1/3] Starting backend server (port 5000)...
cd /d "%~dp0Backend"
start /B node server.js
timeout /t 3 >nul
cd /d "%~dp0"
echo Backend 5000-de basladildi.

echo.
echo [2/3] Checking backend readiness...
node Backend/ensure_backend.js

echo.
echo [3/3] Opening Mobil.az in your browser...
start "" "%~dp0Front end\index.html"

echo.
echo ============================================
echo   Done! Backend is running on port 5000.
echo   Mobil.az web app is open in browser.
echo ============================================
echo.
pause
