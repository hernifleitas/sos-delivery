// App.js
import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, AppState, useColorScheme } from "react-native";
import * as Notifications from 'expo-notifications';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { iniciarUbicacionBackground, detenerUbicacionBackground, verificarEstadoTracking } from "./tasks";
import { configurarNotificaciones, manejarCicloVidaApp, enviarNotificacionSOS, activarSOSDesdeNotificacion, limpiarNotificacionesPendientes } from "./backgroundConfig";
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
import { registerForPushNotificationsAsync, sendPushTokenToBackend } from "./services/NotificationsService";

const BACKEND_URL = getBackendURL();

export default function App() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // Estados de navegación y autenticación
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isPremium, setIsPremium] = useState(true); // TODO: actualizar desde backend/billing
  const [invisibleMode, setInvisibleMode] = useState(false);
  
  // Estados de la aplicación
  const [sosActivo, setSosActivo] = useState(false);
  const [tipoSOS, setTipoSOS] = useState(""); // "robo" o "accidente"
  const [contador, setContador] = useState(0);
  const [trackingActivo, setTrackingActivo] = useState(false);

  const intervaloSOS = useRef(null); // envíos cada 2 minutos
  const timeoutSOS = useRef(null); // contador de 10 segundos

  useEffect(() => {

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
        // Cargar modo invisible
        try {
          const inv = await AsyncStorage.getItem('invisibleMode');
          setInvisibleMode(inv === 'true');
        } catch (_) {}
        const sos = await AsyncStorage.getItem("sosActivo");
        const tipo = await AsyncStorage.getItem("tipoSOS");
        if (sos === "true") {
          setSosActivo(true);
          setTipoSOS(tipo || "robo");
          setContador(0);
          // Enviar inmediatamente y programar intervalo sin esperar 10s
          await enviarUbicacionSOS();
          if (!intervaloSOS.current) {
            intervaloSOS.current = setInterval(() => enviarUbicacionSOS(), 2 * 60 * 1000);
          }
        }

        // Verificar estado del tracking
        const estadoTracking = await verificarEstadoTracking();
        setTrackingActivo(estadoTracking.trackingActivo);

        // Si no hay SOS activo, enviar estado normal
        const sosActivo = await AsyncStorage.getItem("sosActivo");
        if (sosActivo !== "true") {
          setTimeout(() => {
            enviarEstadoNormal();
          }, 2000);
        }
        
        iniciarUbicacionBackground();
      }
    };
    cargarDatos();
  }, [isLoggedIn]);

  // Manejar cambios de estado de la app
  useEffect(() => {
    const subscription = AppState.addEventListener('change', manejarCicloVidaApp.onAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Manejar respuestas de notificaciones
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(manejarRespuestaNotificacion);
    return () => subscription?.remove();
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
        console.warn('No se pudo registrar push token:', e?.message);
      }
    })();
  }, [isLoggedIn, user?.id]);

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
      console.error('Error activando SOS desde background:', error);
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

  // Funciones de navegación
  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
  };

  const handleLoginSuccess = async (userData) => {
    setUser(userData);
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
    
    // Verificar si es administrador
    await checkAdminStatus();

    // Registrar token de notificaciones push inmediatamente tras login
    try {
      const ptoken = await registerForPushNotificationsAsync();
      if (ptoken) await sendPushTokenToBackend(ptoken);
    } catch (e) {
      console.warn('No se pudo registrar token push post-login:', e?.message);
    }
  };

  const handleRegisterSuccess = async (userData) => {
    setUser(userData);
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

    // Registrar token de notificaciones push inmediatamente tras registro
    try {
      const ptoken = await registerForPushNotificationsAsync();
      if (ptoken) await sendPushTokenToBackend(ptoken);
    } catch (e) {
      console.warn('No se pudo registrar token push post-registro:', e?.message);
    }
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
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
        console.log("Usuario con rol ADMIN detectado");
      } else {
        setIsAdmin(false);
      }
  
    } catch (err) {
      // Si da 403 significa que no es admin
      if (err.response?.status === 403) {
        setIsAdmin(false);
        console.log("Usuario NO es admin (403)");
      } else {
        // Otros errores de red o servidor
        setIsAdmin(false);
        console.error("Error verificando admin:", err.message);
      }
    }
  };
  

  const activarSOS = async (tipo) => {
    if(sosActivo) return;
    setTipoSOS(tipo);
    setSosActivo(true);
    setContador(0);
    // Generar riderId si no existe
    let riderId = await AsyncStorage.getItem("riderId");
    if (!riderId) {
      riderId = `rider-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await AsyncStorage.setItem("riderId", riderId);
    }

    // Guardar todos los datos del usuario
    await AsyncStorage.setItem("sosActivo", "true");
    await AsyncStorage.setItem("sosInicio", Date.now().toString());
    await AsyncStorage.setItem("sosEnviado", "false");
    await AsyncStorage.setItem("nombre", user?.nombre || "Usuario");
    await AsyncStorage.setItem("moto", user?.moto || "No especificado");
    await AsyncStorage.setItem("color", user?.color || "No especificado");
    await AsyncStorage.setItem("tipoSOS", tipo);

    console.log(`SOS ${tipo} activado para ${user?.nombre} (${user?.moto}, ${user?.color}) - RiderID: ${riderId}`);

    // Limpiar cualquier timeout o intervalo previo
    if (timeoutSOS.current) clearTimeout(timeoutSOS.current);
    if (intervaloSOS.current) clearInterval(intervaloSOS.current);

    // Enviar inmediatamente y programar intervalo (sin esperar 10s)
    await enviarUbicacionSOS();
    if (!intervaloSOS.current) {
      intervaloSOS.current = setInterval(() => enviarUbicacionSOS(), 2 * 60 * 1000);
    }
  };

  const cancelarSOS = async () => {
    try {
      // Actualizar UI y flags primero
      setSosActivo(false);
      setTipoSOS("");
      setContador(0);
      await AsyncStorage.setItem("sosActivo", "false");
      await AsyncStorage.setItem("sosEnviado", "false");
      await AsyncStorage.removeItem("tipoSOS");

      // Datos para enviar 'normal'
      const BACKEND_URL = getBackendURL();
      const riderId = (await AsyncStorage.getItem("riderId")) || `rider-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await AsyncStorage.setItem("riderId", riderId);
      const nombre = (await AsyncStorage.getItem("nombre")) || "Usuario";
      const moto = (await AsyncStorage.getItem("moto")) || "No especificado";
      let color = (await AsyncStorage.getItem("color")) || "No especificado";
      color = color.trim() !== "" ? color : "No especificado";
      const ubicacionString = await AsyncStorage.getItem("ultimaUbicacion");
      const ubicacion = ubicacionString ? JSON.parse(ubicacionString) : { lat: 0, lng: 0 };
      const fechaHora = new Date().toISOString();

      // Forzar envío 'normal' (NO aplicar guardas)
      const authToken = await AsyncStorage.getItem('authToken');
      await axios.post(`${BACKEND_URL}/sos`, {
        riderId,
        nombre,
        moto,
        color,
        ubicacion: { lat: ubicacion.lat ?? 0, lng: ubicacion.lng ?? 0 },
        fechaHora,
        tipo: "normal",
        cancel: true,
      }, {
        timeout: 15000,
        headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) }
      });

      console.log('SOS cancelado: estado normal enviado');
    } catch (err) {
      console.error('Error cancelando SOS:', err?.message);
      Alert.alert('Error', 'No se pudo cancelar el SOS. Revisa tu conexión e intenta nuevamente.');
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

  // Alternar Modo Invisible (no envía ubicación al backend desde background)
  const toggleInvisibleMode = async () => {
    try {
      const next = !invisibleMode;
      setInvisibleMode(next);
      await AsyncStorage.setItem('invisibleMode', next ? 'true' : 'false');
      Alert.alert(
        next ? 'Modo Invisible Activado' : 'Modo Invisible Desactivado',
        next ? 'No se enviará tu ubicación al backend mientras esté activo.' : 'Se reanuda el envío de ubicación en segundo plano.'
      );
    } catch (e) {
      console.warn('No se pudo alternar modo invisible:', e?.message);
    }
  };

  const enviarEstadoNormal = async () => {
    try {
      const ubicacionString = await AsyncStorage.getItem("ultimaUbicacion");
      let ubicacion = { lat: 0, lng: 0 };
      if (ubicacionString) ubicacion = JSON.parse(ubicacionString);

      const riderId = await AsyncStorage.getItem("riderId");
      const fechaHora = new Date().toISOString();
      const colorFinal = (user?.color || "No especificado").trim();

      const authToken = await AsyncStorage.getItem('authToken');
      const sosEnviadoFlag = await AsyncStorage.getItem('sosEnviado');
      if (sosEnviadoFlag !== 'true') {
        await axios.post(`${BACKEND_URL}/sos`, {
          riderId,
          nombre: user?.nombre || "Usuario",
          moto: user?.moto || "No especificado",
          color: colorFinal,
          ubicacion: {
            lat: ubicacion.lat ?? 0,
            lng: ubicacion.lng ?? 0
          },
          fechaHora,
          tipo: "normal", // Tipo normal para bandera verde
        }, {
          timeout: 15000,
          headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) }
        });
      } else {
        console.log('Se omite envío tipo normal: hay SOS activo.');
      }
    } catch (err) {
      console.error("Error enviando estado normal:", err.message);
    }
  };


  const enviarUbicacionSOS = async () => {
    try {
      const ubicacionString = await AsyncStorage.getItem("ultimaUbicacion");
      let ubicacion = { lat: 0, lng: 0 };
      if (ubicacionString) ubicacion = JSON.parse(ubicacionString);

      // Respeto de Modo Invisible: no enviar si no hay SOS activo
      const invisible = (await AsyncStorage.getItem('invisibleMode')) === 'true';
      const sosActivoFlag = (await AsyncStorage.getItem('sosActivo')) === 'true';
      if (invisible && !sosActivoFlag) {
        console.log('Modo Invisible activo (foreground): no se envía ubicación (sin SOS).');
        return;
      }

      // Usar el tipo SOS real guardado como fuente de verdad
      const tipoSOSGuardado = (await AsyncStorage.getItem("tipoSOS")) || tipoSOS || "normal";

      const riderId = await AsyncStorage.getItem("riderId");
      const fechaHora = new Date().toISOString();
      const colorFinal = (user?.color || "No especificado").trim();

      const authToken = await AsyncStorage.getItem('authToken');
      await axios.post(`${BACKEND_URL}/sos`, {
        riderId,
        nombre: user?.nombre || "Usuario",
        moto: user?.moto || "No especificado",
        color: colorFinal,
        ubicacion,
        fechaHora,
        // Enviar SIEMPRE el tipo SOS real en cada actualización
        tipo: tipoSOSGuardado,
        tipoSOSActual: tipoSOSGuardado,
      }, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      console.log(`Ubicación enviada (${tipoSOSGuardado}):`, fechaHora);
    } catch (err) {
      console.error("Error enviando SOS:", err.message);
      Alert.alert(
        "Error de Conexión", 
        "No se pudo enviar el SOS. Verifica que:\n• El backend esté funcionando\n• Tu conexión a internet\n• La IP sea correcta"
      );
    }
  };

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
        isInvisible={invisibleMode}
        onToggleInvisible={toggleInvisibleMode}
        onOpenAdmin={() => {
          setShowMainMenu(false);
          setShowAdminPanel(true);
        }}
        onOpenChat={() => {
          setShowMainMenu(false);
          if (isPremium) {
            setShowChat(true);
          } else {
            setShowPremiumPaywall(true);
          }
        }}
      />

      {/* Paywall Premium */}
      <PremiumPaywall
        visible={showPremiumPaywall}
        onClose={() => setShowPremiumPaywall(false)}
        onSubscribe={() => {
          setShowPremiumPaywall(false);
          // TODO: abrir flujo de suscripción (Stripe/IAP)
          Alert.alert('Próximamente', 'El flujo de suscripción Premium estará disponible pronto.');
        }}
      />

      {/* Chat Premium (base) */}
      <ChatScreen
        visible={showChat}
        onClose={() => setShowChat(false)}
        isPremium={isPremium}
        isAdmin={isAdmin}
        currentUserId={user?.id}
        onUpgrade={() => {
          setShowChat(false);
          setShowPremiumPaywall(true);
        }}
      />

      {/* Barra superior fija con botones */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.welcomeText}>Hola, {user?.nombre || 'Usuario'}</Text>
          {invisibleMode && (
            <View style={styles.invisibleBadge}>
              <Text style={styles.invisibleBadgeText}>👻 Invisible</Text>
            </View>
          )}
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

      {/* Panel de administrador */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}

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
            <Text style={styles.cancelButtonText}>❌ Cancelar</Text>
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
            <Text style={styles.sosButtonText}>🚨 SOS Robo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sosButton, { backgroundColor: "#f39c12" }]}
            onPress={() => activarSOS("accidente")}
          >
            <Text style={styles.sosButtonText}>🚑 SOS Accidente</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Mapa en pantalla completa */}
      <View style={styles.mapContainer}>
        <MapRidersRealtime />
      </View>
      
      {/* Panel deslizable de alertas */}
      <AlertasSOS />
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
  invisibleBadge: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  invisibleBadgeText: {
    color: '#ecf0f1',
    fontSize: 12,
    fontWeight: '600'
  },
});
