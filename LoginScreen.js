// LoginScreen.js
import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BACKEND_URL = "http://192.168.1.41:10000";

export default function LoginScreen({ onLoginSuccess, onNavigate }) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 30,
      paddingVertical: 50,
    },
    header: {
      alignItems: "center",
      marginBottom: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: isDarkMode ? "#ffffff" : "#2c3e50",
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: isDarkMode ? "#cccccc" : "#666666",
      textAlign: "center",
    },
    formContainer: {
      backgroundColor: isDarkMode ? "#2d2d2d" : "#f8f9fa",
      borderRadius: 20,
      padding: 30,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#ffffff" : "#2c3e50",
      marginBottom: 8,
    },
    input: {
      borderWidth: 2,
      borderColor: isDarkMode ? "#444444" : "#e1e8ed",
      backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
      color: isDarkMode ? "#ffffff" : "#2c3e50",
      padding: 15,
      borderRadius: 12,
      fontSize: 16,
    },
    inputFocused: {
      borderColor: "#e74c3c",
    },
    loginButton: {
      backgroundColor: "#e74c3c",
      paddingVertical: 18,
      borderRadius: 12,
      marginTop: 10,
      shadowColor: "#e74c3c",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    loginButtonDisabled: {
      backgroundColor: "#95a5a6",
      shadowOpacity: 0,
      elevation: 0,
    },
    loginButtonText: {
      color: "#ffffff",
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
    },
    registerLink: {
      marginTop: 20,
      alignItems: "center",
    },
    registerText: {
      fontSize: 16,
      color: isDarkMode ? "#cccccc" : "#666666",
    },
    registerLinkText: {
      fontSize: 16,
      color: "#e74c3c",
      fontWeight: "bold",
      marginTop: 5,
    },
    backButton: {
      position: "absolute",
      top: 50,
      left: 20,
      padding: 10,
    },
    backButtonText: {
      fontSize: 18,
      color: "#e74c3c",
      fontWeight: "bold",
    },
    loadingText: {
      color: "#ffffff",
      fontSize: 16,
      textAlign: "center",
      marginTop: 10,
    },
  });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Error", "Por favor ingresa un email válido");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/auth/login`, {
        email: email.toLowerCase().trim(),
        password: password
      }, {
        timeout: 10000,
        headers: { "Content-Type": "application/json" }
      });

      if (response.data.success) {
        const userData = response.data.user;
        
        // Guardar datos del usuario en AsyncStorage
        await AsyncStorage.setItem("usuario", JSON.stringify({
          nombre: userData.nombre,
          moto: userData.moto,
          color: userData.color,
          email: userData.email
        }));
        
        await AsyncStorage.setItem("userLoggedIn", "true");
        await AsyncStorage.setItem("userId", userData.id.toString());
        
        Alert.alert(
          "¡Bienvenido!", 
          `Hola ${userData.nombre}, has iniciado sesión correctamente.`,
          [{ text: "Continuar", onPress: () => onLoginSuccess(userData) }]
        );
      } else {
        Alert.alert("Error", response.data.message || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error("Error en login:", error);
      if (error.response?.status === 401) {
        Alert.alert("Error", "Email o contraseña incorrectos");
      } else if (error.response?.status === 404) {
        Alert.alert("Error", "Usuario no encontrado");
      } else {
        Alert.alert("Error", "Error de conexión. Verifica tu internet.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <KeyboardAvoidingView 
      style={dynamicStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={dynamicStyles.scrollContainer}>
        <TouchableOpacity 
          style={dynamicStyles.backButton}
          onPress={() => onNavigate('splash')}
        >
          <Text style={dynamicStyles.backButtonText}>← Volver</Text>
        </TouchableOpacity>

        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>🔑 Iniciar Sesión</Text>
          <Text style={dynamicStyles.subtitle}>
            Ingresa tus datos para acceder a tu cuenta
          </Text>
        </View>

        <View style={dynamicStyles.formContainer}>
          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Email</Text>
            <TextInput
              style={[dynamicStyles.input, email ? dynamicStyles.inputFocused : null]}
              placeholder="tu@email.com"
              placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Contraseña</Text>
            <TextInput
              style={[dynamicStyles.input, password ? dynamicStyles.inputFocused : null]}
              placeholder="Tu contraseña"
              placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[
              dynamicStyles.loginButton,
              loading ? dynamicStyles.loginButtonDisabled : null
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={dynamicStyles.loginButtonText}>
              {loading ? "Iniciando sesión..." : "🚀 Iniciar Sesión"}
            </Text>
          </TouchableOpacity>

          {loading && (
            <Text style={dynamicStyles.loadingText}>
              Verificando credenciales...
            </Text>
          )}

          <View style={dynamicStyles.registerLink}>
            <Text style={dynamicStyles.registerText}>
              ¿No tienes una cuenta?
            </Text>
            <TouchableOpacity onPress={() => onNavigate('register')}>
              <Text style={dynamicStyles.registerLinkText}>
                Regístrate aquí
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

