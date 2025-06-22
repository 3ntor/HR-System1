@echo off
echo Installing HR System Dependencies...
echo.

REM Install root dependencies (for desktop app)
echo Installing desktop app dependencies...
npm install

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
npm install
cd ..

REM Install frontend dependencies  
echo Installing frontend dependencies...
cd frontend
npm install
cd ..

echo.
echo All dependencies installed successfully!
echo.
echo Starting HR System...
echo.

REM Start Backend Server
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

REM Wait 5 seconds for backend to start
timeout /t 5 /nobreak

REM Start Frontend Server  
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo System started successfully!
echo Backend: http://localhost:5001
echo Frontend: http://localhost:3000
echo.
echo You can close this window now.
pause 