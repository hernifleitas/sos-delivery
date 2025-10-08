// LoginScreen.js
import React, { useEffect, useState } from "react";
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
import { getBackendURL } from "./config";

export default function LoginScreen({ onLoginSuccess, onNavigate }) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('remember_email');
        const savedPassword = await AsyncStorage.getItem('remember_password');
        const rememberFlag = await AsyncStorage.getItem('remember_flag');
        if (rememberFlag === 'true') {
          setRemember(true);
          if (savedEmail) setEmail(savedEmail);
          if (savedPassword) setPassword(savedPassword);
        }
      } catch (e) {}
    })();
  }, []);

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
    forgotPasswordContainer: {
      marginTop: 20,
      padding: 20,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? "#444444" : "#e1e8ed",
    },
    forgotPasswordTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? "#ffffff" : "#2c3e50",
      marginBottom: 15,
      textAlign: "center",
    },
    forgotPasswordText: {
      fontSize: 14,
      color: isDarkMode ? "#cccccc" : "#666666",
      marginBottom: 15,
      textAlign: "center",
    },
    resetButton: {
      backgroundColor: "#3498db",
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 10,
    },
    resetButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center",
    },
    resetButtonDisabled: {
      backgroundColor: "#95a5a6",
    },
    resetMessage: {
      fontSize: 14,
      textAlign: "center",
      marginTop: 10,
      padding: 10,
      borderRadius: 8,
      backgroundColor: isDarkMode ? "#2d2d2d" : "#f8f9fa",
    },
    resetMessageSuccess: {
      color: "#27ae60",
    },
    resetMessageError: {
      color: "#e74c3c",
    },
    forgotPasswordLink: {
      marginTop: 15,
      alignItems: "center",
    },
    forgotPasswordLinkText: {
      fontSize: 14,
      color: "#e74c3c",
      textDecorationLine: "underline",
    },
  });

  const BASE_URL = getBackendURL();

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
      const response = await axios.post(`${BASE_URL}/auth/login`, {
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
          email: userData.email,
          role: userData.role || 'user'
        }));
        
        await AsyncStorage.setItem("userLoggedIn", "true");
        await AsyncStorage.setItem("userId", userData.id.toString());
        if (response.data.token) {
          await AsyncStorage.setItem("authToken", response.data.token);
        }

        // Recordar credenciales si está marcado
        if (remember) {
          await AsyncStorage.setItem('remember_flag', 'true');
          await AsyncStorage.setItem('remember_email', email);
          await AsyncStorage.setItem('remember_password', password);
        } else {
          await AsyncStorage.multiRemove(['remember_flag', 'remember_email', 'remember_password']);
        }
        
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
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      if (error.response?.status === 401) {
        const backendMsg = error.response?.data?.message;
        Alert.alert("Error", backendMsg || "Email o contraseña incorrectos");
      } else if (error.response?.status === 404) {
        Alert.alert("Error", "Usuario no encontrado");
      } else if (error.response?.status === 400) {
        Alert.alert("Error", error.response.data?.message || "Datos inválidos");
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        Alert.alert("Error", "Error de conexión. Verifica tu conexion a internet.");
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

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Alert.alert("Error", "Por favor ingresa tu email");
      return;
    }

    if (!isValidEmail(resetEmail)) {
      Alert.alert("Error", "Por favor ingresa un email válido");
      return;
    }

    setResetLoading(true);
    setResetMessage("");

    try {
      const response = await axios.post(`${BASE_URL}/auth/request-password-reset`, {
        email: resetEmail.toLowerCase().trim()
      }, {
        timeout: 10000,
        headers: { "Content-Type": "application/json" }
      });

      if (response.data.success) {
        setResetMessage("Se ha enviado un link a tu email para cambiar la contraseña");
        Alert.alert(
          "Email Enviado", 
          "Revisa tu bandeja de entrada y sigue las instrucciones para cambiar tu contraseña.",
          [{ text: "Entendido", onPress: () => setShowForgotPassword(false) }]
        );
      } else {
        setResetMessage(response.data.message || "Error al enviar el email");
      }
    } catch (error) {
      console.error("Error en reset de contraseña:", error);
      if (error.response?.status === 400) {
        setResetMessage(error.response.data?.message || "Error al enviar el email");
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setResetMessage("Error de conexión. Verifica tu conexion a internet");
      } else {
        setResetMessage("Error de conexión. Verifica tu internet.");
      }
    } finally {
      setResetLoading(false);
    }
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
              placeholder="Ingresá tu email"
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
              placeholder="Ingresá tu contraseña"
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

          {/* Recordar contraseña */}
          <TouchableOpacity
            style={{ marginTop: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' }}
            onPress={() => setRemember(!remember)}
            disabled={loading}
          >
            <Text style={{ fontSize: 18 }}>{remember ? '☑' : '☐'}</Text>
            <Text style={{ marginLeft: 8, color: isDarkMode ? '#ffffff' : '#2c3e50' }}>Recordar credenciales</Text>
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

          {/* Enlace de olvidé mi contraseña */}
          <View style={dynamicStyles.forgotPasswordLink}>
            <TouchableOpacity onPress={() => onNavigate && onNavigate('forgot')}>
              <Text style={dynamicStyles.forgotPasswordLinkText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Formulario de reset de contraseña */}
        {showForgotPassword && (
          <View style={dynamicStyles.forgotPasswordContainer}>
            <Text style={dynamicStyles.forgotPasswordTitle}>
              🔐 Recuperar Contraseña
            </Text>
            <Text style={dynamicStyles.forgotPasswordText}>
              Ingresa tu email y te enviaremos un link para cambiar tu contraseña
            </Text>
            
            <View style={dynamicStyles.inputContainer}>
              <Text style={dynamicStyles.label}>Email</Text>
              <TextInput
                style={[dynamicStyles.input, resetEmail ? dynamicStyles.inputFocused : null]}
                placeholder="Ingresá tu email"
                placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[
                dynamicStyles.resetButton,
                resetLoading ? dynamicStyles.resetButtonDisabled : null
              ]}
              onPress={handleForgotPassword}
              disabled={resetLoading}
            >
              <Text style={dynamicStyles.resetButtonText}>
                {resetLoading ? "Enviando..." : "Enviar Link de Recuperación"}
              </Text>
            </TouchableOpacity>

            {resetMessage ? (
              <Text style={[
                dynamicStyles.resetMessage,
                resetMessage.includes("enviado") ? dynamicStyles.resetMessageSuccess : dynamicStyles.resetMessageError
              ]}>
                {resetMessage}
              </Text>
            ) : null}

            <TouchableOpacity
              style={{ marginTop: 15, alignItems: "center" }}
              onPress={() => {
                setShowForgotPassword(false);
                setResetEmail("");
                setResetMessage("");
              }}
            >
              <Text style={[dynamicStyles.forgotPasswordLinkText, { textDecorationLine: "none" }]}>
                ← Volver al login
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
