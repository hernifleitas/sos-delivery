// backgroundConfig.js
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración de notificaciones para background
export const configurarNotificaciones = async () => {
  // Configurar el handler de notificaciones
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Solicitar permisos con configuración específica para background
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowAnnouncements: true,
      allowCriticalAlerts: false,
      provideAppNotificationSettings: false,
      allowProvisional: false,
    },
  });
  return status === 'granted';
};

// Función para enviar notificación de estado con control de duplicados
export const enviarNotificacionEstado = async (titulo, mensaje, datos = {}) => {
  try {
    // Generar ID único basado en el título
    const notificationId = `estado-${titulo.replace(/\s+/g, '-').toLowerCase()}`;
    
    // Verificar si ya se envió esta notificación recientemente
    const ultimaNotificacion = await AsyncStorage.getItem(`ultimaNotificacion_${notificationId}`);
    const ahora = Date.now();
    
    if (ultimaNotificacion && (ahora - parseInt(ultimaNotificacion)) < 60000) {
      // No enviar si se envió hace menos de 1 minuto
      console.log(`Notificación ${notificationId} omitida (duplicado)`);
      return;
    }
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: mensaje,
        data: { ...datos, notificationId },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Enviar inmediatamente
    });
    
    // Guardar timestamp de la última notificación
    await AsyncStorage.setItem(`ultimaNotificacion_${notificationId}`, ahora.toString());
  } catch (error) {
    console.error('Error enviando notificación:', error);
  }
};

// Función para enviar notificación con botones de acción SOS
export const enviarNotificacionSOS = async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚨 SOS Rápido",
        body: "¿Necesitas activar una alerta de emergencia?",
        data: { type: 'sos_quick_access' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'SOS_CATEGORY',
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error enviando notificación SOS:', error);
  }
};

// Función para enviar notificación de SOS activo con opción de cancelar
export const enviarNotificacionSOSActivo = async (tipo) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 SOS ${tipo.toUpperCase()} ACTIVO`,
        body: "Alerta activa - Ubicación siendo enviada cada 2 minutos",
        data: { type: 'sos_activo', sos_tipo: tipo },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'SOS_ACTIVO_CATEGORY',
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error enviando notificación SOS activo:', error);
  }
};

// Función para activar SOS desde notificación
export const activarSOSDesdeNotificacion = async (tipo = 'robo') => {
  try {
    // Obtener datos del usuario
    const nombre = await AsyncStorage.getItem('nombre') || 'Usuario';
    const moto = await AsyncStorage.getItem('moto') || 'No especificado';
    const color = await AsyncStorage.getItem('color') || 'No especificado';
    
    // Activar SOS
    await AsyncStorage.setItem('sosActivo', 'true');
    await AsyncStorage.setItem('sosInicio', Date.now().toString());
    await AsyncStorage.setItem('sosEnviado', 'false');
    await AsyncStorage.setItem('tipoSOS', tipo);
    
    // Enviar notificación de confirmación
    await enviarNotificacionEstado(
      `🚨 SOS ${tipo.toUpperCase()} ACTIVADO`,
      `Alerta de ${tipo} activada desde segundo plano. Ubicación siendo enviada cada 2 minutos.`,
      { tipo, activadoDesde: 'background' }
    );
    
    // Enviar notificación de SOS activo con opción de cancelar
    await enviarNotificacionSOSActivo(tipo);
    
    console.log(`SOS ${tipo} activado desde segundo plano`);
    
    // Programar envío inmediato de ubicación
    setTimeout(async () => {
      await enviarUbicacionInmediata(tipo);
    }, 5000); // Enviar en 5 segundos
    
    // Iniciar intervalo de envío cada 2 minutos
    setTimeout(async () => {
      await iniciarIntervaloSOSBackground(tipo);
    }, 10000); // Iniciar intervalo después de 10 segundos
    
    return true;
  } catch (error) {
    console.error('Error activando SOS desde notificación:', error);
    return false;
  }
};

// Función para enviar ubicación inmediatamente
const enviarUbicacionInmediata = async (tipo) => {
  try {
    const axios = require('axios');
    const ubicacionString = await AsyncStorage.getItem("ultimaUbicacion");
    let ubicacion = { lat: 0, lng: 0 };
    if (ubicacionString) ubicacion = JSON.parse(ubicacionString);

    const riderId = await AsyncStorage.getItem("riderId") || `rider-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nombre = await AsyncStorage.getItem('nombre') || 'Usuario';
    const moto = await AsyncStorage.getItem('moto') || 'No especificado';
    const color = await AsyncStorage.getItem('color') || 'No especificado';

    const fechaHora = new Date().toISOString();

    await axios.post("http://192.168.1.41:10000/sos", {
      riderId,
      nombre,
      moto,
      color,
      ubicacion: {
        lat: ubicacion.lat ?? 0,
        lng: ubicacion.lng ?? 0
      },
      fechaHora,
      tipo,
    });

    await AsyncStorage.setItem("sosEnviado", "true");
    console.log(`Ubicación enviada inmediatamente (${tipo}):`, fechaHora);
    
    // Enviar notificación de confirmación
    await enviarNotificacionEstado(
      `✅ Ubicación Enviada`,
      `SOS ${tipo} enviado correctamente. Ubicación: ${ubicacion.lat.toFixed(4)}, ${ubicacion.lng.toFixed(4)}`,
      { tipo, ubicacion }
    );
    
  } catch (err) {
    console.error("Error enviando ubicación inmediata:", err.message);
    await enviarNotificacionEstado(
      "❌ Error de Envío",
      "No se pudo enviar la ubicación. Verifica tu conexión.",
      { error: err.message }
    );
  }
};

// Función para iniciar intervalo de SOS desde background
const iniciarIntervaloSOSBackground = async (tipo) => {
  try {
    // Verificar si el SOS sigue activo
    const sosActivo = await AsyncStorage.getItem('sosActivo');
    if (sosActivo !== 'true') {
      console.log('SOS no está activo, cancelando intervalo');
      return;
    }

    // Enviar ubicación actual
    await enviarUbicacionInmediata(tipo);
    
    // Programar siguiente envío en 2 minutos
    setTimeout(async () => {
      await iniciarIntervaloSOSBackground(tipo);
    }, 2 * 60 * 1000); // 2 minutos
    
    console.log(`Intervalo de SOS ${tipo} programado para 2 minutos`);
  } catch (error) {
    console.error('Error en intervalo de SOS background:', error);
  }
};

// Función para limpiar notificaciones
export const limpiarNotificaciones = async () => {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error limpiando notificaciones:', error);
  }
};

// Función para verificar si la app está en background
export const verificarEstadoApp = async () => {
  try {
    const appState = await AsyncStorage.getItem('appState');
    const ultimaActividad = await AsyncStorage.getItem('ultimaActividad');
    
    return {
      estado: appState || 'active',
      ultimaActividad: ultimaActividad ? new Date(parseInt(ultimaActividad)) : null,
      tiempoInactivo: ultimaActividad ? Date.now() - parseInt(ultimaActividad) : 0
    };
  } catch (error) {
    console.error('Error verificando estado de la app:', error);
    return { estado: 'unknown', ultimaActividad: null, tiempoInactivo: 0 };
  }
};

// Función para actualizar el estado de la app
export const actualizarEstadoApp = async (estado) => {
  try {
    await AsyncStorage.setItem('appState', estado);
    await AsyncStorage.setItem('ultimaActividad', Date.now().toString());
  } catch (error) {
    console.error('Error actualizando estado de la app:', error);
  }
};

// Función para verificar tareas activas
export const verificarTareasActivas = async () => {
  try {
    const tareasRegistradas = TaskManager.getRegisteredTasksAsync();
    return tareasRegistradas;
  } catch (error) {
    console.error('Error verificando tareas activas:', error);
    return [];
  }
};

// Función para optimizar el rendimiento en background
export const optimizarRendimientoBackground = async () => {
  try {
    // Limpiar datos antiguos del AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    
    // Primero filtrar las keys que no necesitan verificación de timestamp
    const keysToRemove = keys.filter(key => 
      key.includes('temp_') || 
      key.includes('cache_')
    );
    
    // Luego verificar las keys con timestamp
    const timestampKeys = keys.filter(key => key.includes('timestamp'));
    for (const key of timestampKeys) {
      try {
        const timestamp = await AsyncStorage.getItem(key);
        if (timestamp && Date.now() - parseInt(timestamp) > 86400000) { // 24 horas
          keysToRemove.push(key);
        }
      } catch (error) {
        console.error(`Error verificando timestamp para ${key}:`, error);
      }
    }
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`Limpiados ${keysToRemove.length} elementos del storage`);
    }
  } catch (error) {
    console.error('Error optimizando rendimiento:', error);
  }
};

// Función para manejar el ciclo de vida de la app
export const manejarCicloVidaApp = {
  onAppStateChange: async (nextAppState) => {
    await actualizarEstadoApp(nextAppState);
    
    if (nextAppState === 'background') {
      console.log('App en segundo plano');
      
      // Verificar si ya se envió la notificación de background
      const notificacionEnviada = await AsyncStorage.getItem('notificacionBackgroundEnviada');
      if (notificacionEnviada !== 'true') {
        await enviarNotificacionEstado(
          'SOS Activo',
          'La aplicación continúa funcionando en segundo plano'
        );
        await AsyncStorage.setItem('notificacionBackgroundEnviada', 'true');
      }
      
      // Enviar notificación de acceso rápido después de 30 segundos (solo una vez)
      setTimeout(async () => {
        const sosActivo = await AsyncStorage.getItem('sosActivo');
        const notificacionAccesoEnviada = await AsyncStorage.getItem('notificacionAccesoEnviada');
        if (sosActivo !== 'true' && notificacionAccesoEnviada !== 'true') {
          await enviarNotificacionSOS();
          await AsyncStorage.setItem('notificacionAccesoEnviada', 'true');
        }
      }, 30000);
      
    } else if (nextAppState === 'active') {
      console.log('App activa');
      // Resetear flags de notificaciones cuando la app vuelve a estar activa
      await AsyncStorage.removeItem('notificacionBackgroundEnviada');
      await AsyncStorage.removeItem('notificacionAccesoEnviada');
      await optimizarRendimientoBackground();
    }
  }
};

// Función para detectar gestos de emergencia (vibración rápida)
export const configurarDeteccionEmergencia = async () => {
  try {
    // Esta función se puede expandir para detectar patrones de vibración
    // o gestos específicos del dispositivo
    console.log('Detección de emergencia configurada');
  } catch (error) {
    console.error('Error configurando detección de emergencia:', error);
  }
};

// Función para activar SOS con doble tap en notificación
export const manejarNotificacionSOS = async (notification) => {
  try {
    const { data } = notification.request.content;
    
    if (data?.type === 'sos_quick_access') {
      // Activar SOS de robo por defecto
      await activarSOSDesdeNotificacion('robo');
    }
  } catch (error) {
    console.error('Error manejando notificación SOS:', error);
  }
};
