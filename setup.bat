@echo off
title BladeVault Setup
color 0E

echo ==========================================
echo        BladeVault Setup
echo ==========================================
echo.

:: Check Python
python --version >nul 2>&1

if %errorlevel% neq 0 (
    echo Python is not installed.
    echo.

    echo Installing Python using winget...
    winget install Python.Python.3.12

    echo.
    echo Python installation finished.
    echo Please close this window and run setup.bat again.
    pause
    exit
)

echo Python detected.
python --version

echo.
echo ==========================================
echo Installing required Python packages...
echo ==========================================
echo.

python -m pip install --upgrade pip

python -m pip install flask
python -m pip install pywebview

echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.

echo You can now start BladeVault.
echo.

pause