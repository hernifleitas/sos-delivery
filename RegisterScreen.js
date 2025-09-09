// RegisterScreen.js
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

export default function RegisterScreen({ onRegisterSuccess, onNavigate }) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [moto, setMoto] = useState("");
  const [color, setColor] = useState("");
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
      marginBottom: 30,
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
    registerButton: {
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
    registerButtonDisabled: {
      backgroundColor: "#95a5a6",
      shadowOpacity: 0,
      elevation: 0,
    },
    registerButtonText: {
      color: "#ffffff",
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
    },
    loginLink: {
      marginTop: 20,
      alignItems: "center",
    },
    loginText: {
      fontSize: 16,
      color: isDarkMode ? "#cccccc" : "#666666",
    },
    loginLinkText: {
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
    passwordRequirements: {
      marginTop: 10,
      padding: 10,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f0f0f0",
      borderRadius: 8,
    },
    requirementText: {
      fontSize: 12,
      color: isDarkMode ? "#cccccc" : "#666666",
      marginBottom: 2,
    },
  });

  const handleRegister = async () => {
    if (!nombre || !email || !password || !confirmPassword || !moto || !color) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Error", "Por favor ingresa un email válido");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/auth/register`, {
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        moto: moto.trim(),
        color: color.trim()
      }, {
        timeout: 15000,
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
          "¡Registro Exitoso!", 
          `¡Bienvenido ${userData.nombre}! Tu cuenta ha sido creada correctamente.`,
          [{ text: "Continuar", onPress: () => onRegisterSuccess(userData) }]
        );
      } else {
        Alert.alert("Error", response.data.message || "Error al registrarse");
      }
    } catch (error) {
      console.error("Error en registro:", error);
      if (error.response?.status === 409) {
        Alert.alert("Error", "Este email ya está registrado");
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
          <Text style={dynamicStyles.title}>🚀 Registrarse</Text>
          <Text style={dynamicStyles.subtitle}>
            Crea tu cuenta para comenzar a usar Rider SOS
          </Text>
        </View>

        <View style={dynamicStyles.formContainer}>
          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Nombre Completo</Text>
            <TextInput
              style={[dynamicStyles.input, nombre ? dynamicStyles.inputFocused : null]}
              placeholder="Tu nombre completo"
              placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
            />
          </View>

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
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <View style={dynamicStyles.passwordRequirements}>
              <Text style={dynamicStyles.requirementText}>
                • Mínimo 6 caracteres
              </Text>
              <Text style={dynamicStyles.requirementText}>
                • Debe coincidir con la confirmación
              </Text>
            </View>
          </View>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Confirmar Contraseña</Text>
            <TextInput
              style={[dynamicStyles.input, confirmPassword ? dynamicStyles.inputFocused : null]}
              placeholder="Repite tu contraseña"
              placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Moto</Text>
            <TextInput
              style={[dynamicStyles.input, moto ? dynamicStyles.inputFocused : null]}
              placeholder="Marca y modelo de tu moto"
              placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
              value={moto}
              onChangeText={setMoto}
              autoCapitalize="words"
            />
          </View>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Color de la Moto</Text>
            <TextInput
              style={[dynamicStyles.input, color ? dynamicStyles.inputFocused : null]}
              placeholder="Color de tu moto"
              placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
              value={color}
              onChangeText={setColor}
              autoCapitalize="words"
            />
          </View>

          <TouchableOpacity
            style={[
              dynamicStyles.registerButton,
              loading ? dynamicStyles.registerButtonDisabled : null
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={dynamicStyles.registerButtonText}>
              {loading ? "Creando cuenta..." : "🚀 Crear Cuenta"}
            </Text>
          </TouchableOpacity>

          {loading && (
            <Text style={dynamicStyles.loadingText}>
              Registrando usuario y enviando email...
            </Text>
          )}

          <View style={dynamicStyles.loginLink}>
            <Text style={dynamicStyles.loginText}>
              ¿Ya tienes una cuenta?
            </Text>
            <TouchableOpacity onPress={() => onNavigate('login')}>
              <Text style={dynamicStyles.loginLinkText}>
                Inicia sesión aquí
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

