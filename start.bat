@echo off
echo ==============================================
echo   Starting Archivision Studio
echo ==============================================

echo [1/2] Starting Backend Server (FastAPI on port 8000)...
start "Archivision Backend" cmd /k "cd /d "%~dp0backend_local" && .venv\Scripts\python.exe run.py"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend Server (Vite on port 5173)...
start "Archivision Frontend" cmd /k "cd /d "%~dp0frontend_react" && npm run dev"

echo.
echo ==============================================
echo Both services are starting!
echo Open your browser at: http://localhost:5173
echo Backend docs at:      http://localhost:8000/docs
echo ==============================================
pause
