@echo off
title ERP Ligero Offline - Instalacion
chcp 65001 >nul

echo ========================================
echo   ERP Ligero Offline - Instalacion
echo ========================================
echo.

REM ------ 1. Verificar Node.js ------
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Descargalo desde: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js encontrado
node --version

REM ------ 2. Verificar npm ------
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm no encontrado.
    pause
    exit /b 1
)
echo [OK] npm encontrado

REM ------ 3. Instalar dependencias ------
echo.
echo Instalando dependencias...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo la instalacion de dependencias.
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas

REM ------ 4. Copiar Dexie a assets/lib ------
echo.
echo Copiando Dexie.js a assets/lib...
if exist "node_modules\dexie\dist\dexie.mjs" (
    copy /y "node_modules\dexie\dist\dexie.mjs" "assets\lib\dexie.js" >nul
    echo [OK] Dexie copiado
) else (
    echo [WARN] No se encontro dexie.mjs, verificando dexie.js...
    if exist "node_modules\dexie\dist\dexie.js" (
        copy /y "node_modules\dexie\dist\dexie.js" "assets\lib\dexie.js" >nul
        echo [OK] Dexie copiado
    ) else (
        echo [ERROR] No se pudo copiar Dexie.
        pause
        exit /b 1
    )
)

REM ------ 5. Iniciar servidor ------
echo.
echo ========================================
echo  Iniciando servidor en:
echo  http://localhost:3000
echo ========================================
echo.
start http://localhost:3000

REM Intentar con python3, python, py
where python3 >nul 2>nul
if %ERRORLEVEL% equ 0 (
    python3 -m http.server 3000
    if %ERRORLEVEL% equ 0 exit /b 0
)

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    python -m http.server 3000
    if %ERRORLEVEL% equ 0 exit /b 0
)

where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    py -3 -m http.server 3000
    if %ERRORLEVEL% equ 0 exit /b 0
)

echo.
echo [ERROR] No se encontro Python. Instalalo desde:
echo https://www.python.org/downloads/
echo O abre la terminal en esta carpeta y ejecuta:
echo   npx serve .
pause
exit /b 1
