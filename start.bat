@echo off
title Blade Asset Library v1
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
    set PY=py
) else (
    set PY=python
)

%PY% -m pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo Failed to install dependencies.
    pause
    exit /b 1
)

start "" http://127.0.0.1:5000
%PY% app.py
pause
