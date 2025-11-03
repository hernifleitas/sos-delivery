import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getBackendURL } from '../config';

const BACKEND_URL = getBackendURL();
const NOTIFICATION_TOKEN_KEY = '@notification_token';

// Configurar cómo se manejan las notificaciones cuando la app está en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registra el dispositivo para recibir notificaciones push
 * Funciona tanto en Expo Go como en builds EAS
 */
export const registerForPushNotificationsAsync = async () => {
  try {
    // Verificar que sea un dispositivo físico
    if (!Device.isDevice) {
      console.log('Las notificaciones push solo funcionan en dispositivos físicos');
      return null;
    }

    // 1️⃣ Configurar canal Android (requerido para Android 8+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Alertas SOS',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    // 2️⃣ Solicitar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('⚠️ Permiso de notificaciones denegado');
      return null;
    }

    // 3️⃣ Obtener token de Expo Push
    let token;
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('❌ No se encontró projectId en app.json');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      token = tokenData.data;
    } catch (error) {
      console.error('❌ Error obteniendo token de Expo:', error.message);
      return null;
    }

    // 4️⃣ Guardar token localmente
    await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
    
    return token;
  } catch (error) {
    console.error('❌ Error en registerForPushNotificationsAsync:', error.message);
    return null;
  }
};

/**
 * Envía el token de notificaciones al backend
 */
export const sendPushTokenToBackend = async (token) => {
  if (!token) {
    console.log('⚠️ No hay token para enviar al backend');
    return false;
  }

  try {
    const authToken = await AsyncStorage.getItem('authToken');
    if (!authToken) {
      console.log('⚠️ No hay authToken, no se puede registrar el token de notificaciones');
      return false;
    }

    const response = await axios.post(
      `${BACKEND_URL}/api/notifications/register`,
      { token },
      { 
        headers: { Authorization: `Bearer ${authToken}` }, 
        timeout: 10000 
      }
    );

    return true;
  } catch (error) {
    console.error('❌ Error registrando token en backend:', error.response?.data || error.message);
    return false;
  }
};

/**
 * Configuración completa de notificaciones push
 * Llama a esta función al iniciar la app o después del login
 */
export const setupPushNotifications = async () => {
  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await sendPushTokenToBackend(token);
    }
    return token;
  } catch (error) {
    console.error('❌ Error en setupPushNotifications:', error.message);
    return null;
  }
};