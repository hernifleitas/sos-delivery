@echo off
echo ========================================
echo    PROBANDO APLICACION RIDER SOS
echo ========================================
echo.

echo [1/3] Verificando backend...
cd sos-backend
echo Iniciando servidor backend...
start "Backend Server" cmd /k "node index.js"
timeout /t 3 /nobreak >nul

echo.
echo [2/3] Verificando frontend...
cd ..
echo Iniciando aplicacion frontend...
start "Frontend App" cmd /k "npx expo start"

echo.
echo [3/3] Verificando configuracion...
echo.
echo ========================================
echo    APLICACION INICIADA
echo ========================================
echo.
echo Backend: http://192.168.1.41:10000
echo Frontend: Escanea el codigo QR con Expo Go
echo.
echo IMPORTANTE:
echo 1. Configura tu email en sos-backend/.env
echo 2. Usa contraseña de aplicacion de Gmail
echo 3. Acepta permisos de ubicacion en la app
echo.
echo ========================================
echo    ¡LISTO PARA USAR!
echo ========================================
pause
