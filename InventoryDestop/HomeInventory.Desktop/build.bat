@echo off
title HomeInventory Desktop - Build Script
setlocal enabledelayedexpansion

:: ============================================================
::  HomeInventory Desktop - Build & Setup Script
::  Tu dong kiem tra Node.js, cai dependencies, build installer
::  Tao installer (co icon, Start Menu, Desktop shortcut)
:: ============================================================

echo.
echo  ========================================
echo    HomeInventory Desktop - Build Script
echo  ========================================
echo.

:: ─── Kiem tra Node.js ───────────────────────────────────────
echo [1/4] Dang kiem tra Node.js...
echo --------------------------------

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo   [!] Node.js chua duoc cai dat.
    echo   Vui long tai va cai dat Node.js tu: https://nodejs.org
    echo.
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
echo [2/4] Dang cai dat dependencies...
echo --------------------------------
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
echo [3/4] Chon he dieu hanh de build:
echo --------------------------------
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

:: ─── Build ────────────────────────────────────────────────
echo [4/4] Dang build installer cho %OS_NAME%...
echo --------------------------------
echo.
echo   Qua trinh nay co the mat vai phut, vui long cho...
echo.

call npm run %BUILD_CMD%
if %errorlevel% neq 0 (
    echo.
    echo   [!] Build that bai. Kiem tra loi o tren.
    pause
    exit /b 1
)

:: ─── Copy installer sang releases/ ─────────────────────────
echo.
echo   Dang copy installer vao thu muc releases...
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
    echo  ========================================
    echo    Build hoan tat!
    echo    OS     : %OS_NAME%
    echo    Version: v%APP_VERSION%
    echo    Folder : releases\
    echo  ========================================
    echo.
    echo   Chay file installer trong releases/ de cai dat.
    echo   (Icon se xuat hien o Start Menu va Desktop)
) else (
    echo   [!] Khong tim thay file installer trong dist/
    echo   Kiem tra lai ket qua build o tren.
)
echo.
pause
