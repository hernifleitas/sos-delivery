# 🔧 Solución de Problemas - Rider SOS

## ❌ Error 400 en Registro

### **Problema Identificado:**
El backend está funcionando correctamente, pero hay un error de comunicación entre frontend y backend.

### **Soluciones:**

#### 1. **Verificar Backend**
```bash
# Ejecuta el diagnóstico completo
diagnostico_completo.bat
```

#### 2. **Verificar Logs**
- **Backend**: Revisa la ventana del servidor backend
- **Frontend**: Revisa los logs en Expo Go o la consola

#### 3. **Problemas Comunes:**

##### **A. Email ya registrado**
- **Error**: "Este email ya está registrado"
- **Solución**: Usa un email diferente o elimina el usuario de la base de datos

##### **B. Datos inválidos**
- **Error**: "Datos inválidos"
- **Solución**: Verifica que todos los campos estén completos

##### **C. Error de conexión**
- **Error**: "Error de conexión"
- **Solución**: Verifica que el backend esté corriendo en puerto 10000

#### 4. **Configuración de Email**
```env
# En sos-backend/.env
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
```

#### 5. **Limpiar Base de Datos**
```bash
# Si hay problemas con usuarios existentes
cd sos-backend
del users.db
node index.js
```

## 🚀 **Pasos de Solución Rápida:**

### **1. Reiniciar Todo**
```bash
# Cerrar todas las ventanas
# Ejecutar:
diagnostico_completo.bat
```

### **2. Verificar Configuración**
- ✅ Backend corriendo en puerto 10000
- ✅ Frontend corriendo en puerto 8081
- ✅ Archivo .env configurado
- ✅ Base de datos creada

### **3. Probar Registro**
- Usa un email nuevo
- Completa todos los campos
- Verifica los logs en ambas ventanas

### **4. Si Persiste el Error**
```bash
# Ejecutar prueba del backend
node test_backend.js
```

## 📱 **Problemas en la App:**

### **A. No se conecta al backend**
- Verifica la IP en config.js
- Asegúrate de estar en la misma red WiFi
- Revisa que el backend esté corriendo

### **B. Error de permisos**
- Acepta permisos de ubicación
- Acepta permisos de notificaciones
- Habilita ubicación en segundo plano

### **C. Error de notificaciones**
- Las notificaciones no funcionan en Expo Go
- Usa un development build para funcionalidad completa

## 🔍 **Logs Importantes:**

### **Backend (Terminal del servidor):**
```
🚀 Servidor Rider SOS corriendo en http://192.168.1.41:10000
📧 Sistema de emails configurado
🔐 Autenticación JWT activa
Conectado a la base de datos SQLite
Tabla users creada/verificada correctamente
✅ Servidor de email listo para enviar mensajes
```

### **Frontend (Expo Go):**
```
LOG  Categorías de notificaciones configuradas
LOG  Acceso rápido SOS configurado
```

## 📞 **Si Nada Funciona:**

1. **Reinicia todo:**
   - Cierra todas las ventanas
   - Ejecuta `diagnostico_completo.bat`

2. **Verifica la red:**
   - Misma WiFi en todos los dispositivos
   - IP correcta en config.js

3. **Revisa la configuración:**
   - Archivo .env con datos correctos
   - Contraseña de aplicación de Gmail

4. **Limpia la base de datos:**
   - Elimina users.db
   - Reinicia el backend

---

**¡La aplicación debería funcionar correctamente después de seguir estos pasos!** 🎉
