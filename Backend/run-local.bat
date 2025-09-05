@echo off
REM 🚀 LinguaLink AI Backend - Windows Local Development Runner

echo 🚀 LinguaLink AI Backend - Local Development Setup
echo ==================================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    pause
    exit /b 1
)

echo ✅ Python found

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️ .env file not found, copying from .env.example
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo ✅ .env file created from example
    ) else (
        echo ❌ .env.example not found
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file found
)

REM Install dependencies
echo 📦 Installing dependencies...
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo 🌟 Setup complete! Starting backend server...
echo 📖 API Documentation will be available at: http://localhost:8000/docs
echo 🔍 Health check: http://localhost:8000/health
echo ==================================================
echo.

REM Start the server
python start.py

pause
