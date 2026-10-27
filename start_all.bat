@echo off
title AutoValue AI Launcher
echo ========================================================
echo  Launching AutoValue AI (Backend + Frontend)
echo ========================================================
start "AutoValue AI Backend" cmd /c "run_backend.bat"
timeout /t 2 >nul
start "AutoValue AI Frontend" cmd /c "run_frontend.bat"
echo Services launched!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
timeout /t 5
