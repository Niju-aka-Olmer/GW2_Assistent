@echo off
title GW2 Assist
cd /d "%~dp0"

echo ============================================
echo        GW2 Assist — Portable Edition
echo ============================================
echo.

rem === Step 1: Check for updates ===
if exist updater.exe (
    echo [1/4] Checking for updates...
    updater.exe
) else (
    echo [1/4] Auto-update not available
)

rem === Step 2: Detect local IP ===
echo [2/4] Detecting local IP...
set "LOCAL_IP="
for /f "tokens=3 delims=: " %%a in ('netsh interface ip show address ^| findstr /i "IP.*Address" ^| find /v "127.0.0.1" ^| find /v "169.254"') do (
    if not defined LOCAL_IP set "LOCAL_IP=%%a"
)
if "%LOCAL_IP%"=="" set "LOCAL_IP=localhost"
echo        Server: http://%LOCAL_IP%:8000

rem === Step 3: Desktop shortcut ===
echo [3/4] Creating desktop shortcut...
powershell -NoProfile -Command "try { $wshell = New-Object -ComObject WScript.Shell; $s = $wshell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\GW2 Assist.lnk'); $s.TargetPath = 'http://%LOCAL_IP%:8000'; $s.Description = 'GW2 Assist'; $s.Save() } catch {}" >nul
echo        Shortcut: GW2 Assist.lnk (desktop)

rem === Step 4: Start server ===
echo [4/4] Starting server...
if not exist backend.exe (
    echo ERROR: backend.exe not found!
    pause
    exit /b 1
)
start "GW2 Assist" backend.exe

rem === Wait for server, then open browser ===
echo        Waiting for server to start...
ping -n 5 127.0.0.1 >nul
start http://%LOCAL_IP%:8000

cls
echo ============================================
echo        GW2 Assist is running!
echo ============================================
echo.
echo    Address: http://%LOCAL_IP%:8000
echo    Shortcut: GW2 Assist.lnk (desktop)
echo.
echo    Close this window to stop the server.
echo ============================================
pause
