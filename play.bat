@echo off
title Launching SNAKE: ECLIPSE
echo ===================================================
echo   SNAKE: ECLIPSE -- Beyond the Void Launcher
echo ===================================================
echo Checking server status...
start http://localhost:5173/
echo If the server is not running, starting development server...
call npm run dev
pause
