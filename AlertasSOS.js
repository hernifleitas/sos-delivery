import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, useColorScheme, Dimensions, PanResponder, Animated } from "react-native";
import axios from "axios";
import { getBackendURL } from "./config";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HEIGHT = 200; // Altura del panel cuando está colapsado
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.6; // Altura cuando está expandido

const ALERTAS_ENDPOINT = `${getBackendURL()}/alertas`;

export default function AlertasSOS() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const pan = useRef(new Animated.Value(0)).current;
  const currentHeight = useRef(PANEL_HEIGHT);

  const fetchAlertas = async () => {
    try {
      const response = await axios.get(ALERTAS_ENDPOINT, {
        timeout: 10000,
        headers: { "Content-Type": "application/json" }
      });
      if (response.data && Array.isArray(response.data)) {
        setAlertas(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error obteniendo alertas:", error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
    const interval = setInterval(fetchAlertas, 10000);
    return () => clearInterval(interval);
  }, []); 

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset(pan._value);
      },
      onPanResponderMove: (evt, gestureState) => {
        const newHeight = currentHeight.current - gestureState.dy;
        if (newHeight >= PANEL_HEIGHT && newHeight <= EXPANDED_HEIGHT) {
          pan.setValue(-gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        const velocity = gestureState.vy;
        const currentValue = pan._value;
        
        let targetHeight;
        if (velocity > 0.5 || currentValue < -50) {
          // Expandir
          targetHeight = EXPANDED_HEIGHT;
          setIsExpanded(true);
        } else if (velocity < -0.5 || currentValue > 50) {
          // Colapsar
          targetHeight = PANEL_HEIGHT;
          setIsExpanded(false);
        } else {
          // Mantener estado actual
          targetHeight = isExpanded ? EXPANDED_HEIGHT : PANEL_HEIGHT;
        }
        
        currentHeight.current = targetHeight;
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const formatearTiempo = (segundos) => {
    if (segundos < 60) return `${segundos}s`;
    const minutos = Math.floor(segundos / 60);
    return `${minutos}m`;
  };

  const formatearFecha = (fechaHora) => {
    try {
      const fecha = new Date(fechaHora);
      return fecha.toLocaleString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return fechaHora;
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'robo': return '#e74c3c';
      case 'accidente': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const getTipoEmoji = (tipo) => {
    switch (tipo) {
      case 'robo': return '🚨';
      case 'accidente': return '🚑';
      default: return '⚠️';
    }
  };

  const mostrarDetalles = (alerta) => {
    Alert.alert(
      `${getTipoEmoji(alerta.tipo)} Alerta ${alerta.tipo.toUpperCase()}`,
      `Nombre: ${alerta.nombre}\nMoto: ${alerta.moto}\nColor: ${alerta.color}\nUbicación: ${alerta.ubicacion.lat.toFixed(4)}, ${alerta.ubicacion.lng.toFixed(4)}\nHora: ${formatearFecha(alerta.fechaHora)}`,
      [{ text: "OK" }]
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: isExpanded ? EXPANDED_HEIGHT : PANEL_HEIGHT,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5
    },
    handle: {
      width: 50,
      height: 5,
      backgroundColor: isDarkMode ? "#444444" : "#cccccc",
      borderRadius: 3,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 15
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#333333" : "#e1e8ed"
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? "#ffffff" : "#2c3e50"
    },
    badge: {
      backgroundColor: '#e74c3c',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 24,
      alignItems: 'center'
    },
    badgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold'
    },
    content: {
      flex: 1,
      paddingHorizontal: 20
    },
    alertaItem: {
      backgroundColor: isDarkMode ? "#2d2d2d" : "#f8f9fa",
      borderRadius: 12,
      padding: 15,
      marginBottom: 10,
      borderLeftWidth: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2
    },
    alertaHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8
    },
    alertaTipo: {
      fontSize: 16,
      fontWeight: "bold",
      color: isDarkMode ? "#ffffff" : "#2c3e50"
    },
    alertaTiempo: {
      fontSize: 12,
      color: isDarkMode ? "#888888" : "#666666"
    },
    alertaInfo: {
      fontSize: 14,
      color: isDarkMode ? "#cccccc" : "#555555",
      marginBottom: 4
    },
    noAlertas: {
      textAlign: "center",
      fontSize: 16,
      color: isDarkMode ? "#888888" : "#666666",
      fontStyle: "italic",
      marginTop: 40
    },
    loadingText: {
      textAlign: "center",
      fontSize: 16,
      color: isDarkMode ? "#888888" : "#666666",
      marginTop: 40
    }
  });

  return (
    <Animated.View 
      style={[dynamicStyles.container, { transform: [{ translateY: pan }] }]}
      {...panResponder.panHandlers}
    >
      {/* Handle para arrastrar */}
      <View style={dynamicStyles.handle} />
        
        {/* Header */}
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>🚨 Alertas SOS Activas</Text>
          {alertas.length > 0 && (
            <View style={dynamicStyles.badge}>
              <Text style={dynamicStyles.badgeText}>{alertas.length}</Text>
            </View>
          )}
        </View>

        {/* Contenido */}
        <View style={dynamicStyles.content}>
          {loading ? (
            <Text style={dynamicStyles.loadingText}>Cargando alertas...</Text>
          ) : alertas.length === 0 ? (
            <Text style={dynamicStyles.noAlertas}>No hay alertas SOS activas</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {alertas.map((alerta, index) => (
                <TouchableOpacity
                  key={`${alerta.riderId}-${index}`}
                  style={[
                    dynamicStyles.alertaItem,
                    { borderLeftColor: getTipoColor(alerta.tipo) }
                  ]}
                  onPress={() => mostrarDetalles(alerta)}
                >
                  <View style={dynamicStyles.alertaHeader}>
                    <Text style={dynamicStyles.alertaTipo}>
                      {getTipoEmoji(alerta.tipo)} {alerta.tipo.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={dynamicStyles.alertaInfo}>
                    👤 {alerta.nombre}
                  </Text>
                  <Text style={dynamicStyles.alertaInfo}>
                    🏍️ {alerta.moto} ({alerta.color})
                  </Text>
                  <Text style={dynamicStyles.alertaInfo}>
                    ⏰ {formatearFecha(alerta.fechaHora)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
    </Animated.View>
  );
}