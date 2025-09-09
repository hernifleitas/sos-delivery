// App.js
import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, AppState, useColorScheme } from "react-native";
import * as Notifications from 'expo-notifications';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { iniciarUbicacionBackground, detenerUbicacionBackground, verificarEstadoTracking } from "./tasks";
import { configurarNotificaciones, manejarCicloVidaApp, enviarNotificacionSOS, activarSOSDesdeNotificacion } from "./backgroundConfig";
import { configurarAccesoRapido, enviarNotificacionConAcciones, manejarRespuestaNotificacion } from "./quickActions";
import axios from "axios";
import MapRidersRealtime from "./MapRidersRealtime";
import AlertasSOS from "./AlertasSOS";
import SplashScreen from "./SplashScreen";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";
import UserNavbar from "./UserNavbar";

export default function App() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // Estados de navegación y autenticación
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Estados de la aplicación
  const [sosActivo, setSosActivo] = useState(false);
  const [tipoSOS, setTipoSOS] = useState(""); // "robo" o "pinchazo"
  const [contador, setContador] = useState(0);
  const [trackingActivo, setTrackingActivo] = useState(false);

  const intervaloSOS = useRef(null); // envíos cada 2 minutos
  const timeoutSOS = useRef(null); // contador de 10 segundos

  useEffect(() => {
    const cargarDatos = async () => {
      // Configurar notificaciones y acceso rápido
      await configurarNotificaciones();
      await configurarAccesoRapido();
      
      // Verificar si el usuario está logueado
      const userLoggedIn = await AsyncStorage.getItem("userLoggedIn");
      const userData = await AsyncStorage.getItem("usuario");
      const authToken = await AsyncStorage.getItem("authToken");
      
      if (userLoggedIn === "true" && userData && authToken) {
        try {
          // Verificar token con el backend
          const response = await axios.get("http://192.168.1.41:10000/auth/verify", {
            headers: { 'Authorization': `Bearer ${authToken}` },
            timeout: 10000
          });
          
          if (response.data.success) {
            const userInfo = JSON.parse(userData);
            setUser(userInfo);
            setIsLoggedIn(true);
            setCurrentScreen('main');
          } else {
            // Token inválido, limpiar datos
            await AsyncStorage.multiRemove(['userLoggedIn', 'usuario', 'authToken']);
            setCurrentScreen('splash');
          }
        } catch (error) {
          console.error('Error verificando token:', error);
          // Error de conexión o token inválido, limpiar datos
          await AsyncStorage.multiRemove(['userLoggedIn', 'usuario', 'authToken']);
          setCurrentScreen('splash');
        }
      } else {
        setCurrentScreen('splash');
      }

      // Cargar estados de SOS y tracking solo si está logueado
      if (isLoggedIn) {
        const sos = await AsyncStorage.getItem("sosActivo");
        const tipo = await AsyncStorage.getItem("tipoSOS");
        if (sos === "true") {
          setSosActivo(true);
          setTipoSOS(tipo || "robo");
          setContador(10);
          timeoutSOS.current = setTimeout(() => iniciarIntervaloSOS(), 10000);
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

  // Función para activar SOS desde segundo plano
  const activarSOSBackground = async (tipo = 'robo') => {
    try {
      const activado = await activarSOSDesdeNotificacion(tipo);
      if (activado) {
        setSosActivo(true);
        setTipoSOS(tipo);
        setContador(10);
        
        // Iniciar el envío automático
        timeoutSOS.current = setTimeout(() => iniciarIntervaloSOS(), 10000);
        
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
    await AsyncStorage.setItem("authToken", userData.token);
  };

  const handleRegisterSuccess = async (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setCurrentScreen('main');
    
    // Guardar datos del usuario
    await AsyncStorage.setItem("usuario", JSON.stringify(userData));
    await AsyncStorage.setItem("userLoggedIn", "true");
    await AsyncStorage.setItem("authToken", userData.token);
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
    
    // Detener tracking
    await detenerUbicacionBackground();
    setTrackingActivo(false);
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const activarSOS = async (tipo) => {
    if(sosActivo) return;
    setTipoSOS(tipo);
    setSosActivo(true);
    setContador(10);

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

    // Timeout de 10s para enviar primer SOS
    timeoutSOS.current = setTimeout(() => iniciarIntervaloSOS(), 10000);
  };

  const cancelarSOS = async () => {
    setSosActivo(false);
    setTipoSOS("");
    setContador(0);

    // Limpiar timeout e intervalos
    if (timeoutSOS.current) clearTimeout(timeoutSOS.current);
    if (intervaloSOS.current) clearInterval(intervaloSOS.current);

    // Marcar como cancelado y enviar estado "normal" por unos minutos
    await AsyncStorage.setItem("sosActivo", "false");
    await AsyncStorage.setItem("sosEnviado", "true");
    await AsyncStorage.setItem("sosCancelado", "true");
    await AsyncStorage.setItem("sosCanceladoTimestamp", Date.now().toString());
    await AsyncStorage.removeItem("sosInicio");

    // Enviar estado "normal" (bandera verde) por unos minutos
    await enviarEstadoNormal();

    Alert.alert("Cancelada", `La alerta de ${tipoSOS} fue cancelada.`);
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

  const enviarEstadoNormal = async () => {
    try {
      const ubicacionString = await AsyncStorage.getItem("ultimaUbicacion");
      let ubicacion = { lat: 0, lng: 0 };
      if (ubicacionString) ubicacion = JSON.parse(ubicacionString);

      const riderId = await AsyncStorage.getItem("riderId");
      const fechaHora = new Date().toISOString();
      const colorFinal = (user?.color || "No especificado").trim();

      await axios.post("http://192.168.1.41:10000/sos", {
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
        headers: { "Content-Type": "application/json" }
      });

      console.log(`Estado normal enviado:`, fechaHora);
    } catch (err) {
      console.error("Error enviando estado normal:", err.message);
    }
  };


  const enviarUbicacionSOS = async () => {
    try {
      const ubicacionString = await AsyncStorage.getItem("ultimaUbicacion");
      let ubicacion = { lat: 0, lng: 0 };
      if (ubicacionString) ubicacion = JSON.parse(ubicacionString);

      const riderId = await AsyncStorage.getItem("riderId");

      const fechaHora = new Date().toISOString();
      const colorFinal = (user?.color || "No especificado").trim();
      const tipo = tipoSOS || (await AsyncStorage.getItem("tipoSOS")) || "robo";

      await axios.post("http://192.168.1.41:10000/sos", {
        riderId,
        nombre: user?.nombre || "Usuario",
        moto: user?.moto || "No especificado",
        color: colorFinal,
        ubicacion: {
          lat: ubicacion.lat ?? 0,
          lng: ubicacion.lng ?? 0
        },
        fechaHora,
        tipo,
      }, {
        timeout: 15000,
        headers: { "Content-Type": "application/json" }
      });

      console.log(`Ubicación enviada (${tipo}):`, fechaHora);
    } catch (err) {
      console.error("Error enviando SOS:", err.message);
      Alert.alert(
        "Error de Conexión", 
        "No se pudo enviar el SOS. Verifica que:\n• El backend esté funcionando\n• Tu conexión a internet\n• La IP 192.168.1.41 sea correcta"
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
      {/* Navbar de usuario */}
      <UserNavbar 
        user={user} 
        onLogout={handleLogout} 
        onUpdateUser={handleUpdateUser}
      />
      
      {/* Barra superior fija con botones */}
      <View style={styles.topBar}>
        <Text style={styles.welcomeText}>Hola, {user?.nombre || 'Usuario'}</Text>
        <View style={styles.topButtons}>
          <TouchableOpacity 
            style={[styles.topButton, { backgroundColor: trackingActivo ? "#e74c3c" : "#27ae60" }]}
            onPress={toggleTracking}
          >
            <Text style={styles.topButtonText}>
              {trackingActivo ? "🔴" : "🟢"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.topButton, { backgroundColor: "#8e44ad" }]}
            onPress={enviarNotificacionConAcciones}
          >
            <Text style={styles.topButtonText}>🚨</Text>
          </TouchableOpacity>
        </View>

      </View>

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
            onPress={() => activarSOS("pinchazo")}
          >
            <Text style={styles.sosButtonText}>🛠️ SOS Pinchazo</Text>
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
    backgroundColor: "rgba(26, 26, 26, 0.95)",
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
    color: "#ffffff"
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
  }
});

