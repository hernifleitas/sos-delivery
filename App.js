// App.js
import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, AppState, useColorScheme, Linking } from "react-native";
import * as Notifications from 'expo-notifications';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { iniciarUbicacionBackground, detenerUbicacionBackground, verificarEstadoTracking } from "./tasks";
import { configurarNotificaciones, manejarCicloVidaApp, enviarNotificacionSOS, activarSOSDesdeNotificacion, limpiarNotificacionesPendientes, verificarConfiguracionNotificaciones } from "./backgroundConfig";
import { configurarAccesoRapido, enviarNotificacionConAcciones, manejarRespuestaNotificacion } from "./quickActions";
import axios from "axios";
import MapRidersRealtime from "./MapRidersRealtime";
import AlertasSOS from "./AlertasSOS";
import SplashScreen from "./SplashScreen";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";
import UserNavbar from "./UserNavbar";
import AdminPanel from "./AdminPanel";
import MainMenu from "./MainMenu";
import PremiumPaywall from "./PremiumPaywall";
import ChatScreen from "./ChatScreen";
import { getBackendURL } from "./config";
import * as Location from 'expo-location';

import { registerForPushNotificationsAsync, sendPushTokenToBackend } from "./services/NotificationsService";
const BACKEND_URL = getBackendURL();


// Pantalla: Olvidé mi contraseña
function ForgotPasswordScreen({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setMessage("");
      const res = await axios.post(`${BACKEND_URL}/auth/request-password-reset`, { email }, { timeout: 12000 });
      if (res.data?.success) {
        setMessage("Te enviamos un email con instrucciones para cambiar tu contraseña.");
      } else {
        setMessage(res.data?.message || "No se pudo enviar el email. Verifica el correo.");
      }
    } catch (e) {
      setMessage("No se pudo enviar el email. Verifica tu conexión o el correo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 80, backgroundColor: '#fff' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={() => onNavigate('login')} style={{ padding: 8, marginRight: 8 }}>
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Olvidé mi contraseña</Text>
      </View>

      <Text style={{ marginBottom: 8, color: '#2c3e50', fontWeight: '600' }}>Email</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#e1e8ed', borderRadius: 10, padding: 12, marginBottom: 12 }}
        placeholder="Ingresá tu email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading || !email}
        style={{ backgroundColor: '#e74c3c', padding: 14, borderRadius: 12, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{loading ? 'Enviando...' : 'Enviar enlace de reseteo'}</Text>
      </TouchableOpacity>

      {!!message && (
        <Text style={{ marginTop: 14, color: '#2c3e50' }}>{message}</Text>
      )}
    </View>
  );
}

// Pantalla: Resetear contraseña con token
function ResetPasswordScreen({ onNavigate, token: initialToken }) {
  const [token, setToken] = useState(initialToken || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    try {
      if (!token || !password || password !== confirm) {
        setMessage("Completá los campos y asegurate que las contraseñas coincidan.");
        return;
      }
      setLoading(true);
      setMessage("");
      const res = await axios.post(`${BACKEND_URL}/auth/reset-password`, { token, newPassword: password }, { timeout: 12000 });
      if (res.data?.success) {
        setMessage("¡Listo! Tu contraseña fue cambiada.");
        setTimeout(() => onNavigate('login'), 1500);
      } else {
        setMessage(res.data?.message || "No se pudo cambiar la contraseña.");
      }
    } catch (e) {
      setMessage("No se pudo cambiar la contraseña. Verificá el enlace o intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 80, backgroundColor: '#fff' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={() => onNavigate('login')} style={{ padding: 8, marginRight: 8 }}>
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Cambiar contraseña</Text>
      </View>

      <Text style={{ marginBottom: 8, color: '#2c3e50', fontWeight: '600' }}>Token</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#e1e8ed', borderRadius: 10, padding: 12, marginBottom: 12 }}
        placeholder="Pega el token si no vino por enlace"
        autoCapitalize="none"
        value={token}
        onChangeText={setToken}
      />

      <Text style={{ marginBottom: 8, color: '#2c3e50', fontWeight: '600' }}>Nueva contraseña</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#e1e8ed', borderRadius: 10, padding: 12, marginBottom: 12 }}
        placeholder="Ingresá tu nueva contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Text style={{ marginBottom: 8, color: '#2c3e50', fontWeight: '600' }}>Confirmar contraseña</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#e1e8ed', borderRadius: 10, padding: 12, marginBottom: 12 }}
        placeholder="Confirmá tu nueva contraseña"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading || !password || !confirm}
        style={{ backgroundColor: '#e74c3c', padding: 14, borderRadius: 12, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{loading ? 'Guardando...' : 'Guardar nueva contraseña'}</Text>
      </TouchableOpacity>

      {!!message && (
        <Text style={{ marginTop: 14, color: '#2c3e50' }}>{message}</Text>
      )}
    </View>
  );
}

export default function App() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Estados de navegación y autenticación
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [user, setUser] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isPremium, setIsPremium] = useState(false); // Se actualiza desde backend (role: 'premium' o 'admin')
  const [isRepartiendo, setIsRepartiendo] = useState(false); // Modo Repartiendo deshabilitado en esquema 'Activo' clásico
  const [showMapMarkers, setShowMapMarkers] = useState(true);
  const [booted, setBooted] = useState(false); // evita "salto" splash→main al rehidratar

  // Estados de la aplicación
  const [sosActivo, setSosActivo] = useState(false);
  const [tipoSOS, setTipoSOS] = useState(""); // "robo" o "accidente"
  const [contador, setContador] = useState(0);
  const [trackingActivo, setTrackingActivo] = useState(false);

  const intervaloSOS = useRef(null); // envíos cada 2 minutos
  const timeoutSOS = useRef(null); // contador de 10 segundos

  useEffect(() => {

    const setupNotifications = async () => {
      try {
        await configurarNotificaciones();
        // Opcional: Verificar si las notificaciones están configuradas
        const configurado = await verificarConfiguracionNotificaciones();
        console.log('Notificaciones configuradas:', configurado);
      } catch (error) {
        console.error('Error configurando notificaciones:', error);
      }
    };
    setupNotifications();
    const cargarDatos = async () => {
      // Limpiar notificaciones pendientes que puedan causar alertas automáticas
      await limpiarNotificacionesPendientes();

      // Configurar notificaciones y acceso rápido
      await configurarNotificaciones();
      await configurarAccesoRapido();

      // Verificar si el usuario está logueado
      const userLoggedIn = await AsyncStorage.getItem("userLoggedIn");
      const userData = await AsyncStorage.getItem("usuario");
      const authToken = await AsyncStorage.getItem("authToken");

      // Mantener sesión si hay datos locales; verificar token en segundo plano
      if (userLoggedIn === "true" && userData) {
        const userInfo = JSON.parse(userData);
        setUser(userInfo);
        const premiumFlag = (userInfo?.role === 'premium' || userInfo?.role === 'admin');
        setIsPremium(premiumFlag);
        setIsLoggedIn(true);
        setCurrentScreen('main');

        if (authToken) {
          (async () => {
            try {
              const response = await axios.get(`${BACKEND_URL}/auth/verify`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
                timeout: 10000
              });
              if (!response.data.success) {
                await AsyncStorage.multiRemove(['userLoggedIn', 'usuario', 'authToken']);
              } else if (response.data?.user) {
                const merged = { ...(userInfo || {}), ...(response.data.user || {}) };
             //   console.log('🔄 Usuario actualizado desde /verify:', merged);
                setUser(merged);
                const premiumNow = (merged?.role === 'premium' || merged?.role === 'admin');
               // console.log('🎯 Actualizando isPremium a:', premiumNow, 'role:', merged?.role);
                setIsPremium(premiumNow);
                try { await AsyncStorage.setItem('usuario', JSON.stringify(merged)); } catch {}
              }
            } catch (error) {
              // Solo cerrar si el token es inválido explícitamente
              if (error?.response?.status === 401) {
                await AsyncStorage.multiRemove(['userLoggedIn', 'usuario', 'authToken']);
              }
            }
          })();
        }
      } else {
        // No forzar navegación a 'splash' aquí para no romper cuando el usuario abre 'login' o 'register' manualmente
      }

      // Cargar estados de SOS y tracking solo si está logueado
      if (userLoggedIn === "true" && userData && authToken) {
        await checkAdminStatus();
        // Modo repartiendo deshabilitado: no cargar estado
        const sos = await AsyncStorage.getItem("sosActivo");
        const tipo = await AsyncStorage.getItem("tipoSOS");
        if (sos === "true") {
          // Guardas anti-activación automática
          const confirmado = await AsyncStorage.getItem('sosConfirmado');
          const inicioStr = await AsyncStorage.getItem('sosInicio');
          const inicio = inicioStr ? parseInt(inicioStr) : 0;
          const ahora = Date.now();
          const dentroDeVentana = inicio && (ahora - inicio) <= (5 * 60 * 1000);
          const tipoValido = tipo === 'robo' || tipo === 'accidente';
          if (confirmado === 'true' && dentroDeVentana && tipoValido) {
            setSosActivo(true);
            setTipoSOS(tipo || 'robo');
            setContador(0);
            // Enviar inmediatamente y programar intervalo sin esperar 10s
            await enviarUbicacionSOS();
            if (!intervaloSOS.current) {
              intervaloSOS.current = setInterval(() => enviarUbicacionSOS(), 2 * 60 * 1000);
            }
          } else {
            // Limpiar flags inconsistentes
            await AsyncStorage.multiRemove(['sosActivo','sosEnviado','contadorActualizaciones']);
            await AsyncStorage.removeItem('sosInicio');
            await AsyncStorage.removeItem('tipoSOS');
            await AsyncStorage.removeItem('sosConfirmado');
          }
        }

        // Verificar estado del tracking
        const estadoTracking = await verificarEstadoTracking();
        setTrackingActivo(estadoTracking.trackingActivo);

        // Iniciar tracking solo si hay SOS activo
        const sosFlag = await AsyncStorage.getItem("sosActivo");
        if (sosFlag === 'true') {
          iniciarUbicacionBackground();
        }
      }
    };
    // Ejecutar carga solo cuando la app ya rehidrató el estado inicial
    if (booted) cargarDatos();
  }, [isLoggedIn, booted]);

  // Manejar cambios de estado de la app
  useEffect(() => {
    const subscription = AppState.addEventListener('change', manejarCicloVidaApp.onAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Manejar notificaciones recibidas cuando la app está en foreground
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📩 Notificación recibida en foreground:', notification);
      // La notificación se mostrará automáticamente gracias a setNotificationHandler
    });

    return () => notificationListener.remove();
  }, []);

  // Manejar respuestas de notificaciones (cuando el usuario toca la notificación)
  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Usuario tocó la notificación:', response);
      const { data } = response.notification.request.content;
      
      // Manejar notificaciones de chat
      if (data.chatId) {
        setChatId(data.chatId);
        loadMessages(data.chatId);
      }
      
      // Manejar notificaciones de SOS
      if (data.tipo === 'robo' || data.tipo === 'accidente') {
        console.log('🚨 Notificación de SOS detectada');
      }
    });
  
    return () => responseListener.remove();
  }, []);

  // Registro de push tokens cuando el usuario inicia sesión
  useEffect(() => {
    (async () => {
      try {
        if (isLoggedIn && user?.id) {
          const token = await registerForPushNotificationsAsync();
          if (token) await sendPushTokenToBackend(token);
        }
      } catch (e) {
       // console.warn('No se pudo registrar push token:', e?.message);
      }
    })();
  }, [isLoggedIn, user?.id]);

  // Deep links: ridersos://reset-password?token=...
  useEffect(() => {
    const handleUrl = (event) => {
      try {
        const url = typeof event === 'string' ? event : event?.url;
        if (!url) return;
        // Aceptar tanto esquema ridersos://reset-password?token=... como URLs web /reset-password
        if (url.includes('reset-password')) {
          const hasQuery = url.includes('?');
          const query = hasQuery ? url.split('?')[1] : '';
          const params = new URLSearchParams(query);
          const token = params.get('token');
          if (token) {
            setResetToken(token);
            setCurrentScreen('reset');
          }
        }
      } catch (e) { }
    };
    const sub = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then((initial) => { if (initial) handleUrl(initial); });
    return () => { try { sub.remove(); } catch (_) { } };
  }, []);

  // Función para activar SOS desde segundo plano
  const activarSOSBackground = async (tipo = 'robo') => {
    try {
      const activado = await activarSOSDesdeNotificacion(tipo);
      if (activado) {
        setSosActivo(true);
        setTipoSOS(tipo);
        setContador(0);
        // Enviar inmediatamente y programar intervalo
        await enviarUbicacionSOS();
        if (!intervaloSOS.current) {
          intervaloSOS.current = setInterval(() => enviarUbicacionSOS(), 2 * 60 * 1000);
        }
        Alert.alert("SOS Activado", `Alerta de ${tipo} activada desde segundo plano`);
      }
    } catch (error) {
     // console.error('Error activando SOS desde background:', error);
      Alert.alert("Error", "No se pudo activar el SOS");
    }
  };

  useEffect(() => {
    let timer;
    if (contador > 0) {
      timer = setTimeout(() => setContador(contador - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [contador]);

  const iniciarIntervaloSOS = async () => {
    await enviarUbicacionSOS(); // primer envío
    if (!intervaloSOS.current) {
      intervaloSOS.current = setInterval(() => enviarUbicacionSOS(), 2 * 60 * 1000);
    }
  };

  // Enviar ubicación al backend para SOS (inicial y actualizaciones)
  const enviarUbicacionSOS = async (esPrimerEnvio = false) => {
    console.log('Iniciando envío de ubicación...');
    try {
        console.log('Solicitando ubicación actual...');
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High
        });
        console.log('Ubicación obtenida:', location.coords);
        
        const { latitude, longitude } = location.coords;
        
        if (latitude === 0 && longitude === 0) {
            console.error('Error: Coordenadas (0,0) no válidas');
            return false;
        }
 
        const riderId = await AsyncStorage.getItem('riderId') || `rider-${Date.now()}`;
        console.log('Datos del usuario:', { riderId });
 
        // Obtener el tipo de SOS actual, si no hay, usar 'repartiendo'
        const tipoSOSAlmacenado = await AsyncStorage.getItem('tipoSOS') || 'repartiendo';
        const sosActivo = await AsyncStorage.getItem('sosActivo') === 'true';
        const tipo = sosActivo ? tipoSOSAlmacenado : 'repartiendo';
        
        // Solo marcar como emergencia si es el primer envío de una alerta SOS
        const esEmergencia = (tipo === 'robo' || tipo === 'accidente') && esPrimerEnvio;
        
        console.log('Tipo de alerta:', { 
            tipoSOSAlmacenado, 
            sosActivo,
            tipo,
            esEmergencia,
            esPrimerEnvio
        });
 
        const payload = {
            riderId,
            nombre: (await AsyncStorage.getItem('nombre')) || 'Usuario',
            moto: (await AsyncStorage.getItem('moto')) || 'No especificado',
            color: ((await AsyncStorage.getItem('color')) || 'No especificado').trim() || 'No especificado',
            ubicacion: { 
                lat: latitude,
                lng: longitude
            },
            fechaHora: new Date().toISOString(), 
            tipo,
            tipoSOSActual: tipoSOSAlmacenado, 
            esActualizacion: !esPrimerEnvio,  // true para actualizaciones
            esEmergencia: esPrimerEnvio && (tipo === 'robo' || tipo === 'accidente')
        };
        const token = await AsyncStorage.getItem('authToken');
        const response = await axios.post(`${BACKEND_URL}/sos` , payload, {
            headers: { 
                'Content-Type': 'application/json', 
                ...(token ? { Authorization: `Bearer ${token}` } : {}) 
            },
            timeout: 15000
        });
 
        console.log('Respuesta del servidor:', response.status, response.data);
        return true;
 
    } catch (error) {
        console.error('Error en enviarUbicacionSOS:', {
            message: error.message,
            response: error.response?.data,
            code: error.code,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                data: error.config?.data
            }
        });
        return false;
    }
};

  // Funciones de navegación
  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
  };

  const handleLoginSuccess = async (userData) => {
    setUser(userData);
    setIsPremium(userData?.role === 'premium' || userData?.role === 'admin');
    setIsLoggedIn(true);
    setCurrentScreen('main');

    // Guardar datos del usuario
    await AsyncStorage.setItem("usuario", JSON.stringify(userData));
    await AsyncStorage.setItem("userLoggedIn", "true");
    // No sobrescribir el token aquí: LoginScreen ya guardó response.data.token correctamente
    // Si viene un token válido en userData.token, opcionalmente actualizarlo sin borrar el anterior
    if (userData?.token) {
      await AsyncStorage.setItem("authToken", userData.token);
    }
    // Persistir campos de rider usados por background/tasks
    if (userData?.nombre) await AsyncStorage.setItem('nombre', userData.nombre);
    if (userData?.moto) await AsyncStorage.setItem('moto', userData.moto);
    if (userData?.color) await AsyncStorage.setItem('color', userData.color);
    if (userData?.id) await AsyncStorage.setItem('userId', String(userData.id));

    // Verificar si es administrador
    await checkAdminStatus();

    // Registrar token de notificaciones push inmediatamente tras login
    try {
      const ptoken = await registerForPushNotificationsAsync();
      if (ptoken) await sendPushTokenToBackend(ptoken);
    } catch (e) {
      //console.warn('No se pudo registrar token push post-login:', e?.message);
    }
  };

  const handleRegisterSuccess = async (userData) => {
    setUser(userData);
    setIsPremium(userData?.role === 'premium' || userData?.role === 'admin');
    setIsLoggedIn(true);
    setCurrentScreen('main');

    // Guardar datos del usuario
    await AsyncStorage.setItem("usuario", JSON.stringify(userData));
    await AsyncStorage.setItem("userLoggedIn", "true");
    if (userData?.token) {
      await AsyncStorage.setItem("authToken", userData.token);
    }
    // Persistir campos de rider para background/tasks
    if (userData?.nombre) await AsyncStorage.setItem('nombre', userData.nombre);
    if (userData?.moto) await AsyncStorage.setItem('moto', userData.moto);
    if (userData?.color) await AsyncStorage.setItem('color', userData.color);
    if (userData?.id) await AsyncStorage.setItem('userId', String(userData.id));

    // Registrar token de notificaciones push inmediatamente tras registro
    try {
      const ptoken = await registerForPushNotificationsAsync();
      if (ptoken) await sendPushTokenToBackend(ptoken);
    } catch (e) {
      //console.warn('No se pudo registrar token push post-registro:', e?.message);
    }
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    if (updatedUser && 'role' in updatedUser) {
      setIsPremium(updatedUser.role === 'premium' || updatedUser.role === 'admin');
    }
    // Sincronizar cambios con AsyncStorage para que tareas usen datos reales
    if (updatedUser?.nombre) AsyncStorage.setItem('nombre', updatedUser.nombre);
    if (updatedUser?.moto) AsyncStorage.setItem('moto', updatedUser.moto);
    if (updatedUser?.color) AsyncStorage.setItem('color', updatedUser.color);
  };

  const handleLogout = async () => {
    setUser(null);
    setIsLoggedIn(false);
    setCurrentScreen('splash');

    // Limpiar datos de SOS
    setSosActivo(false);
    setTipoSOS("");
    setContador(0);

    // Limpiar intervalos
    if (timeoutSOS.current) clearTimeout(timeoutSOS.current);
    if (intervaloSOS.current) clearInterval(intervaloSOS.current);

    // Limpiar datos de AsyncStorage
    await AsyncStorage.multiRemove([
      'userLoggedIn',
      'usuario',
      'authToken',
      'sosActivo',
      'sosInicio',
      'sosEnviado',
      'tipoSOS',
      'contadorActualizaciones',
      'notificacionBackgroundEnviada',
      'notificacionAccesoEnviada'
    ]);

    // Detener tracking
    await detenerUbicacionBackground();
    setTrackingActivo(false);
  };

  const checkAdminStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setIsAdmin(false);
        return;
      }
      
        // Hacemos la petición al endpoint de admin
        const response = await axios.get(`${BACKEND_URL}/auth/admin/pending-users`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });

      // Si obtenemos status 200 y la respuesta tiene datos, es admin
      if (response.status === 200) {
        setIsAdmin(true);
        //console.log("Usuario con rol ADMIN detectado");
      } else {
        setIsAdmin(false);
      }

    } catch (err) {
      // Si da 403 significa que no es admin
      if (err.response?.status === 403) {
        setIsAdmin(false);
       // console.log("Usuario NO es admin (403)");
      } else {
        // Otros errores de red o servidor
        setIsAdmin(false);
        //console.error("Error verificando admin:", err.message);
      }
    }
  };

  const activarSOS = async (tipo) => {
    // Mostrar diálogo de confirmación antes de activar
    Alert.alert(
      `🚨 Confirmar ${tipo.toUpperCase()}`,
      `¿Estás seguro de que quieres activar una alerta de ${tipo}? Se compartirá tu ubicación en tiempo real en el mapa de riders.`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Confirmar Alerta",
          style: "destructive",
          onPress: async () => {
            // Proceder con la activación después de confirmación
            await activarSOSConfirmado(tipo);
          }
        }
      ]
    );
  };

  const activarSOSConfirmado = async (tipo) => {
    if (sosActivo) return;
    
    try {
        // Guardar el estado de la alerta
        await AsyncStorage.setItem('sosActivo', 'true');
        await AsyncStorage.setItem('tipoSOS', tipo);
        await AsyncStorage.setItem('sosInicio', Date.now().toString());
        // Flag crítico para que el background task procese las actualizaciones
        await AsyncStorage.setItem('sosConfirmadoPorUsuario', 'true');
        await AsyncStorage.setItem('sosConfirmadoTimestamp', Date.now().toString());
        setSosActivo(true);
        setTipoSOS(tipo);
        
        // Generar riderId si no existe
        let riderId = await AsyncStorage.getItem('riderId');
        if (!riderId) {
            riderId = `rider-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            await AsyncStorage.setItem('riderId', riderId);
        }

        // Limpiar cualquier intervalo previo
        if (intervaloSOS.current) {
            clearInterval(intervaloSOS.current);
            intervaloSOS.current = null;
        }

        // Enviar ubicación inmediatamente (primer envío con notificación)
        await enviarUbicacionSOS(true);
        
        // Configurar intervalo de 30 segundos para actualizaciones (sin notificación)
        intervaloSOS.current = setInterval(async () => {
            console.log('Enviando actualización de ubicación...');
            await enviarUbicacionSOS(false); // No es el primer envío
        }, 30000); // 30 segundos

        // Asegurar que el seguimiento en segundo plano esté activo
        try { 
            await iniciarUbicacionBackground(); 
        } catch (error) {
            console.error('Error al iniciar seguimiento en segundo plano:', error);
        }

    } catch (error) {
        console.error('Error al activar alerta SOS:', error);
        Alert.alert('Error', 'No se pudo activar la alerta. Intenta nuevamente.');
    }
};
  const cancelarSOS = async () => {
    try {
      console.log('Iniciando cancelación de SOS...');
      
      // Limpiar intervalos y timeouts
      if (timeoutSOS.current) clearTimeout(timeoutSOS.current);
      if (intervaloSOS.current) clearInterval(intervaloSOS.current);
      
      // Actualizar estado local
      setSosActivo(false);
      setTipoSOS("");
      setContador(0);
      
      // Limpiar AsyncStorage
      await AsyncStorage.multiRemove([
        "sosActivo",
        "sosEnviado",
        "tipoSOS",
        "sosInicio"
      ]);
      console.log('Estado local limpiado');
  
      // Obtener datos actualizados
      const BACKEND_URL = getBackendURL();
      const riderId = await AsyncStorage.getItem("riderId") || `rider-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const nombre = await AsyncStorage.getItem("nombre") || "Usuario";
      const moto = await AsyncStorage.getItem("moto") || "No especificado";
      let color = (await AsyncStorage.getItem("color") || "No especificado").trim() || "No especificado";
      const ubicacionString = await AsyncStorage.getItem("ultimaUbicacion");
      const ubicacion = ubicacionString ? JSON.parse(ubicacionString) : { lat: 0, lng: 0 };
  
      console.log('Enviando cancelación al servidor...');
      try {
        const response = await axios.post(
          `${BACKEND_URL}/sos`,
          {
            riderId,
            nombre,
            moto,
            color,
            ubicacion,
            fechaHora: new Date().toISOString(),
            tipo: "normal",
            cancel: true,
          },
          {
            timeout: 10000,
            headers: { 
              "Content-Type": "application/json",
              ...(await AsyncStorage.getItem('authToken') ? 
                { Authorization: `Bearer ${await AsyncStorage.getItem('authToken')}` } : {})
            }
          }
        );
        console.log('Respuesta del servidor:', response.data);
      } catch (err) {
       /// console.error('Error al notificar al servidor:', err.message);
        if (err.response) {
        //  console.error('Detalles del error:', err.response.data);
        }
      }
    } catch (err) {
      console.error('Error en cancelarSOS:', err);
    }
  };

  const handleToggleMapMarkers = async () => {
    try {
      const next = !showMapMarkers;
      setShowMapMarkers(next);

      // Iniciar tracking si se activan marcadores (opcional, si lo querés mantener)
      if (next) {
        try { await iniciarUbicacionBackground(); } catch (e) { }
      }
    } catch (e) {
      console.warn('No se pudo alternar el modo de marcadores del mapa:', e?.message);
    }
  };
  const toggleTracking = async () => {
    if (trackingActivo) {
      await detenerUbicacionBackground();
      setTrackingActivo(false);
      Alert.alert("Tracking Detenido", "El tracking de ubicación ha sido detenido.");
    } else {
      await iniciarUbicacionBackground();
      const estado = await verificarEstadoTracking();
      setTrackingActivo(estado.trackingActivo);
      if (estado.trackingActivo) {
        Alert.alert("Tracking Iniciado", "El tracking de ubicación está activo en segundo plano.");
      }
    }
  };

  const toggleRepartiendo = async () => {
    try {
      if (!isPremium) {
        setShowPremiumPaywall(true);
        Alert.alert('Función Premium', 'El modo Repartiendo está disponible con Premium.');
        return;
      }
      const next = !isRepartiendo;
      setIsRepartiendo(next);
      await AsyncStorage.setItem('repartiendoActivo', next ? 'true' : 'false');

      if (next) {
        // Al activar, asegurar tracking en background para tener ubicación fresca
        await iniciarUbicacionBackground();
        // Opcional: enviar un primer “normal” inmediato
        // (lo normal es dejar que lo mande el task al minuto; si querés inmediato, puedo agregarlo)
      } else {
        // Al desactivar, dejar de enviar “normal”
        // Podés detener el tracking para ahorrar batería, o dejarlo si querés retención de última ubicación
        // await detenerUbicacionBackground();
      }
    } catch (e) {
      console.warn('No se pudo alternar Repartiendo:', e?.message);
    }
  };
  // El estado 'normal' deja de enviarse automáticamente.

  // Rehidratación inicial: restaurar sesión y pantalla antes de renderizar
  useEffect(() => {
    (async () => {
      try {
        const [userLoggedIn, userData, lastScreen] = await Promise.all([
          AsyncStorage.getItem('userLoggedIn'),
          AsyncStorage.getItem('usuario'),
          AsyncStorage.getItem('lastScreen'),
        ]);

        if (userLoggedIn === 'true' && userData) {
          const userInfo = JSON.parse(userData);
          setUser(userInfo);
          setIsLoggedIn(true);
          // Si hay una pantalla previa válida, ir ahí; sino a 'main'
          const next = lastScreen || 'main';
          setCurrentScreen(next);
        } else {
          // Sin sesión: conservar pantalla actual (splash) o 'login'
          setCurrentScreen('splash');
        }
      } catch (_) {
        setCurrentScreen('splash');
      } finally {
        setBooted(true);
      }
    })();
  }, []);

  // Persistir pantalla actual para restaurar al volver del background / recreación
  useEffect(() => {
    AsyncStorage.setItem('lastScreen', currentScreen).catch(() => { });
  }, [currentScreen]);

  // Estilos dinámicos basados en el modo oscuro
  const dynamicStyles = StyleSheet.create({
    container: {
      ...styles.container,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff"
    },
    title: {
      ...styles.title,
      color: isDarkMode ? "#ffffff" : "#2c3e50"
    },
    input: {
      ...styles.input,
      backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
      borderColor: isDarkMode ? "#444444" : "#e1e8ed",
      color: isDarkMode ? "#ffffff" : "#2c3e50"
    },
    trackingStatus: {
      ...styles.trackingStatus,
      backgroundColor: isDarkMode ? "#2d2d2d" : "#f8f9fa"
    },
    trackingText: {
      ...styles.trackingText,
      color: isDarkMode ? "#ffffff" : "#2c3e50"
    }
  });

  // Evitar parpadeo a splash antes de rehidratar
  if (!booted) {
    return null;
  }

  // Renderizar diferentes pantallas
  if (currentScreen === 'splash') {
    return <SplashScreen onNavigate={handleNavigate} />;
  }

  if (currentScreen === 'login') {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} />;
  }

  if (currentScreen === 'register') {
    return <RegisterScreen onRegisterSuccess={handleRegisterSuccess} onNavigate={handleNavigate} />;
  }

  if (currentScreen === 'forgot') {
    return <ForgotPasswordScreen onNavigate={handleNavigate} />;
  }

  if (currentScreen === 'reset') {
    return <ResetPasswordScreen onNavigate={handleNavigate} token={resetToken} />;
  }

  return (
    <View style={dynamicStyles.container}>
      {/* Menú principal (Navbar) */}
      <MainMenu
        visible={showMainMenu}
        onClose={() => setShowMainMenu(false)}
        isAdmin={isAdmin}
        trackingActivo={trackingActivo}
        onQuickNotifications={enviarNotificacionConAcciones}
        onToggleTracking={toggleTracking}
        onOpenAdmin={() => { setShowMainMenu(false); setShowAdminPanel(true); }}
        onOpenChat={() => {
          setShowMainMenu(false);
          //console.log('🔍 DEBUG Chat - isPremium:', isPremium, 'isAdmin:', isAdmin, 'user.role:', user?.role);
          if (!isPremium && !isAdmin) { 
            //console.log('❌ No es premium ni admin, mostrando paywall');
            setShowPremiumPaywall(true); 
          } else { 
            //console.log('✅ Es premium o admin, abriendo chat');
            setShowChat(true); 
          }
        }}
        isRepartiendo={isPremium} 
        onToggleRepartiendo={toggleRepartiendo}
        showMapMarkers={showMapMarkers}
        onToggleMapMarkers={() => setShowMapMarkers(prev => !prev)}
      />

      {/* Paywall Premium */}
      <PremiumPaywall
        visible={showPremiumPaywall}
        onClose={() => setShowPremiumPaywall(false)}
        onSubscribe={async () => {
          try {
            // Obtener el token del usuario
            const token = await AsyncStorage.getItem('authToken');
            
            // Construir URL con el token como parámetro
            const baseUrl = 'https://sos-backend-8cpa.onrender.com/premium';
            const paymentUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
            
            const supported = await Linking.canOpenURL(paymentUrl);
            if (supported) {
              await Linking.openURL(paymentUrl);
              setShowPremiumPaywall(false);
            } else {
              //Alert.alert('Error', 'No se pudo abrir el enlace de pago');
            }
          } catch (error) {
            //console.error('Error abriendo página de pago:', error);
            //Alert.alert('Error', 'No se pudo abrir la página de pago');
          }
        }}
      />

      {/* Panel de administrador - Pantalla completa */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}

      {/* Contenido principal - solo mostrar cuando NO esté el admin panel */}
      {!showAdminPanel && (
        <>
          {/* Chat Premium (base) */}
          <ChatScreen
            visible={showChat}
            onClose={() => setShowChat(false)}
            isPremium={isPremium}
            isAdmin={isAdmin}
            currentUserId={user?.id}
            onUpgrade={async () => {
              try {
                // Obtener el token del usuario
                const token = await AsyncStorage.getItem('authToken');
                
                // Construir URL con el token como parámetro
                const baseUrl = 'https://sos-backend-8cpa.onrender.com/premium/';
                const paymentUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
                
                const supported = await Linking.canOpenURL(paymentUrl);
                if (supported) {
                  await Linking.openURL(paymentUrl);
                  setShowChat(false);
                } else {
                  //Alert.alert('Error', 'No se pudo abrir el enlace de pago');
                }
              } catch (error) {
                //console.error('Error abriendo página de pago:', error);
                //Alert.alert('Error', 'No se pudo abrir la página de pago');
              }
            }}
          />

          {/* Barra superior fija con botones */}
          <View style={styles.topBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.welcomeText}>Hola, {user?.nombre || 'Usuario'}</Text>
              {/* Modo Repartiendo deshabilitado: sin badge */}
            </View>
            <View style={styles.topButtons}>
              {/* Botón único para abrir el menú principal */}
              <TouchableOpacity
                style={[styles.topButton, { backgroundColor: '#8e44ad' }]}
                onPress={() => setShowMainMenu(true)}
              >
                <Text style={styles.topButtonText}>☰</Text>
              </TouchableOpacity>

              {/* Botón de perfil */}
              <TouchableOpacity
                style={[styles.topButton, { backgroundColor: "#34495e" }]}
                onPress={() => {
                  setShowUserMenu(true);
                }}
              >
                <Text style={styles.topButtonText}>👤</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Navbar de usuario */}
          <UserNavbar
            user={user}
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
            visible={showUserMenu}
            onClose={() => setShowUserMenu(false)}
          />

          {/* Estado del SOS (si está activo) */}
          {sosActivo && (
            <View style={styles.sosStatusBar}>
              {contador > 0 ? (
                <Text style={styles.sosStatusText}>
                  Enviando {tipoSOS} en {contador}s
                </Text>
              ) : (
                <Text style={styles.sosStatusText}>{tipoSOS} enviado</Text>
              )}
              <TouchableOpacity style={styles.cancelButton} onPress={cancelarSOS}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.cancelButtonText}>❌</Text>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Botones SOS (si no está activo) */}
          {!sosActivo && (
            <View style={styles.sosButtonsContainer}>
              <TouchableOpacity
                style={[styles.sosButton, { backgroundColor: "#e74c3c" }]}
                onPress={() => activarSOS("robo")}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.sosButtonText}>🚨</Text>
                  <Text style={styles.sosButtonText}>SOS ROBO</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sosButton, { backgroundColor: "#f39c12" }]}
                onPress={() => activarSOS("accidente")}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.sosButtonText}>🚑</Text>
                  <Text style={styles.sosButtonText}>SOS ACCIDENTE</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Mapa en pantalla completa */}
          <View style={styles.mapContainer}>
            <MapRidersRealtime showMarkers={showMapMarkers} />
          </View>

          {/* Panel deslizable de alertas */}
          <AlertasSOS />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a"
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center"
  },
  input: {
    borderWidth: 2,
    borderColor: "#e1e8ed",
    padding: 15,
    marginBottom: 15,
    width: "100%",
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#2c3e50"
  },
  saveButton: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 18
  },
  // Nueva barra superior
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "#e74c3c",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    shadowColor: "#e74c3c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50"
  },
  topButtons: {
    flexDirection: "row",
    gap: 10
  },
  topButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  topButtonText: {
    fontSize: 20,
    color: "white"
  },
  // Barra de estado SOS
  sosStatusBar: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: "rgba(231, 76, 60, 0.95)",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  sosStatusText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold"
  },
  // Botones SOS
  sosButtonsContainer: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 999
  },
  sosButton: {
    flex: 1,
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5
  },
  sosButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold"
  },
  cancelButton: {
    backgroundColor: "#95a5a6",
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cancelButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold"
  },
  // Contenedor del mapa
  mapContainer: {
    flex: 1,
    marginTop: 80 // Espacio para la barra superior
  },
});
