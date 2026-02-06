@echo off
echo ===================================================
echo   ACTUALIZADOR DE SERVIDOR MEDIHUB (192.168.1.80)
echo ===================================================

:: --- CONFIGURACION ---
set USUARIO=cpv
set IP=192.168.1.80
:: IMPORTANTE: Cambia esta ruta por la ruta real en el servidor
set RUTA_REMOTA=/home/cpv/medihub

echo.
echo 1. Copiando archivos al servidor...
echo    (Se solicitara la contrasena si no hay llaves SSH configuradas)

:: Copia las carpetas y archivos criticos
scp -r src %USUARIO%@%IP%:%RUTA_REMOTA%/
scp -r public %USUARIO%@%IP%:%RUTA_REMOTA%/
scp package.json %USUARIO%@%IP%:%RUTA_REMOTA%/
scp next.config.ts %USUARIO%@%IP%:%RUTA_REMOTA%/

echo.
echo 2. Reconstruyendo aplicacion en el servidor...
ssh %USUARIO%@%IP% "cd %RUTA_REMOTA% && npm run build"

echo.
echo ===================================================
echo   ACTUALIZACION COMPLETADA
echo ===================================================
echo.
echo [IMPORTANTE]
echo Si el servidor ya estaba corriendo, necesitas REINICIARLO para ver los cambios.
echo 1. Ve al servidor.
echo 2. Cierra la ventana del programa.
echo 3. Vuelve a abrirla.
pause
