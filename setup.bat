@echo off
title Open Root ERP - Instalacion
chcp 65001 >nul

REM Ejecutar siempre desde el propio directorio del proyecto
cd /d "%~dp0"

echo ========================================
echo   Open Root ERP - Instalacion
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

REM ------ 5. Detectar puerto (persistente) ------
set PORT_FILE=.openroot-erp-port
if exist "%PORT_FILE%" (
  set /p PORT=<"%PORT_FILE%"
  netstat -a -n 2>nul | findstr /C:":%PORT% " >nul 2>&1
  if %ERRORLEVEL% equ 0 (
    echo [WARN] Puerto %PORT% en uso, buscando otro...
    set PORT=3000
    goto checkport
  )
) else (
  set PORT=3000
  goto checkport
)

:checkport
netstat -a -n 2>nul | findstr /C:":%PORT% " >nul 2>&1
if %ERRORLEVEL% equ 0 (
  set /a PORT+=1
  goto checkport
)
echo %PORT%>"%PORT_FILE%"

REM ------ 6. Auto-inicio obligatorio (lanzador oculto sin ventana) ------
echo.
echo Configurando auto-inicio del servidor (en segundo plano)...
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

REM Detectar el interprete de Python disponible
set PYCMD=python3
where python3 >nul 2>nul
if %ERRORLEVEL% neq 0 (
    set PYCMD=python
    where python >nul 2>nul
    if %ERRORLEVEL% neq 0 set PYCMD=py -3
)

REM Ruta del proyecto sin barra final para usarla como --directory
set ABSDIR=%~dp0
set ABSDIR=%ABSDIR:~0,-1%

(
    echo Set sh = CreateObject("WScript.Shell"^)
    echo sh.Run "%PYCMD% -m http.server %PORT% --directory ""%ABSDIR%""", 0, False
) > "%STARTUP_DIR%\OpenRootERP.vbs"
echo [OK] Auto-inicio oculto configurado en carpeta de inicio

REM ------ 7. Iniciar servidor ------
echo.
echo ========================================
echo  Iniciando servidor en:
echo  http://localhost:%PORT%
echo  Puerto guardado en: %PORT_FILE%
echo ========================================
echo.
start http://localhost:%PORT%

REM Intentar con python3, python, py
where python3 >nul 2>nul
if %ERRORLEVEL% equ 0 (
    python3 -m http.server %PORT%
    if %ERRORLEVEL% equ 0 exit /b 0
)

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    python -m http.server %PORT%
    if %ERRORLEVEL% equ 0 exit /b 0
)

where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    py -3 -m http.server %PORT%
    if %ERRORLEVEL% equ 0 exit /b 0
)

echo.
echo [ERROR] No se encontro Python. Instalalo desde:
echo https://www.python.org/downloads/
echo O abre la terminal en esta carpeta y ejecuta:
echo   npx serve .
pause
exit /b 1
