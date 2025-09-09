# 📧 Configuración del Servicio de Email

## Configuración para Gmail

Para que el sistema de email funcione correctamente, necesitas configurar las credenciales de Gmail:

### 1. Crear una App Password en Gmail

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Selecciona "Seguridad" en el menú lateral
3. En "Iniciar sesión en Google", selecciona "Contraseñas de aplicaciones"
4. Selecciona "Correo" y "Otro (nombre personalizado)"
5. Escribe "Rider SOS" como nombre
6. Google generará una contraseña de 16 caracteres
7. **Copia esta contraseña** - la necesitarás para la configuración

### 2. Configurar las variables de entorno

Crea un archivo `.env` en la carpeta `sos-backend/` con el siguiente contenido:

```env
# Configuración del servidor
PORT=10000
HOST=192.168.1.41

# Configuración de JWT
JWT_SECRET=rider-sos-secret-key-2024

# Configuración de email (Gmail)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password-de-16-caracteres

# Email de administración para alertas SOS
ADMIN_EMAIL=admin@ridersos.com

# Configuración de base de datos
DB_PATH=./users.db
```

### 3. Reemplazar los valores

- `tu-email@gmail.com`: Tu dirección de Gmail
- `tu-app-password-de-16-caracteres`: La contraseña de aplicación que generaste
- `admin@ridersos.com`: Email donde recibir alertas SOS (puede ser el mismo)

### 4. Instalar dependencias del backend

```bash
cd sos-backend
npm install
```

### 5. Iniciar el servidor

```bash
npm start
```

## Configuración Alternativa (Otros proveedores)

Si prefieres usar otro proveedor de email, modifica la configuración en `sos-backend/emailService.js`:

### Para Outlook/Hotmail:
```javascript
this.transporter = nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

### Para Yahoo:
```javascript
this.transporter = nodemailer.createTransporter({
  service: 'yahoo',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

### Para servidor SMTP personalizado:
```javascript
this.transporter = nodemailer.createTransporter({
  host: 'smtp.tu-servidor.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## Verificación

Una vez configurado, cuando un usuario se registre, debería recibir un email de bienvenida con el siguiente contenido:

```
¡Bienvenido a Rider SOS, [Nombre]!

Hola [Nombre],

Te registraste correctamente a Rider SOS con tu moto [Moto] de color [Color].

Información de tu cuenta:
- Nombre: [Nombre]
- Moto: [Moto]
- Color: [Color]

📱 Recordatorio Importante:
Recuerda activar el seguimiento desde la aplicación para que podamos ayudarte en caso de emergencia.

Gracias por usar Rider SOS. Tu seguridad es nuestra prioridad.
```

## Solución de Problemas

### Error: "Invalid login"
- Verifica que el email y la contraseña de aplicación sean correctos
- Asegúrate de que la autenticación de 2 factores esté habilitada en Gmail

### Error: "Connection timeout"
- Verifica tu conexión a internet
- Algunos proveedores bloquean conexiones SMTP, prueba con otro proveedor

### No se reciben emails
- Revisa la carpeta de spam
- Verifica que el email de destino sea válido
- Revisa los logs del servidor para errores

## Seguridad

- **NUNCA** subas el archivo `.env` a un repositorio público
- Usa contraseñas de aplicación en lugar de tu contraseña principal
- Considera usar variables de entorno del sistema en producción

