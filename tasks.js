import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { getBackendURL } from "./config";

export const LOCATION_TASK_NAME = "background-location-task";
const BACKEND_URL = `${getBackendURL()}/sos`;

// Configurar notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Generar riderId simple
const generarRiderId = () => `rider-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Función para enviar notificación local con control de duplicados
const enviarNotificacion = async (titulo, mensaje, id = null) => {
  try {
    // Generar ID único si no se proporciona
    const notificationId = id || `${titulo}-${Date.now()}`;
    
    // Verificar si ya se envió esta notificación recientemente
    const ultimaNotificacion = await AsyncStorage.getItem(`ultimaNotificacion_${notificationId}`);
    const ahora = Date.now();
    
    if (ultimaNotificacion && (ahora - parseInt(ultimaNotificacion)) < 30000) {
      // No enviar si se envió hace menos de 30 segundos
      console.log(`Notificación ${notificationId} omitida (duplicado)`);
      return;
    }
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: mensaje,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { notificationId }
      },
      trigger: null, // Enviar inmediatamente
    });
    
    // Guardar timestamp de la última notificación
    await AsyncStorage.setItem(`ultimaNotificacion_${notificationId}`, ahora.toString());
  } catch (error) {
    console.error("Error enviando notificación:", error);
  }
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Task Manager Error:", error);
    await enviarNotificacion("Error SOS", "Error en el tracking de ubicación", "task-manager-error");
    return;
  }
  if (!data) return;

  const { locations } = data;
  const latest = locations[locations.length - 1];
  const coords = { lat: latest.coords.latitude, lng: latest.coords.longitude };

  // Guardar ubicación actual
  await AsyncStorage.setItem("ultimaUbicacion", JSON.stringify(coords));
  await AsyncStorage.setItem("ultimaUbicacionTimestamp", Date.now().toString());

  const sosActivo = await AsyncStorage.getItem("sosActivo");
  if (sosActivo !== "true") return;

  let riderId = await AsyncStorage.getItem("riderId");
  if (!riderId) {
    riderId = generarRiderId();
    await AsyncStorage.setItem("riderId", riderId);
  }

  const nombre = (await AsyncStorage.getItem("nombre")) || "No especificado";
  const moto = (await AsyncStorage.getItem("moto")) || "No especificado";
  let color = (await AsyncStorage.getItem("color")) || "No especificado";
  color = color.trim() !== "" ? color : "No especificado";
  const tipoSOS = (await AsyncStorage.getItem("tipoSOS")) || "robo";
  const sosEnviado = await AsyncStorage.getItem("sosEnviado");

  const mensajeBackend = {
    riderId,
    nombre,
    moto,
    color,
    ubicacion: {
      lat: coords.lat,
      lng: coords.lng
    },
    fechaHora: new Date().toISOString(),
    tipo: sosEnviado !== "true" ? tipoSOS : "actualizacion",
  };

  try {
    const authToken = await AsyncStorage.getItem('authToken');
    await axios.post(BACKEND_URL, mensajeBackend, {
      headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
      timeout: 15000, // Aumentado a 15 segundos
    });

    if (sosEnviado !== "true") {
      await AsyncStorage.setItem("sosEnviado", "true");
      console.log(`Alerta inicial (${tipoSOS}) enviada:`, mensajeBackend.fechaHora);
      await enviarNotificacion(
        `SOS ${tipoSOS.toUpperCase()}`, 
        `Alerta enviada. Ubicación: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
        `sos-${tipoSOS}-${riderId}`
      );
    } else {
      console.log(`Actualización de ubicación enviada (${tipoSOS}):`, mensajeBackend.fechaHora);
      // Enviar notificación de actualización cada 5 actualizaciones para no saturar
      const contadorActualizaciones = await AsyncStorage.getItem("contadorActualizaciones") || "0";
      const contador = parseInt(contadorActualizaciones) + 1;
      await AsyncStorage.setItem("contadorActualizaciones", contador.toString());
      
      if (contador % 5 === 0) {
        await enviarNotificacion(
          `📍 Actualización ${tipoSOS.toUpperCase()}`, 
          `Ubicación actualizada. ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
          `update-${tipoSOS}-${riderId}-${contador}`
        );
      }
    }
  } catch (err) {
    console.error("Error enviando ubicación al backend:", err.message);
    
    // Solo enviar notificación de error si es un SOS inicial
    if (sosEnviado !== "true") {
      await enviarNotificacion(
        "Error de conexión", 
        "No se pudo enviar la ubicación. Verifica tu conexión a internet.",
        "connection-error"
      );
    }
    
    // Guardar para reintento posterior
    await AsyncStorage.setItem("pendienteEnvio", JSON.stringify(mensajeBackend));
  }
});

export const iniciarUbicacionBackground = async () => {
  try {
    // Solicitar permisos de notificaciones
    const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
    if (notificationStatus !== 'granted') {
      console.log("Permiso de notificaciones denegado");
    }

    // Solicitar permisos de ubicación
    const { status } = await Location.requestForegroundPermissionsAsync();
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();

    if (status === "granted" && bgStatus === "granted") {
      // Verificar si ya hay una tarea ejecutándose
      const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      const isTaskRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

      if (!isTaskRegistered) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High, // Más fiable para callbacks periódicos
          // Asegurar actualizaciones periódicas incluso sin movimiento (Android)
          timeInterval: 120000, // cada 2 minutos
          distanceInterval: 0, // enviar aunque no haya movimiento
          deferredUpdatesInterval: 60000, // cada 1 min
          deferredUpdatesDistance: 0,
          activityType: Location.ActivityType.Other,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: "🚨 SOS Activo",
            notificationBody: "Compartiendo ubicación en tiempo real",
            notificationColor: "#e74c3c",
          },
          // Configuraciones adicionales para Android
          mayShowUserSettingsDialog: true,
          pausesLocationUpdatesAutomatically: false,
        });
        console.log("Ubicación en segundo plano iniciada correctamente");
        
        // Enviar notificación de confirmación
        await enviarNotificacion(
          "SOS Configurado", 
          "La aplicación está lista para enviar alertas en segundo plano",
          "sos-configured"
        );
      } else {
        console.log("Ubicación en segundo plano ya está activa");
      }
    } else {
      console.log("Permisos de ubicación denegados");
      await enviarNotificacion(
        "Permisos Requeridos", 
        "La aplicación necesita permisos de ubicación para funcionar correctamente",
        "permissions-required"
      );
    }
  } catch (error) {
    console.error("Error iniciando ubicación en segundo plano:", error);
    await enviarNotificacion(
      "Error de Configuración", 
      "No se pudo configurar el tracking de ubicación",
      "config-error"
    );
  }
};

// Función para detener el tracking de ubicación
export const detenerUbicacionBackground = async () => {
  try {
    const isTaskRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (isTaskRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log("Ubicación en segundo plano detenida");
    }
  } catch (error) {
    console.error("Error deteniendo ubicación en segundo plano:", error);
  }
};

// Función para verificar el estado del tracking
export const verificarEstadoTracking = async () => {
  try {
    const isTaskRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    const ultimaUbicacion = await AsyncStorage.getItem("ultimaUbicacion");
    const timestamp = await AsyncStorage.getItem("ultimaUbicacionTimestamp");
    
    return {
      trackingActivo: isTaskRegistered,
      ultimaUbicacion: ultimaUbicacion ? JSON.parse(ultimaUbicacion) : null,
      ultimaActualizacion: timestamp ? new Date(parseInt(timestamp)) : null
    };
  } catch (error) {
    console.error("Error verificando estado del tracking:", error);
    return { trackingActivo: false, ultimaUbicacion: null, ultimaActualizacion: null };
  }
};
