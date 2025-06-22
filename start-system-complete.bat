@echo off
title HR System - Complete Startup
color 0A
echo ================================================
echo       HR Time Tracker System - Complete Setup
echo ================================================
echo.

echo [1/4] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && echo Backend Server Starting... && npm start"

echo [2/4] Waiting 8 seconds for backend to initialize...
timeout /t 8 /nobreak > nul

echo [3/4] Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && echo Frontend Server Starting... && npm start"

echo [4/4] Waiting 5 seconds before starting desktop app...
timeout /t 5 /nobreak > nul

echo Starting Desktop Application...
start "Desktop App" npm start

echo.
echo ================================================
echo           SYSTEM STARTED SUCCESSFULLY!
echo ================================================
echo.
echo Services Running:
echo   - Backend API:     http://localhost:5001
echo   - Frontend Web:    http://localhost:3000
echo   - Desktop App:     Electron Application
echo.
echo All services are running in separate windows.
echo Close this window when you're done.
echo.
pause 