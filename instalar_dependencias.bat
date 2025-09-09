@echo off
echo ========================================
echo    INSTALANDO DEPENDENCIAS DEL BACKEND
echo ========================================
echo.

cd sos-backend
echo Instalando dependencias de Node.js...
npm install

echo.
echo ========================================
echo    CONFIGURACION COMPLETADA
echo ========================================
echo.
echo 1. Copia el archivo 'env.example' a '.env'
echo 2. Configura tu email y contraseña en el archivo .env
echo 3. Ejecuta 'npm start' para iniciar el servidor
echo.
echo Para mas informacion, lee CONFIGURACION_EMAIL.md
echo.
pause

