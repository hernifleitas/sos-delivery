// SplashScreen.js
import React, { useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  useColorScheme,
  Animated,
  Easing
} from "react-native";

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onNavigate }) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  React.useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000000",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 30,
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: 60,
    },
    logo: {
      width: 200,
      height: 200,
      marginBottom: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: "#e74c3c",
      textAlign: "center",
      marginBottom: 10,
      textShadowColor: "#e74c3c",
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    },
    subtitle: {
      fontSize: 18,
      color: "#ffffff",
      textAlign: "center",
      marginBottom: 20,
      fontWeight: "600",
    },
    description: {
      fontSize: 16,
      color: "#cccccc",
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 50,
    },
    buttonContainer: {
      width: "100%",
      gap: 15,
    },
    primaryButton: {
      backgroundColor: "#e74c3c",
      paddingVertical: 18,
      paddingHorizontal: 30,
      borderRadius: 25,
      shadowColor: "#e74c3c",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 12,
      borderWidth: 2,
      borderColor: "#c0392b",
    },
    secondaryButton: {
      backgroundColor: "transparent",
      paddingVertical: 18,
      paddingHorizontal: 30,
      borderRadius: 25,
      borderWidth: 3,
      borderColor: "#e74c3c",
    },
    primaryButtonText: {
      color: "#ffffff",
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
    },
    secondaryButtonText: {
      color: "#e74c3c",
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
    },
    featuresContainer: {
      marginTop: 40,
      width: "100%",
    },
    featuresTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#e74c3c",
      textAlign: "center",
      marginBottom: 15,
      textShadowColor: "#e74c3c",
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 5,
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    featureText: {
      fontSize: 14,
      color: "#ffffff",
      marginLeft: 10,
      fontWeight: "500",
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <Animated.View 
        style={[
          dynamicStyles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Image 
          source={require('./assets/inicio.png')} 
          style={dynamicStyles.logo}
          resizeMode="contain"
        />
        <Text style={dynamicStyles.title}>Rider SOS</Text>
        <Text style={dynamicStyles.subtitle}>Seguridad para Repartidores</Text>
        <Text style={dynamicStyles.description}>
          Mantenete seguro mientras trabajás. Alertas SOS en tiempo real, 
          seguimiento de ubicación y notificaciones de emergencia.
        </Text>
      </Animated.View>

      <View style={dynamicStyles.buttonContainer}>
        <TouchableOpacity 
          style={dynamicStyles.primaryButton}
          onPress={() => onNavigate('register')}
          activeOpacity={0.8}
        >
          <Text style={dynamicStyles.primaryButtonText}>🚀 Registrarse</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={dynamicStyles.secondaryButton}
          onPress={() => onNavigate('login')}
          activeOpacity={0.8}
        >
          <Text style={dynamicStyles.secondaryButtonText}>🔑 Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={dynamicStyles.featuresContainer}>
        <Text style={dynamicStyles.featuresTitle}>Características</Text>
        <View style={dynamicStyles.featureItem}>
          <Text>🚨</Text>
          <Text style={dynamicStyles.featureText}>Alertas SOS instantáneas</Text>
        </View>
        <View style={dynamicStyles.featureItem}>
          <Text>📍</Text>
          <Text style={dynamicStyles.featureText}>Seguimiento en tiempo real</Text>
        </View>
        <View style={dynamicStyles.featureItem}>
          <Text>🔔</Text>
          <Text style={dynamicStyles.featureText}>Notificaciones de emergencia</Text>
        </View>
        <View style={dynamicStyles.featureItem}>
          <Text>👥</Text>
          <Text style={dynamicStyles.featureText}>Comunidad de repartidores</Text>
        </View>
      </View>
    </View>
  );
}
