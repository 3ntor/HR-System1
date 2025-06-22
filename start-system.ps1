# HR System Startup Script for PowerShell
Write-Host "================================================" -ForegroundColor Green
Write-Host "      HR Time Tracker System - PowerShell" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

Write-Host "[1/4] Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; Write-Host 'Backend Server Starting...' -ForegroundColor Green; npm start"

Write-Host "[2/4] Waiting 8 seconds for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "[3/4] Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host 'Frontend Server Starting...' -ForegroundColor Green; npm start"

Write-Host "[4/4] Waiting 5 seconds before starting desktop app..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Starting Desktop Application..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Desktop App Starting...' -ForegroundColor Green; npm start"

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "         SYSTEM STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services Running:" -ForegroundColor Cyan
Write-Host "  - Backend API:     http://localhost:5001" -ForegroundColor White
Write-Host "  - Frontend Web:    http://localhost:3000" -ForegroundColor White
Write-Host "  - Desktop App:     Electron Application" -ForegroundColor White
Write-Host ""
Write-Host "All services are running in separate windows." -ForegroundColor Yellow
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 