import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getBackendURL } from '../config';

const BACKEND_URL = getBackendURL();
const NOTIFICATION_TOKEN_KEY = '@notification_token';

export const setupPushNotifications = async () => {
  try {
    // 1️⃣ Configurar canal Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
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
      console.log('Permiso de notificaciones denegado');
      return null;
    }

    // 3️⃣ Obtener token
    const tokenObj = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    });
    const token = tokenObj.data;
    console.log('Token actual:', token);

    // 4️⃣ Verificar si cambió
    const oldToken = await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
    if (oldToken !== token) {
      await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
      console.log('Token actualizado en AsyncStorage');

      // 5️⃣ Enviar token al backend
      const authToken = await AsyncStorage.getItem('authToken');
      if (authToken) {
        try {
          const res = await axios.post(
            `${BACKEND_URL}/notifications/register`,
            { token },
            { headers: { Authorization: `Bearer ${authToken}` }, timeout: 10000 }
          );
          console.log('Token registrado en backend:', res.data);
        } catch (error) {
          console.error('Error registrando token en backend:', error.message);
        }
      }
    } else {
      console.log('Token igual que el guardado, no se envía al backend');
    }

    return token;
  } catch (error) {
    console.error('Error configurando notificaciones push:', error.message);
    return null;
  }
};