@echo off
title AiryPhone Launcher
color 0A

echo ============================================
echo   AiryPhone - Starting up...
echo ============================================
echo.

:: Start the backend server in a new window
echo [1/3] Starting backend server (port 5000)...
start "AiryPhone Backend" cmd /k "cd /d "%~dp0Backend" && node server.js"

:: Wait 3 seconds for the server to boot
echo [2/3] Waiting for server to initialize...
timeout /t 3 /nobreak >nul

:: Open the frontend in the default browser
echo [3/3] Opening AiryPhone in your browser...
start "" "%~dp0Front end\index.html"

echo.
echo ============================================
echo   Done! Backend is running in the other
echo   window. Close it to stop the server.
echo ============================================
echo.
pause
