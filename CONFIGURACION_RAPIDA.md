# 🚀 Configuración Rápida - Rider SOS

## ⚡ Pasos Rápidos

### 1. Instalar Dependencias
```bash
# Ejecuta este comando:
instalar_todo.bat
```

### 2. Configurar Email
Edita el archivo `sos-backend/.env`:

```env
# Cambia estos valores:
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
JWT_SECRET=una-clave-secreta-muy-segura
```

### 3. Crear Contraseña de Aplicación (Gmail)
1. Ve a [myaccount.google.com](https://myaccount.google.com)
2. Seguridad → Verificación en 2 pasos
3. Contraseñas de aplicaciones
4. Selecciona "Otra" y escribe "Rider SOS"
5. Copia la contraseña generada
6. Úsala en el archivo .env

### 4. Iniciar la Aplicación
```bash
# Ejecuta este comando:
probar_aplicacion.bat
```

## 🔧 Solución de Problemas

### Error de nodemailer:
✅ **SOLUCIONADO** - Corregido el error `createTransporter`

### Error de conexión:
- Verifica que el backend esté corriendo en puerto 10000
- Asegúrate de estar en la misma red WiFi
- Cambia la IP en `config.js` si es necesario

### Error de email:
- Usa contraseña de aplicación, NO tu contraseña normal
- Habilita verificación en 2 pasos en Gmail
- Verifica que el email esté correcto en .env

## 📱 Usar la App

1. **Registro**: Completa todos los campos
2. **Email**: Recibirás un email de bienvenida automáticamente
3. **Login**: Inicia sesión con tus credenciales
4. **Perfil**: Toca el botón 👤 para ver tu información
5. **SOS**: Usa los botones de emergencia cuando necesites ayuda

## 🎯 Funcionalidades Disponibles

- ✅ Registro/Login con base de datos
- ✅ Email de bienvenida automático
- ✅ Navbar con perfil y configuración
- ✅ Cambio de contraseña
- ✅ Alertas SOS (robo/pinchazo)
- ✅ Tracking de ubicación
- ✅ Mapa en tiempo real
- ✅ Notificaciones push
- ✅ Diseño negro y rojo

## 📞 Si tienes problemas:

1. Revisa que el backend esté corriendo
2. Verifica la configuración de email
3. Acepta todos los permisos en la app
4. Reinicia ambos servidores si es necesario

---

**¡La aplicación está lista para usar!** 🎉
