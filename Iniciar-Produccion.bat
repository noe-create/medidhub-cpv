@echo off
echo ===================================================
echo   INICIANDO MEDIHUB EN MODO PRODUCCION (RAPIDO)
echo ===================================================
echo.
echo 1. Deteniendo procesos anteriores...
taskkill /F /IM node.exe >nul 2>&1

echo 2. Construyendo aplicacion optimizada...
echo    (Esto puede tardar unos minutos la primera vez)
npm run build

echo 3. Iniciando servidor de produccion...
echo    El sistema estara disponible en: http://localhost:3000
echo.
npm run start
