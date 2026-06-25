@echo off
title MediHub - Sistema de Gestión Médica
color 0A

echo ========================================
echo    MediHub - Sistema de Gestion Medica
echo ========================================
echo.

REM Verificar si PostgreSQL está corriendo
echo [1/3] Verificando PostgreSQL...
tasklist /FI "IMAGENAME eq postgres.exe" 2>NUL | find /I /N "postgres.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] PostgreSQL esta corriendo
) else (
    echo [ADVERTENCIA] PostgreSQL no esta corriendo
    echo Por favor, inicie PostgreSQL manualmente
    echo.
    pause
    exit
)

echo.
echo [2/3] Iniciando servidor MediHub...
echo Por favor espere...
echo.

REM Navegar al directorio del proyecto
cd /d "%~dp0"

REM Iniciar el servidor de producción
start /B npm start

REM Esperar 8 segundos para que el servidor inicie
timeout /t 8 /nobreak >nul

echo [3/3] Abriendo MediHub en el navegador...
echo.

REM Abrir el navegador
start http://localhost:3000

echo ========================================
echo    MediHub iniciado correctamente!
echo ========================================
echo.
echo El sistema esta corriendo en: http://localhost:3000
echo.
echo IMPORTANTE:
echo - NO cierre esta ventana mientras use MediHub
echo - Para detener el sistema, cierre esta ventana
echo.
echo Presione cualquier tecla para minimizar esta ventana...
pause >nul

REM Minimizar la ventana
powershell -window minimized -command ""

REM Mantener el proceso corriendo
:loop
timeout /t 60 >nul
goto loop
