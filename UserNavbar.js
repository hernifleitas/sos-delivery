// UserNavbar.js
import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TextInput, 
  Alert, 
  useColorScheme,
  ScrollView,
  Dimensions
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { getBackendURL } from "./config";

const { width } = Dimensions.get('window');
const BACKEND_URL = getBackendURL();

export default function UserNavbar({ user, onLogout, onUpdateUser, visible, onClose }) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados para cambiar contraseña
  const [email, setEmail] = useState("");

  const dynamicStyles = StyleSheet.create({
    navbar: {
      position: 'absolute',
      top: 0,
      right: 0,
      zIndex: 1001,
      paddingTop: 50,
      paddingRight: 20,
    },
    profileButton: {
      backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
      borderRadius: 25,
      paddingHorizontal: 15,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: isDarkMode ? "#444444" : "#e1e8ed",
    },
    profileText: {
      color: isDarkMode ? "#ffffff" : "#2c3e50",
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
      borderRadius: 20,
      padding: 30,
      width: width * 0.95,
      maxHeight: '80%',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#333333" : "#e1e8ed",
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDarkMode ? "#ffffff" : "#2c3e50",
    },
    closeButton: {
      padding: 5,
    },
    closeButtonText: {
      fontSize: 24,
      color: "#e74c3c",
      fontWeight: "bold",
    },
    profileInfo: {
      marginBottom: 20,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#333333" : "#f0f0f0",
    },
    infoLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#cccccc" : "#666666",
    },
    infoValue: {
      fontSize: 16,
      color: isDarkMode ? "#ffffff" : "#2c3e50",
      fontWeight: "500",
    },
    actionButton: {
      backgroundColor: "#e74c3c",
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginVertical: 8,
      shadowColor: "#e74c3c",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    actionButtonSecondary: {
      backgroundColor: isDarkMode ? "#2d2d2d" : "#f8f9fa",
      borderWidth: 1,
      borderColor: "#e74c3c",
    },
    actionButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center",
    },
    actionButtonTextSecondary: {
      color: "#e74c3c",
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#ffffff" : "#2c3e50",
      marginBottom: 8,
    },
    input: {
      borderWidth: 2,
      borderColor: isDarkMode ? "#444444" : "#e1e8ed",
      backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
      color: isDarkMode ? "#ffffff" : "#2c3e50",
      padding: 15,
      borderRadius: 12,
      fontSize: 16,
    },
    inputFocused: {
      borderColor: "#e74c3c",
    },
    logoutButton: {
      backgroundColor: "#e74c3c",
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginTop: 20,
      shadowColor: "#e74c3c",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    logoutButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center",
    },
  });

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Cerrar Sesión", 
          style: "destructive",
          onPress: async () => {
            try {
              // Limpiar datos locales
              await AsyncStorage.multiRemove([
                'userLoggedIn',
                'userId',
                'usuario',
                'riderId',
                'sosActivo',
                'tipoSOS',
                'sosEnviado',
                'sosInicio',
                'ultimaUbicacion',
                'ultimaUbicacionTimestamp'
              ]);
              
              setShowProfile(false);
              onLogout();
            } catch (error) {
              console.error('Error cerrando sesión:', error);
              Alert.alert("Error", "Error al cerrar sesión");
            }
          }
        }
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!email) {
      Alert.alert("Error", "Por favor ingresa tu email");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Error", "Por favor ingresa un email válido");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${BACKEND_URL}/auth/request-password-reset`,
        {
          email: email.toLowerCase().trim()
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.success) {
        Alert.alert(
          "Éxito",
          "Se ha enviado un link a tu email para cambiar la contraseña. Revisa tu bandeja de entrada.",
          [{ text: "OK", onPress: () => {
            setShowChangePassword(false);
            setEmail("");
          }}]
        );
      } else {
        Alert.alert("Error", response.data.message || "Error al enviar link de recuperación");
      }
    } catch (error) {
      console.error('Error enviando link de recuperación:', error);
      if (error.response?.status === 404) {
        Alert.alert("Error", "Email no encontrado en el sistema");
      } else if (error.response?.status === 400) {
        Alert.alert("Error", error.response.data?.message || "Error al enviar link");
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
    <>
      {/* Modal de perfil */}
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>👤 Mi Perfil</Text>
              <TouchableOpacity 
                style={dynamicStyles.closeButton}
                onPress={onClose}
              >
                <Text style={dynamicStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={dynamicStyles.profileInfo}>
                <View style={dynamicStyles.infoRow}>
                  <Text style={dynamicStyles.infoLabel}>Nombre:</Text>
                  <Text style={dynamicStyles.infoValue}>{user?.nombre || 'No especificado'}</Text>
                </View>
                <View style={dynamicStyles.infoRow}>
                  <Text style={dynamicStyles.infoLabel}>Email:</Text>
                  <Text style={dynamicStyles.infoValue}>{user?.email || 'No especificado'}</Text>
                </View>
                <View style={dynamicStyles.infoRow}>
                  <Text style={dynamicStyles.infoLabel}>Moto:</Text>
                  <Text style={dynamicStyles.infoValue}>{user?.moto || 'No especificado'}</Text>
                </View>
                <View style={dynamicStyles.infoRow}>
                  <Text style={dynamicStyles.infoLabel}>Color:</Text>
                  <Text style={dynamicStyles.infoValue}>{user?.color || 'No especificado'}</Text>
                </View>
                <View style={dynamicStyles.infoRow}>
                  <Text style={dynamicStyles.infoLabel}>Miembro desde:</Text>
                  <Text style={dynamicStyles.infoValue}>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'No disponible'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[dynamicStyles.actionButton, dynamicStyles.actionButtonSecondary]}
                onPress={() => {
                  setShowProfile(false);
                  setShowChangePassword(true);
                }}
              >
                <Text style={[dynamicStyles.actionButtonText, dynamicStyles.actionButtonTextSecondary]}>
                  🔐 Cambiar Contraseña
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={dynamicStyles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={dynamicStyles.logoutButtonText}>
                  🚪 Cerrar Sesión
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de cambiar contraseña */}
      <Modal
        visible={showChangePassword}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowChangePassword(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>🔐 Nueva Contraseña</Text>
              <TouchableOpacity 
                style={dynamicStyles.closeButton}
                onPress={() => setShowChangePassword(false)}
              >
                <Text style={dynamicStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={dynamicStyles.inputContainer}>
                <Text style={dynamicStyles.inputLabel}>Email</Text>
                <TextInput
                  style={[dynamicStyles.input, email ? dynamicStyles.inputFocused : null]}
                  placeholder="Ingresa tu email"
                  placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              
              <View style={dynamicStyles.inputContainer}>
                <Text style={[dynamicStyles.inputLabel, { color: "#7f8c8d", fontSize: 14 }]}>
                  Se enviará un link a tu email para cambiar la contraseña
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  dynamicStyles.actionButton,
                  loading ? { backgroundColor: "#95a5a6" } : null
                ]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                <Text style={dynamicStyles.actionButtonText}>
                  {loading ? "Enviando..." : "📧 Enviar Link de Recuperación"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[dynamicStyles.actionButton, dynamicStyles.actionButtonSecondary]}
                onPress={() => setShowChangePassword(false)}
              >
                <Text style={[dynamicStyles.actionButtonText, dynamicStyles.actionButtonTextSecondary]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}