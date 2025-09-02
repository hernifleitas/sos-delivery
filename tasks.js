// tasks.js
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const LOCATION_TASK_NAME = "background-location-task";

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Task Manager Error:", error);
    return;
  }

  if (data) {
    const { locations } = data;
    const latest = locations[locations.length - 1];

    const coords = {
      lat: latest.coords.latitude,
      lng: latest.coords.longitude,
    };

    // Guardar la última ubicación en AsyncStorage
    await AsyncStorage.setItem("ultimaUbicacion", JSON.stringify(coords));

    // Revisar si SOS está activo
    const sosActivo = await AsyncStorage.getItem("sosActivo");
    if (sosActivo === "true") {
      const nombre = await AsyncStorage.getItem("nombre");
      const moto = await AsyncStorage.getItem("moto");
      const fechaHora = new Date().toLocaleString();

      try {
        await axios.post("http://192.168.1.33:4000/sos", {
          nombre,
          moto,
          ubicacion: coords,
          fechaHora,
        });
        console.log("Ubicación SOS enviada en background:", fechaHora);
      } catch (err) {
        console.error("Error enviando SOS en background:", err);
      }
    }
  }
});

// Función para iniciar la ubicación en background
export const iniciarUbicacionBackground = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();

  if (status === "granted" && bgStatus === "granted") {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Highest,
      distanceInterval: 10, // cada 10 metros
      deferredUpdatesInterval: 60000, // cada 1 minuto
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "SOS activo",
        notificationBody: "La ubicación se está compartiendo en tiempo real",
      },
    });
  } else {
    console.log("Permiso de ubicación denegado");
  }
};
