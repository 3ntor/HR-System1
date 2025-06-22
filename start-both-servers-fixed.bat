@echo off
echo Starting HR System - Backend and Frontend...
echo.
echo Opening Backend Server in new window...
start "Backend Server" cmd /k "cd backend && npm start"

echo Waiting 5 seconds before starting frontend...
timeout /t 5 /nobreak > nul

echo Opening Frontend Server in new window...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo Both servers are starting in separate windows!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul 