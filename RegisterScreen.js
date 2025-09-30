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
import { getBackendURL } from "./config";

export default function RegisterScreen({ onRegisterSuccess, onNavigate }) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [moto, setMoto] = useState("");
  const [color, setColor] = useState("");
  const [telefono, setTelefono] = useState("");
  const [aceptaUbicacion, setAceptaUbicacion] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
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

    checkboxContainer: {
      flexDirection: "row",      // importante para alinear checkbox y texto
      alignItems: "center",      // mantiene el texto centrado con el checkbox
      marginVertical: 10,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: "#e74c3c",
      borderRadius: 6,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
      backgroundColor: "#ffffff",  // fondo blanco
    },
    checkboxChecked: {
      backgroundColor: "#e74c3c",  // cuando está marcado
    },
    checkboxLabel: {
      flex: 1,                     // que el texto ocupe el resto del espacio
      color: isDarkMode ? "#ffffff" : "#2c3e50",
      fontSize: 14,
    },
    checkmark: {
      color: "#ffffff",
      fontWeight: "bold",
      fontSize: 16,
    },
  });

  const BASE_URL = getBackendURL();

  const handleRegister = async () => {
    if (!nombre || !email || !password || !confirmPassword || !moto || !color || !telefono || !aceptaTerminos || !aceptaUbicacion) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Error", "Por favor ingresa un email válido");
      return;
    }

    const phoneRegex = /^\+?\d{8,15}$/; // acepta + y entre 8 y 15 dígitos
    if (!phoneRegex.test(telefono)) {
      Alert.alert("Error", "Ingresa un número de teléfono válido");
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
      const userData = {
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        moto: moto.trim(),
        color: color.trim(),
        telefono: telefono.trim(),
        aceptaUbicacion: aceptaUbicacion,
        aceptaTerminos: aceptaTerminos,
        versionTerminos: "v1.0 - 28/09/2025"
      };

      console.log('Enviando datos de registro:', userData);

      const response = await axios.post(`${BASE_URL}/auth/register`, userData, {
        timeout: 15000,
        headers: { "Content-Type": "application/json" }
      });

      if (response.data.success) {
        Alert.alert(
          "¡Registro Exitoso!",
          response.data.message,
          [{ text: "Entendido", onPress: () => onNavigate('login') }]
        );
      } else {
        Alert.alert("Error", response.data.message || "Error al registrarse");
      }
    } catch (error) {
      console.error("Error en registro:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      if (error.response?.status === 409) {
        Alert.alert("Error", "Este email ya está registrado");
      } else if (error.response?.status === 400) {
        Alert.alert("Error", error.response.data?.message || "Datos inválidos");
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        Alert.alert("Error", "Error de conexión. Verifica que el backend esté funcionando.");
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


          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Teléfono</Text>
            <TextInput
              style={[dynamicStyles.input, telefono ? dynamicStyles.inputFocused : null]}
              placeholder="+54 11 1234-5678"
              placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Términos y Condiciones</Text>

            <ScrollView
              style={{
                backgroundColor: isDarkMode ? "#2d2d2d" : "#fff3f3",
                borderRadius: 12,
                padding: 15,
                borderWidth: 1,
                borderColor: "#e74c3c",
                marginVertical: 10,
                height: 150,          // altura fija para que se vea como textarea
              }}
              nestedScrollEnabled={true} // permite scroll dentro del scroll principal
            >
              <Text style={{ color: isDarkMode ? "#ffffff" : "#2c3e50", lineHeight: 20 }}>
                Al registrarte y utilizar la aplicación Rider SOS Delivery, aceptas los siguientes términos y condiciones:

                {"\n\n"}1. **Uso de la Aplicación:** La app permite enviar y recibir alertas de emergencia, accidentes o robos entre usuarios registrados (repartidores). Su uso es voluntario y cada usuario es responsable de cómo utiliza la aplicación.

                {"\n\n"}2. **Limitación de Responsabilidad:** Rider SOS Delivery **no garantiza la intervención física ni asistencia directa** ante un robo, accidente o emergencia. Los usuarios comprenden que la app solo facilita la comunicación de alertas y la ubicación GPS, y no sustituye la acción de las autoridades ni de servicios de emergencia oficiales.

                {"\n\n"}3. **Seguridad del Usuario:** La app comparte tu ubicación en tiempo real con otros usuarios para fines de seguridad y coordinación. No nos hacemos responsables por daños, pérdidas o accidentes que ocurran mientras uses la app o mientras te desplaces.

                {"\n\n"}4. **Accidentes y Robo:** Al usar la app, aceptas que **Rider SOS Delivery no tiene obligación de acudir físicamente a tu asistencia**, ni puede garantizar la protección frente a robos, agresiones o accidentes. Cualquier decisión de actuar sobre una alerta queda a criterio de los demás usuarios o autoridades.

                {"\n\n"}5. **Privacidad:** Tu información personal (nombre, email, teléfono, datos de la moto) será utilizada únicamente para el funcionamiento de la app y **no será compartida con terceros** sin tu consentimiento, salvo requerimiento legal.

                {"\n\n"}6. **Permisos de Ubicación:** La app requiere permisos de ubicación GPS para funcionar correctamente. La información de ubicación se almacena temporalmente y se elimina automáticamente después de 24 horas.

                {"\n\n"}7. **Responsabilidad del Usuario:** Cada usuario es responsable de usar la app de manera adecuada, respetando la seguridad propia y de terceros. El uso indebido de alertas falsas, acoso o cualquier comportamiento ilegal puede derivar en la suspensión o eliminación de la cuenta.

                {"\n\n"}8. **Derecho de Admisión:** Rider SOS Delivery se reserva el derecho de **aceptar o rechazar el registro de cualquier usuario** sin necesidad de justificar la decisión. Esto incluye, pero no se limita a, usuarios que puedan representar un riesgo para la seguridad de otros, que proporcionen información falsa o que incumplan estos términos y condiciones.


                {"\n\n"}9 **Actualizaciones:** Rider SOS Delivery puede actualizar estas condiciones y funcionalidades en cualquier momento. Se recomienda revisar periódicamente los términos.

                {"\n\n"}10. **Aceptación:** Al crear tu cuenta y usar la app, confirmas que has leído, entendido y aceptado estos términos y condiciones.{"\n\n"}

                <Text style={{ marginTop: 10, fontSize: 14, color: isDarkMode ? "#ffffff" : "#2c3e50" }}>
                  11. <Text style={{ fontWeight: "bold" }}>Contacto:</Text> Para consultas o solicitud de eliminación de tu cuenta, podés contactar al soporte de Rider SOS Delivery en{" "}
                  <Text style={{ color: "#e74c3c", fontWeight: "bold" }}>soporteridersos@gmail.com</Text>.
                </Text>
                {"\n\n"}⚠️ **IMPORTANTE:** La app **no reemplaza servicios de emergencia oficiales**. Siempre llama a la policía, bomberos o servicios médicos en caso de urgencia.
              </Text>
            </ScrollView>
          </View>


          <View style={dynamicStyles.checkboxContainer}>
            <TouchableOpacity
              style={[
                dynamicStyles.checkbox,
                aceptaUbicacion && dynamicStyles.checkboxChecked
              ]}
              onPress={() => setAceptaUbicacion(!aceptaUbicacion)}
              activeOpacity={0.8}
            >
              {aceptaUbicacion && <Text style={dynamicStyles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={dynamicStyles.checkboxLabel}>
              Confirmo que la app va a compartir mi ubicación en tiempo real con otros riders
            </Text>
          </View>

          <View style={dynamicStyles.checkboxContainer}>
            <TouchableOpacity
              style={[
                dynamicStyles.checkbox,
                aceptaTerminos && dynamicStyles.checkboxChecked
              ]}
              onPress={() => setAceptaTerminos(!aceptaTerminos)}
              activeOpacity={0.8}
            >
              {aceptaTerminos && <Text style={dynamicStyles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={dynamicStyles.checkboxLabel}>
              Acepto los términos y condiciones de la app Rider SOS delivery
            </Text>
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
              Registrando usuario...
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
