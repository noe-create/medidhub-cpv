# Script para crear acceso directo en escritorio
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$Home\Desktop\MediHub.lnk")
$Shortcut.TargetPath = "$PSScriptRoot\Iniciar-MediHub.bat"
$Shortcut.WorkingDirectory = "$PSScriptRoot"
$Shortcut.IconLocation = "$PSScriptRoot\public\icon-512x512.png"
$Shortcut.Description = "Sistema de Gestión Médica - MediHub"
$Shortcut.Save()

Write-Host "✓ Acceso directo creado en el escritorio" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora puedes iniciar MediHub desde el icono en tu escritorio" -ForegroundColor Cyan
Write-Host ""
pause
