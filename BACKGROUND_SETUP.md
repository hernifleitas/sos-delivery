# Configuración de Ejecución en Segundo Plano - SOS App

## 🚀 Funcionalidades Implementadas

### ✅ Tracking de Ubicación en Segundo Plano
- **Ubicación continua**: La app mantiene el tracking de ubicación incluso cuando está en segundo plano
- **Optimización de batería**: Configuración balanceada para reducir el consumo de batería
- **Notificaciones persistentes**: Muestra una notificación permanente cuando el tracking está activo
- **Actualizaciones automáticas**: Envía ubicación cada minuto cuando hay un SOS activo

### ✅ Sistema de Notificaciones
- **Notificaciones locales**: Alertas cuando se activa/desactiva el SOS
- **Notificaciones de estado**: Información sobre el estado del tracking
- **Notificaciones de error**: Alertas cuando hay problemas de conexión
- **Sonidos personalizados**: Notificaciones con sonido para mayor visibilidad

### ✅ Gestión de Permisos
- **Permisos de ubicación**: Foreground y background
- **Permisos de notificaciones**: Para alertas locales
- **Configuración automática**: Solicita permisos necesarios al iniciar

## 📱 Configuración por Plataforma

### Android
Los siguientes permisos están configurados en `app.json`:
```json
"permissions": [
  "ACCESS_FINE_LOCATION",
  "ACCESS_COARSE_LOCATION", 
  "ACCESS_BACKGROUND_LOCATION",
  "FOREGROUND_SERVICE",
  "FOREGROUND_SERVICE_LOCATION",
  "WAKE_LOCK",
  "RECEIVE_BOOT_COMPLETED",
  "VIBRATE"
]
```

### iOS
Configurado en `app.json`:
```json
"infoPlist": {
  "NSLocationAlwaysAndWhenInUseUsageDescription": "...",
  "NSLocationWhenInUseUsageDescription": "...",
  "NSLocationAlwaysUsageDescription": "...",
  "UIBackgroundModes": ["location", "background-processing", "background-fetch"]
}
```

## 🔧 Archivos Modificados

### 1. `app.json`
- ✅ Agregados permisos de ubicación en background
- ✅ Configurados plugins de expo-location y expo-notifications
- ✅ Configurados background modes para iOS

### 2. `tasks.js`
- ✅ Mejorado el TaskManager para mejor rendimiento
- ✅ Agregadas notificaciones locales
- ✅ Optimizada la configuración de ubicación
- ✅ Agregadas funciones de control (iniciar/detener/verificar)

### 3. `App.js`
- ✅ Integrado el manejo del ciclo de vida de la app
- ✅ Agregada interfaz para controlar el tracking
- ✅ Configuración automática de notificaciones
- ✅ Manejo de estados de la aplicación

### 4. `backgroundConfig.js` (NUEVO)
- ✅ Configuración centralizada de notificaciones
- ✅ Manejo del ciclo de vida de la app
- ✅ Optimización de rendimiento
- ✅ Utilidades para gestión de background

## 🎯 Cómo Usar

### 1. Iniciar Tracking
- La app inicia automáticamente el tracking al abrirse
- Puedes ver el estado en la interfaz: "📍 Tracking: 🟢 Activo"
- Usa el botón "Detener Tracking" si necesitas pausarlo

### 2. Activar SOS
- Presiona "🚨 SOS Robo" o "🛠️ SOS Pinchazo"
- La app enviará la ubicación cada minuto automáticamente
- Funciona incluso si cierras la app o pones el teléfono en modo avión

### 3. Notificaciones
- Recibirás notificaciones cuando:
  - Se activa/desactiva el tracking
  - Se envía una alerta SOS
  - Hay errores de conexión
  - La app pasa a segundo plano

## 🔋 Optimizaciones de Batería

### Configuración Implementada:
- **Accuracy**: `Balanced` (en lugar de `Highest`)
- **Distance Interval**: 50 metros (en lugar de 10)
- **Deferred Updates**: 60 segundos (en lugar de 120)
- **Limpieza automática**: Datos temporales se eliminan automáticamente

### Recomendaciones:
1. **Mantén la app en la lista de apps permitidas** en segundo plano
2. **Desactiva la optimización de batería** para esta app
3. **Permite notificaciones** para recibir alertas importantes

## 🚨 Solución de Problemas

### El tracking no funciona en segundo plano:
1. Verifica que los permisos estén otorgados
2. Desactiva la optimización de batería para la app
3. Asegúrate de que la app esté en la lista de apps permitidas

### No recibes notificaciones:
1. Verifica los permisos de notificaciones
2. Revisa la configuración de "No molestar"
3. Asegúrate de que los sonidos estén habilitados

### La ubicación no se actualiza:
1. Verifica que el GPS esté activado
2. Asegúrate de tener buena señal
3. Revisa que los permisos de ubicación estén otorgados

## 📊 Monitoreo

La app incluye funciones para monitorear el estado:
- `verificarEstadoTracking()`: Verifica si el tracking está activo
- `verificarEstadoApp()`: Monitorea el estado de la aplicación
- `verificarTareasActivas()`: Lista las tareas en ejecución

## 🔄 Próximos Pasos

Para mejorar aún más la funcionalidad en segundo plano:

1. **Implementar geofencing** para alertas automáticas
2. **Agregar modo de emergencia** con vibración continua
3. **Implementar backup de datos** en caso de pérdida de conexión
4. **Agregar métricas de rendimiento** para monitoreo

---

**¡La aplicación ahora está completamente configurada para funcionar en segundo plano!** 🎉

