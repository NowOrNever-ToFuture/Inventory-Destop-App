@echo off
chcp 65001 >nul
title HomeInventory Desktop - Build Script
setlocal enabledelayedexpansion

:: ============================================================
::  HomeInventory Desktop - Build & Setup Script
::  Tu dong kiem tra Node.js, cai dependencies, build installer
::  Tao installer (co icon, Start Menu, Desktop shortcut)
:: ============================================================

call :showBanner

:: ─── Kiem tra Node.js ───────────────────────────────────────
call :showStep "1/4" "Kiem tra Node.js"
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo   [!] Node.js chua duoc cai dat.
    echo   Dang mo trang download...
    start https://nodejs.org
    echo.
    echo   Sau khi tai va cai dat xong, hay chay lai script nay.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo   [OK] Node.js %NODE_VER%

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo   [!] npm khong tim thay.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo   [OK] npm v%NPM_VER%
echo.

:: ─── Install dependencies ──────────────────────────────────
call :showStep "2/4" "Cai dat dependencies"
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo   [!] Loi khi cai dat dependencies.
    pause
    exit /b 1
)
echo   [OK] Dependencies da duoc cai dat.
echo.

for /f "tokens=*" %%i in ('node -e "console.log(require('./package.json').version)"') do set APP_VERSION=%%i

:: ─── Chon OS de build ──────────────────────────────────────
call :showStep "3/4" "Chon he dieu hanh"
echo.
echo   [1] Windows  (setup.exe co icon + Start Menu + Desktop shortcut)
echo   [2] macOS    (file .dmg)
echo   [3] Linux    (file .AppImage / .deb)
echo.
set /p CHOICE="Nhap lua chon (1/2/3): "

if "%CHOICE%"=="1" (
    set BUILD_CMD=build:win
    set OS_NAME=Windows
) else if "%CHOICE%"=="2" (
    set BUILD_CMD=build:mac
    set OS_NAME=macOS
) else if "%CHOICE%"=="3" (
    set BUILD_CMD=build:linux
    set OS_NAME=Linux
) else (
    echo.
    echo   [!] Lua chon khong hop le.
    pause
    exit /b 1
)

echo.
echo   [OK] Da chon: %OS_NAME%
echo.

:: ─── Build (co progress bar) ──────────────────────────────
call :showStep "4/4" "Dang build installer cho %OS_NAME%..."
echo.
echo   Qua trinh nay co the mat vai phut...
echo.

:: Chay build voi PowerShell progress bar
powershell -NoProfile -Command ^
    $activity = "Building HomeInventory Desktop for %OS_NAME%"; ^
    $progress = 0; ^
    Write-Progress -Activity $activity -Status "Dang build..." -PercentComplete 30 -CurrentOperation "electron-vite build"; ^
    & cmd /c "npm run %BUILD_CMD% 2>&1"; ^
    if ($LASTEXITCODE -eq 0) { ^
        Write-Progress -Activity $activity -Status "Build xong" -PercentComplete 90 -CurrentOperation "Dang copy installer..."; ^
        Write-Progress -Activity $activity -Status "Hoan tat" -PercentComplete 100 -Completed; ^
    }

if %errorlevel% neq 0 (
    echo.
    echo   [!] Build that bai. Kiem tra loi o tren.
    pause
    exit /b 1
)

:: ─── Copy installer sang releases/ ─────────────────────────
echo.
echo   Dang copy installer vao releases...
if not exist releases mkdir releases

set INSTALLER_FOUND=0

if "%CHOICE%"=="1" (
    for /f "delims=" %%f in ('dir /b /s "dist\*setup.exe" 2^>nul') do (
        copy "%%f" "releases\" >nul
        echo   [OK] Da copy: %%~nxf
        set INSTALLER_FOUND=1
    )
)
if "%CHOICE%"=="2" (
    for /f "delims=" %%f in ('dir /b /s "dist\*.dmg" 2^>nul') do (
        copy "%%f" "releases\" >nul
        echo   [OK] Da copy: %%~nxf
        set INSTALLER_FOUND=1
    )
)
if "%CHOICE%"=="3" (
    for /f "delims=" %%f in ('dir /b /s "dist\*.AppImage" 2^>nul') do copy "%%f" "releases\" >nul & set INSTALLER_FOUND=1
    for /f "delims=" %%f in ('dir /b /s "dist\*.deb" 2^>nul') do copy "%%f" "releases\" >nul & set INSTALLER_FOUND=1
)

echo.
if %INSTALLER_FOUND%==1 (
    echo   ========================================
    echo     Build hoan tat!
    echo     OS     : %OS_NAME%
    echo     Version: v%APP_VERSION%
    echo     Folder : releases\
    echo   ========================================
    echo.
    echo   Chay file installer trong releases/ de cai dat.
    echo   (Icon se xuat hien o Start Menu va Desktop)
) else (
    echo   [!] Khong tim thay file installer trong dist/
)
echo.
pause
exit /b 0

:: ─── Functions ─────────────────────────────────────────────

:showBanner
echo.
echo   ╔══════════════════════════════════════════╗
echo   ║     HomeInventory Desktop - Build        ║
echo   ╚══════════════════════════════════════════╝
echo.
goto :eof

:showStep
echo [%~1] %~2
echo --------------------------------
goto :eof
