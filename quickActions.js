// quickActions.js
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activarSOSDesdeNotificacion } from './backgroundConfig';
import axios from 'axios';
import { getBackendURL } from './config';

const BACKEND_URL = getBackendURL();

// Configurar categorías de notificaciones con acciones
export const configurarCategoriasNotificaciones = async () => {
  try {
    // Definir categoría para acciones SOS
    await Notifications.setNotificationCategoryAsync('SOS_CATEGORY', [
      {
        identifier: 'SOS_ROBO',
        buttonTitle: '🚨 SOS Robo',
        options: {
          isDestructive: true,
          isAuthenticationRequired: false,
        },
      },
      {
        identifier: 'SOS_ACCIDENTE',
        buttonTitle: '🚑 SOS ACCIDENTE',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
      {
        identifier: 'CANCELAR_SOS',
        buttonTitle: '❌ Cancelar',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
    ]);
    
    // Definir categoría para SOS activo con opción de cancelar
    await Notifications.setNotificationCategoryAsync('SOS_ACTIVO_CATEGORY', [
      {
        identifier: 'CANCELAR_SOS_ACTIVO',
        buttonTitle: '❌ Cancelar SOS',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
    ]);
    
    console.log('Categorías de notificaciones configuradas');
  } catch (error) {
    console.error('Error configurando categorías:', error);
  }
};

// Función para enviar notificación con botones de acción
export const enviarNotificacionConAcciones = async () => {
          // Enviar notificación de acceso rápido cada 15 minutos cuando la app está en background
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "🚨 SOS Rápido Disponible",
              body: "La app está lista para enviar alertas de emergencia",
              data: { type: 'sos_quick_actions' },
              sound: false, // Sin sonido para no molestar
              priority: Notifications.AndroidNotificationPriority.LOW,
              categoryIdentifier: 'SOS_CATEGORY',
            },
            trigger: {
              seconds: 1200,
              repeats: true,
            },
          });
};

// Función para manejar respuestas de notificaciones
import { Alert } from 'react-native';

export const manejarRespuestaNotificacion = async (response) => {
  try {
    const { actionIdentifier, notification } = response;
    const { data } = notification.request.content;

    console.log('Respuesta de notificación recibida:', { actionIdentifier, data });

    if (data?.type === 'sos_quick_actions' || data?.type === 'sos_quick_access') {
      switch (actionIdentifier) {
        case 'SOS_ROBO':
          console.log('Tocaron SOS Robo desde notificación');

          Alert.alert(
            "Confirmar SOS Robo",
            "¿Querés activar el SOS Robo?",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Confirmar",
                onPress: async () => {
                  await AsyncStorage.setItem('sosConfirmadoPorUsuario', 'true');
                  await AsyncStorage.setItem('sosConfirmadoTimestamp', Date.now().toString());
                  await activarSOSDesdeNotificacion('robo');
                }
              }
            ],
            { cancelable: false }
          );
          break;

        case 'SOS_ACCIDENTE':
          console.log('Tocaron SOS Accidente desde notificación');

          Alert.alert(
            "Confirmar SOS Accidente",
            "¿Querés activar el SOS Accidente?",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Confirmar",
                onPress: async () => {
                  await AsyncStorage.setItem('sosConfirmadoPorUsuario', 'true');
                  await AsyncStorage.setItem('sosConfirmadoTimestamp', Date.now().toString());
                  await activarSOSDesdeNotificacion('accidente');
                }
              }
            ],
            { cancelable: false }
          );
          break;

        case 'CANCELAR_SOS':
          console.log('Cancelando SOS desde notificación');
          await AsyncStorage.setItem('sosActivo', 'false');
          await AsyncStorage.setItem('sosEnviado', 'false');
          await AsyncStorage.removeItem('sosConfirmado');
          // Mantener tu lógica de enviar estado normal al backend
          await enviarEstadoNormalBackend();
          break;

        default:
          console.log('Acción no reconocida:', actionIdentifier);
      }
    } else if (data?.type === 'sos_activo') {
      if (actionIdentifier === 'CANCELAR_SOS_ACTIVO') {
        console.log('Cancelando SOS activo desde notificación');
        await cancelarSOSDesdeNotificacion();
        await AsyncStorage.removeItem('sosConfirmado');
        await enviarEstadoNormalBackend();
      } else {
        console.log('Acción no reconocida para SOS activo:', actionIdentifier);
      }
    }
  } catch (error) {
    console.error('Error manejando respuesta de notificación:', error);
  }
};

// Función auxiliar para enviar estado "normal" al backend
const enviarEstadoNormalBackend = async () => {
  try {
    const riderId = await AsyncStorage.getItem('riderId');
    const nombre = (await AsyncStorage.getItem('nombre')) || 'Usuario';
    const moto = (await AsyncStorage.getItem('moto')) || 'No especificado';
    const color = (await AsyncStorage.getItem('color')) || 'No especificado';
    const ubicacionString = await AsyncStorage.getItem('ultimaUbicacion');
    const ubicacion = ubicacionString ? JSON.parse(ubicacionString) : { lat: 0, lng: 0 };
    const authToken = await AsyncStorage.getItem('authToken');

    await axios.post(`${BACKEND_URL}/sos`, {
      riderId,
      nombre,
      moto,
      color,
      ubicacion,
      fechaHora: new Date().toISOString(),
      tipo: 'normal',
      cancel: true,
    }, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) }
    });
  } catch (e) {
    console.log('No se pudo enviar estado normal al backend:', e?.message);
  }
};


// Función para cancelar SOS desde notificación
const cancelarSOSDesdeNotificacion = async () => {
  try {
    // Cancelar SOS
    await AsyncStorage.setItem('sosActivo', 'false');
    await AsyncStorage.setItem('sosEnviado', 'false');
    await AsyncStorage.setItem('sosCancelado', 'true');
    await AsyncStorage.setItem('sosCanceladoTimestamp', Date.now().toString());
    await AsyncStorage.removeItem('sosInicio');
    
    // Enviar notificación de confirmación
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "✅ SOS Cancelado",
        body: "La alerta de emergencia ha sido cancelada",
        data: { type: 'sos_cancelado' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
    
    console.log('SOS cancelado desde notificación');
  } catch (error) {
    console.error('Error cancelando SOS desde notificación:', error);
  }
};

// Función para programar notificaciones periódicas de acceso rápido
export const programarNotificacionesPeriodicas = async () => {
  try {
    // Verificar si ya se programaron las notificaciones
    const notificacionesProgramadas = await AsyncStorage.getItem('notificacionesPeriodicasProgramadas');
    if (notificacionesProgramadas === 'true') {
      console.log('Notificaciones periódicas ya programadas');
      return;
    }
    
    // Enviar notificación de acceso rápido cada 15 minutos cuando la app está en background
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚨 SOS Rápido Disponible",
        body: "La app está lista para enviar alertas de emergencia",
        data: { type: 'sos_quick_actions' },
        sound: false, // Sin sonido para no molestar
        priority: Notifications.AndroidNotificationPriority.LOW,
        categoryIdentifier: 'SOS_CATEGORY',
      },
      trigger: {
        seconds: 1200,
        repeats: true,
      },
    });
    
    await AsyncStorage.setItem('notificacionesPeriodicasProgramadas', 'true');
    console.log('Notificaciones periódicas programadas cada 20 minutos');
  } catch (error) {
    console.error('Error programando notificaciones periódicas:', error);
  }
};

// Función para activar SOS con gesto (simulado)
export const activarSOSConGesto = async (tipoGesto = 'doble_tap') => {
  try {
    let tipoSOS = 'robo'; // Por defecto
    
    // Simular diferentes tipos de gestos
    switch (tipoGesto) {
      case 'doble_tap':
        tipoSOS = 'robo';
        break;
      case 'triple_tap':
        tipoSOS = 'pinchazo';
        break;
      case 'long_press':
        tipoSOS = 'robo';
        break;
      default:
        tipoSOS = 'robo';
    }
    
    await activarSOSDesdeNotificacion(tipoSOS);
    console.log(`SOS ${tipoSOS} activado con gesto: ${tipoGesto}`);
  } catch (error) {
    console.error('Error activando SOS con gesto:', error);
  }
};

// Función para configurar acceso rápido completo
export const configurarAccesoRapido = async () => {
  try {
    await configurarCategoriasNotificaciones();
    await programarNotificacionesPeriodicas();
    console.log('Acceso rápido SOS configurado');
  } catch (error) {
    console.error('Error configurando acceso rápido:', error);
  }
};

// Función para probar SOS directamente desde background
export const probarSOSBackground = async () => {
  try {
    console.log('Probando SOS desde background...');
    
    // Enviar notificación con acciones inmediatamente
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚨 PRUEBA SOS BACKGROUND",
        body: "Toca un botón para activar SOS sin abrir la app",
        data: { type: 'sos_quick_actions' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'SOS_CATEGORY',
      },
      trigger: null, // Enviar inmediatamente
    });
    
    console.log('Notificación de prueba enviada');
  } catch (error) {
    console.error('Error enviando notificación de prueba:', error);
  }
};
