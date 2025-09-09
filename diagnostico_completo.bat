@echo off
echo ========================================
echo    DIAGNOSTICO COMPLETO RIDER SOS
echo ========================================
echo.

echo [1/5] Verificando backend...
cd sos-backend
echo Iniciando servidor backend...
start "Backend Server" cmd /k "node index.js"
timeout /t 5 /nobreak >nul

echo.
echo [2/5] Probando conexion al backend...
cd ..
node test_backend.js

echo.
echo [3/5] Verificando configuracion...
echo Backend URL: http://192.168.1.41:10000
echo Frontend URL: http://192.168.1.41:8081
echo.

echo [4/5] Verificando archivos...
if exist "sos-backend/.env" (
    echo ✅ Archivo .env existe
) else (
    echo ❌ Archivo .env NO existe - Copiando desde env.example...
    copy sos-backend\env.example sos-backend\.env
)

if exist "sos-backend/users.db" (
    echo ✅ Base de datos existe
) else (
    echo ⚠️ Base de datos se creara automaticamente
)

echo.
echo [5/5] Iniciando frontend...
echo Iniciando aplicacion frontend...
start "Frontend App" cmd /k "npx expo start"

echo.
echo ========================================
echo    DIAGNOSTICO COMPLETADO
echo ========================================
echo.
echo INSTRUCCIONES:
echo 1. Configura tu email en sos-backend/.env
echo 2. Escanea el codigo QR con Expo Go
echo 3. Intenta registrar un usuario
echo 4. Revisa los logs en ambas ventanas
echo.
echo SI HAY ERRORES:
echo - Verifica que ambos servidores esten corriendo
echo - Revisa la configuracion de email
echo - Acepta permisos de ubicacion
echo.
echo ========================================
pause
