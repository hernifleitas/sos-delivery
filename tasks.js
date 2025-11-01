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

// Generar riderId aleatorio (fallback)
const generarRiderId = () => `rider-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Obtener o crear un riderId estable por usuario autenticado
const getOrCreateRiderId = async () => {
  try {
    // Si ya existe en storage, usarlo
    let rid = await AsyncStorage.getItem("riderId");
    if (rid) return rid;
    // Si hay userId autenticado, derivar un riderId estable
    const userId = await AsyncStorage.getItem("userId");
    if (userId) {
      rid = `user-${userId}`;
      await AsyncStorage.setItem("riderId", rid);
      return rid;
    }
    // Fallback aleatorio
    rid = generarRiderId();
    await AsyncStorage.setItem("riderId", rid);
    return rid;
  } catch (_) {
    const rid = generarRiderId();
    await AsyncStorage.setItem("riderId", rid);
    return rid;
  }
};

// Función para enviar notificación local con control de duplicados
const enviarNotificacion = async (titulo, mensaje, id = null) => {
  try {
    const notificationId = id || `${titulo}-${Date.now()}`;
    const ultimaNotificacion = await AsyncStorage.getItem(`ultimaNotificacion_${notificationId}`);
    const ahora = Date.now();
    if (ultimaNotificacion && (ahora - parseInt(ultimaNotificacion)) < 30000) {
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
      trigger: null,
    });
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

  const sosActivoValue = await AsyncStorage.getItem("sosActivo");

  // Si hay SOS activo, enviar con lógica de SOS
  if (sosActivoValue === "true") {
    // VALIDACIÓN ESTRICTA: Requerir confirmación explícita del usuario antes de cualquier envío
    const sosConfirmado = await AsyncStorage.getItem('sosConfirmadoPorUsuario');
    if (!sosConfirmado || sosConfirmado !== 'true') {
      console.log('[SOS] Bloqueado: falta confirmación explícita del usuario en background task');
      await AsyncStorage.multiRemove(['sosActivo', 'sosEnviado', 'contadorActualizaciones']);
      await AsyncStorage.setItem('tipoSOS', '');
      return;
    }

    // Anti-falsos positivos: exigir activación reciente y tipo válido
    try {
      const sosInicioStr = await AsyncStorage.getItem('sosInicio');
      const sosInicio = sosInicioStr ? parseInt(sosInicioStr) : 0;
      const nowTs = Date.now();
      const ACTIVATION_WINDOW_MS = 5 * 60 * 1000; // 5 minutos
      const tipoActual = (await AsyncStorage.getItem("tipoSOS")) || "";
      const esEmergencia = tipoActual === 'robo' || tipoActual === 'accidente';
      const dentroDeVentana = sosInicio && (nowTs - sosInicio) <= ACTIVATION_WINDOW_MS;

      if (esEmergencia) {
        // Si es una emergencia, forzar el envío de ubicación
        await enviarUbicacionSOS(latest.coords, true);
      } else if (!dentroDeVentana) {
        // Si no es emergencia y está fuera de la ventana, limpiar
        await AsyncStorage.multiRemove([
          'sosActivo',
          'sosEnviado',
          'contadorActualizaciones'
        ]);
        await AsyncStorage.setItem('tipoSOS', '');
        console.log('[SOS] Limpiando estado por ventana de tiempo excedida');
      }
    } catch (_) { /* si falla, continuar con más validaciones abajo */ }

    const riderId = await getOrCreateRiderId();

    const nombre = (await AsyncStorage.getItem("nombre")) || "No especificado";
    const moto = (await AsyncStorage.getItem("moto")) || "No especificado";
    let color = (await AsyncStorage.getItem("color")) || "No especificado";
    color = color.trim() !== "" ? color : "No especificado";
    const tipoSOS = (await AsyncStorage.getItem("tipoSOS")) || "robo";
    if (!(tipoSOS === 'robo' || tipoSOS === 'accidente')) {
      console.log('[SOS] Tipo inválido, cancelando envío:', tipoSOS);
      return;
    }
    const sosEnviado = await AsyncStorage.getItem("sosEnviado");

    const mensajeBackend = {
      riderId,
      nombre,
      moto,
      color,
      ubicacion: { lat: coords.lat, lng: coords.lng },
      fechaHora: new Date().toISOString(),
      tipo: tipoSOS,
      tipoSOSActual: tipoSOS || null,
    };

    try {
      const authToken = await AsyncStorage.getItem('authToken');
      await axios.post(BACKEND_URL, mensajeBackend, {
        headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        timeout: 20000,
      });


      if (sosEnviado !== "true") {
        await AsyncStorage.setItem("sosEnviado", "true");
      }


    } catch (err) {
      console.error("Error enviando ubicación al backend:", err.message);
      if (sosEnviado !== "true") {
        await enviarNotificacion(
          "Error de conexión",
          "No se pudo enviar la ubicación. Verifica tu conexión a internet.",
          "connection-error"
        );
      }
      await AsyncStorage.setItem("pendienteEnvio", JSON.stringify(mensajeBackend));
    }
    return;
  }

  // Si NO hay SOS activo: enviar lat/lng como estado "normal" (keep-alive) cada 60s
  try {
    const repartiendo = (await AsyncStorage.getItem('repartiendoActivo')) === 'true';
    if (!repartiendo) return;

    const lastNormalTs = await AsyncStorage.getItem('lastNormalSentTs');
    const now = Date.now();
    const intervalMs = 60000; // 60s
    if (!lastNormalTs || now - parseInt(lastNormalTs) >= intervalMs) {
      const riderId = await getOrCreateRiderId();
      const nombre = (await AsyncStorage.getItem("nombre")) || "No especificado";
      const moto = (await AsyncStorage.getItem("moto")) || "No especificado";
      let color = (await AsyncStorage.getItem("color")) || "No especificado";
      color = color.trim() !== "" ? color : "No especificado";

      const sosEnviadoFlag = await AsyncStorage.getItem("sosEnviado");
      if (sosEnviadoFlag !== 'true') {
        const authToken = await AsyncStorage.getItem('authToken');
        await axios.post(BACKEND_URL, {
          riderId,
          nombre,
          moto,
          color,
          ubicacion: { lat: coords.lat, lng: coords.lng },
          fechaHora: new Date().toISOString(),
          tipo: "normal",
        }, {
          headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
          timeout: 15000,
        });
        await AsyncStorage.setItem('lastNormalSentTs', now.toString());
      }
    }
  } catch (e) {
    console.warn('No se pudo enviar estado normal (keep-alive):', e?.message);
  }
});

export const iniciarUbicacionBackground = async () => {
  try {

    const { status } = await Location.requestForegroundPermissionsAsync();
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();

    if (status === "granted" && bgStatus === "granted") {
      const isTaskRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (isTaskRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      if (!isTaskRegistered) {
        // Configuración del servicio en segundo plano
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000,  // 30 segundos
          distanceInterval: 5, // 5 metros
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: "🚨 SOS Activo",
            notificationBody: "Monitoreando tu ubicación",
            notificationColor: "#e74c3c",
            notificationChannelId: "sos-channel",
            notificationIcon: "ic_notification",
            notificationPriority: 2, // PRIORITY_HIGH
          },
          // Configuración específica para Android
          android: {
            notificationChannelId: "sos-channel",
            notificationTitle: "🚨 SOS Activo",
            notificationText: "Monitoreando tu ubicación",
            notificationColor: "#e74c3c",
            notificationIcon: "ic_notification",
            notificationPriority: 2, // PRIORITY_HIGH
            enableAccuracyNotification: true,
            startForeground: true,
            stopOnTerminate: false,
            startOnBoot: true,
            // Configuración adicional para mantener el servicio activo
            foregroundService: {
              notificationTitle: "🚨 SOS Activo",
              notificationBody: "Monitoreando tu ubicación",
              notificationColor: "#e74c3c"
            }
          }
        });

        console.log("Servicio de ubicación en segundo plano iniciado");
        return true;
      }
    } else {
      await enviarNotificacion(
        "Permisos Requeridos",
        "La aplicación necesita permisos de ubicación para funcionar correctamente",
        "permissions-required"
      );
      return false;
    }
  } catch (error) {
    console.error("Error iniciando ubicación en segundo plano:", error);
    await enviarNotificacion(
      "Error de Configuración",
      "No se pudo configurar el tracking de ubicación: " + error.message,
      "config-error"
    );
    return false;
  }
};

export const detenerUbicacionBackground = async () => {
  try {
    const isTaskRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (isTaskRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  } catch (error) {
    console.error("Error deteniendo ubicación en segundo plano:", error);
  }
};

export const verificarEstadoTracking = async () => {
  try {
    const isTaskRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    const ultimaUbicacion = await AsyncStorage.getItem("ultimaUbicacion");
    const timestamp = await AsyncStorage.getItem("ultimaUbicacionTimestamp");
    return {
      trackingActivo: isTaskRegistered,
      ultimaUbicacion: ultimaUbicacion ? JSON.parse(ultimaUbicacion) : null,
      ultimaActualizacion: timestamp ? new Date(parseInt(timestamp)) : null,
    };
  } catch (error) {
    console.error("Error verificando estado del tracking:", error);
    return { trackingActivo: false, ultimaUbicacion: null, ultimaActualizacion: null };
  }
};
