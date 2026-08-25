@echo off
setlocal enabledelayedexpansion
title Hollywood Agent Studio - Launch Script

echo ===================================================
echo     HOLLYWOOD AGENT STUDIO - DESKTOP LAUNCHER
echo ===================================================
echo.

:: Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please download and install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detected:
node -v
echo.

:: Check if node_modules exists, otherwise install dependencies
if not exist "node_modules\" (
    echo [INFO] Installing required dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install npm dependencies.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully.
    echo.
)

echo [INFO] Starting Hollywood Agent Studio...
call npm start

endlocal
