# 🚀 Rider SOS - Guía de Instalación

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- Expo CLI
- Cuenta de Gmail para envío de emails
- Dispositivo móvil con Expo Go o emulador

## 🔧 Instalación del Backend

### 1. Instalar dependencias
```bash
cd sos-backend
npm install
```

### 2. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
copy env.example .env

# Editar el archivo .env con tus datos
```

### 3. Configurar email (Gmail)
1. Ve a tu cuenta de Google
2. Seguridad > Verificación en 2 pasos
3. Contraseñas de aplicaciones
4. Genera una nueva para "Rider SOS"
5. Usa esa contraseña en el archivo .env

### 4. Iniciar el servidor
```bash
npm start
```

El servidor estará disponible en: `http://192.168.1.41:10000`

## 📱 Instalación del Frontend

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar la aplicación
```bash
npx expo start
```

### 3. Conectar dispositivo
- Escanea el código QR con Expo Go
- O usa un emulador de Android/iOS

## ⚙️ Configuración de Red

### Para usar en otros dispositivos:
1. Cambia la IP en `config.js`:
```javascript
BACKEND_URL: 'http://TU_IP:10000'
```

2. Asegúrate de que todos los dispositivos estén en la misma red WiFi

## 🔐 Configuración de Email

### Archivo .env del backend:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
EMAIL_FROM=Rider SOS <tu-email@gmail.com>
```

## 🚨 Funcionalidades

### ✅ Implementadas:
- ✅ Pantalla de inicio con logo y características
- ✅ Sistema de registro/login con base de datos
- ✅ Envío de emails de bienvenida
- ✅ Navbar con perfil y configuración
- ✅ Cambio de contraseña
- ✅ Alertas SOS (robo/pinchazo)
- ✅ Tracking de ubicación en tiempo real
- ✅ Mapa con riders activos
- ✅ Notificaciones push
- ✅ Diseño con colores negro y rojo

### 🎨 Características del Diseño:
- Tema oscuro con acentos rojos
- Interfaz moderna y profesional
- Navegación intuitiva
- Responsive design

## 📧 Sistema de Emails

### Email de Bienvenida incluye:
- Información del usuario registrado
- Características de la app
- Instrucciones de uso
- Diseño profesional con HTML

## 🔧 Solución de Problemas

### Error de conexión al backend:
1. Verifica que el servidor esté corriendo
2. Comprueba la IP en config.js
3. Asegúrate de estar en la misma red

### Error de email:
1. Verifica las credenciales en .env
2. Usa contraseña de aplicación, no la normal
3. Habilita verificación en 2 pasos en Gmail

### Error de permisos:
1. Acepta permisos de ubicación
2. Acepta permisos de notificaciones
3. Habilita ubicación en segundo plano

## 📱 Uso de la Aplicación

### 1. Registro:
- Completa todos los campos
- Recibirás un email de bienvenida
- Inicia sesión con tus credenciales

### 2. Configuración:
- Activa el tracking de ubicación
- Configura tu perfil desde el navbar
- Cambia tu contraseña si es necesario

### 3. Uso de SOS:
- Toca "SOS Robo" o "SOS Pinchazo"
- La ubicación se enviará automáticamente
- Otros riders verán tu alerta en el mapa

### 4. Navegación:
- Usa el botón de perfil (👤) para acceder al menú
- Ve tu información y configuración
- Cierra sesión cuando termines

## 🎯 Próximas Mejoras

- [ ] Notificaciones push reales
- [ ] Chat entre riders
- [ ] Historial de alertas
- [ ] Estadísticas de uso
- [ ] Modo offline
- [ ] Integración con servicios de emergencia

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica la configuración de red
3. Comprueba los permisos de la app
4. Reinicia el servidor si es necesario

---

**Rider SOS** - Tu seguridad es nuestra prioridad 🛡️
