// services/NotificationsService.js
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendURL } from '../config';

const BACKEND_URL = getBackendURL();

export async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default', importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250], lightColor: '#FF231F7C',
    });
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }
  token = (await Notifications.getExpoPushTokenAsync({ projectId: Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId })).data;
  await AsyncStorage.setItem('expoPushToken', token);
  return token;
}

export async function sendPushTokenToBackend(token) {
  try {
    const authToken = await AsyncStorage.getItem('authToken');
    if (!authToken || !token) return { success: false };
    const res = await axios.post(`${BACKEND_URL}/notifications/register`, { token }, {
      headers: { Authorization: `Bearer ${authToken}` }, timeout: 10000,
    });
    return res.data;
  } catch (e) {
    return { success: false };
  }
}
