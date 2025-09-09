@echo off
echo ========================================
echo    INSTALANDO DEPENDENCIAS DEL BACKEND
echo ========================================
echo.

cd sos-backend

echo Instalando dependencias...
npm install

echo.
echo ========================================
echo    CONFIGURACION NECESARIA
echo ========================================
echo.
echo 1. Copia el archivo env.example a .env:
echo    copy env.example .env
echo.
echo 2. Edita el archivo .env con tus datos:
echo    - EMAIL_USER: tu email de Gmail
echo    - EMAIL_PASS: tu contraseña de aplicacion
echo    - JWT_SECRET: una clave secreta segura
echo.
echo 3. Para Gmail, necesitas crear una "Contraseña de aplicacion":
echo    - Ve a tu cuenta de Google
echo    - Seguridad > Verificacion en 2 pasos
echo    - Contraseñas de aplicacion
echo    - Genera una nueva para "Rider SOS"
echo.
echo 4. Inicia el servidor:
echo    npm start
echo.
echo ========================================
echo    DEPENDENCIAS INSTALADAS
echo ========================================
pause
