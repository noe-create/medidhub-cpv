@echo off
title Detener MediHub
color 0C

echo ========================================
echo    Deteniendo MediHub...
echo ========================================
echo.

REM Matar procesos de Node.js (servidor Next.js)
taskkill /F /IM node.exe /T 2>nul

if "%ERRORLEVEL%"=="0" (
    echo [OK] Servidor MediHub detenido
) else (
    echo [INFO] No habia servidor corriendo
)

echo.
echo MediHub ha sido detenido correctamente.
echo.
pause
