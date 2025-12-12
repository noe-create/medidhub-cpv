@echo off
title Instalador de MediHub - Cliente
color 0B

echo ========================================
echo   Instalador de MediHub - Cliente
echo ========================================
echo.

REM Crear archivo HTML en el escritorio
set "desktop=%USERPROFILE%\Desktop"
set "file=%desktop%\MediHub.html"

echo Creando acceso directo en el escritorio...

(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo     ^<meta http-equiv="refresh" content="0; url=http://192.168.3.89:3000"^>
echo     ^<title^>MediHub^</title^>
echo     ^<link rel="icon" href="http://192.168.3.89:3000/icon-192x192.png"^>
echo ^</head^>
echo ^<body style="font-family: Arial; text-align: center; padding-top: 100px;"^>
echo     ^<h1^>Abriendo MediHub...^</h1^>
echo     ^<p^>Si no se abre automaticamente, ^<a href="http://192.168.3.89:3000"^>haz click aqui^</a^>^</p^>
echo ^</body^>
echo ^</html^>
) > "%file%"

echo.
echo ========================================
echo   Instalacion Completada!
echo ========================================
echo.
echo Se ha creado "MediHub.html" en tu escritorio
echo.
echo Para usar MediHub:
echo 1. Doble click en "MediHub.html"
echo 2. Se abrira en tu navegador
echo.
echo NOTA: El servidor (192.168.3.89) debe estar encendido
echo.
pause
