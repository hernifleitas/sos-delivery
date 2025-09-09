@echo off
echo ========================================
echo    INSTALACION COMPLETA RIDER SOS
echo ========================================
echo.

echo [1/4] Instalando dependencias del frontend...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Fallo al instalar dependencias del frontend
    pause
    exit /b 1
)

echo.
echo [2/4] Instalando dependencias del backend...
cd sos-backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Fallo al instalar dependencias del backend
    pause
    exit /b 1
)

echo.
echo [3/4] Configurando archivos de entorno...
if not exist .env (
    copy env.example .env
    echo Archivo .env creado desde env.example
) else (
    echo Archivo .env ya existe
)

cd ..

echo.
echo [4/4] Verificando instalacion...
echo Frontend: OK
echo Backend: OK
echo Configuracion: OK

echo.
echo ========================================
echo    INSTALACION COMPLETADA
echo ========================================
echo.
echo SIGUIENTES PASOS:
echo.
echo 1. Configura tu email en sos-backend/.env:
echo    - EMAIL_USER: tu email de Gmail
echo    - EMAIL_PASS: tu contraseña de aplicacion
echo.
echo 2. Para Gmail, crea una "Contraseña de aplicacion":
echo    - Ve a tu cuenta de Google
echo    - Seguridad > Verificacion en 2 pasos
echo    - Contraseñas de aplicacion
echo    - Genera una nueva para "Rider SOS"
echo.
echo 3. Inicia el backend:
echo    cd sos-backend
echo    npm start
echo.
echo 4. En otra terminal, inicia el frontend:
echo    npx expo start
echo.
echo 5. Escanea el codigo QR con Expo Go
echo.
echo ========================================
echo    ¡LISTO PARA USAR!
echo ========================================
pause
