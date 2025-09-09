// UserNavbar.js
import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  TextInput, 
  Alert,
  useColorScheme,
  Dimensions
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const { width } = Dimensions.get('window');
const BACKEND_URL = "http://192.168.1.41:10000";

export default function UserNavbar({ 
  user, 
  onLogout, 
  onToggleTracking, 
  trackingActivo, 
  onSendNotification 
}) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const dynamicStyles = StyleSheet.create({
    navbar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 60,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 10,
      zIndex: 1000,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#333333" : "#e1e8ed"
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1
    },
    userInfo: {
      marginLeft: 10
    },
    userName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDarkMode ? "#ffffff" : "#2c3e50"
    },
    userEmail: {
      fontSize: 12,
      color: isDarkMode ? "#cccccc" : "#666666"
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10
    },
    navButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3
    },
    trackingButton: {
      backgroundColor: trackingActivo ? "#e74c3c" : "#27ae60"
    },
    notificationButton: {
      backgroundColor: "#8e44ad"
    },
    menuButton: {
      backgroundColor: isDarkMode ? "#444444" : "#f8f9fa"
    },
    menuText: {
      fontSize: 16,
      color: isDarkMode ? "#ffffff" : "#2c3e50"
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center'
    },
    modalContent: {
      width: width * 0.9,
      maxHeight: '80%',
      backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
      borderRadius: 20,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#444444" : "#e1e8ed"
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? "#ffffff" : "#2c3e50"
    },
    closeButton: {
      padding: 5
    },
    closeButtonText: {
      fontSize: 24,
      color: isDarkMode ? "#ffffff" : "#666666"
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 10,
      borderRadius: 10,
      marginBottom: 5
    },
    menuItemActive: {
      backgroundColor: isDarkMode ? "#444444" : "#f0f0f0"
    },
    menuItemText: {
      fontSize: 16,
      color: isDarkMode ? "#ffffff" : "#2c3e50",
      marginLeft: 15
    },
    // Form styles
    input: {
      borderWidth: 2,
      borderColor: isDarkMode ? "#444444" : "#e1e8ed",
      backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
      color: isDarkMode ? "#ffffff" : "#2c3e50",
      padding: 15,
      borderRadius: 12,
      fontSize: 16,
      marginBottom: 15
    },
    inputFocused: {
      borderColor: "#e74c3c"
    },
    button: {
      backgroundColor: "#e74c3c",
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 10
    },
    buttonDisabled: {
      backgroundColor: "#95a5a6"
    },
    buttonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: 'bold'
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? "#ffffff" : "#2c3e50",
      marginBottom: 8
    }
  });

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.put(`${BACKEND_URL}/auth/change-password`, {
        currentPassword,
        newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data.success) {
        Alert.alert("Éxito", "Contraseña actualizada correctamente");
        setShowChangePassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.error("Error cambiando contraseña:", error);
      if (error.response?.status === 401) {
        Alert.alert("Error", "Contraseña actual incorrecta");
      } else {
        Alert.alert("Error", "Error de conexión");
      }
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      id: 'profile',
      icon: '👤',
      title: 'Mi Perfil',
      action: () => {
        setShowMenu(false);
        setShowProfile(true);
      }
    },
    {
      id: 'password',
      icon: '🔒',
      title: 'Cambiar Contraseña',
      action: () => {
        setShowMenu(false);
        setShowChangePassword(true);
      }
    },
    {
      id: 'logout',
      icon: '🚪',
      title: 'Cerrar Sesión',
      action: () => {
        setShowMenu(false);
        Alert.alert(
          "Cerrar Sesión",
          "¿Estás seguro de que quieres cerrar sesión?",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Cerrar Sesión", style: "destructive", onPress: onLogout }
          ]
        );
      }
    }
  ];

  return (
    <>
      <View style={dynamicStyles.navbar}>
        <View style={dynamicStyles.leftSection}>
          <Text style={{ fontSize: 24 }}>👤</Text>
          <View style={dynamicStyles.userInfo}>
            <Text style={dynamicStyles.userName}>{user?.nombre || 'Usuario'}</Text>
            <Text style={dynamicStyles.userEmail}>{user?.email || ''}</Text>
          </View>
        </View>

        <View style={dynamicStyles.rightSection}>
          <TouchableOpacity 
            style={[dynamicStyles.navButton, dynamicStyles.trackingButton]}
            onPress={onToggleTracking}
          >
            <Text style={dynamicStyles.menuText}>
              {trackingActivo ? "🔴" : "🟢"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[dynamicStyles.navButton, dynamicStyles.notificationButton]}
            onPress={onSendNotification}
          >
            <Text style={dynamicStyles.menuText}>🚨</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[dynamicStyles.navButton, dynamicStyles.menuButton]}
            onPress={() => setShowMenu(true)}
          >
            <Text style={dynamicStyles.menuText}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal del menú */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Menú de Usuario</Text>
              <TouchableOpacity 
                style={dynamicStyles.closeButton}
                onPress={() => setShowMenu(false)}
              >
                <Text style={dynamicStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={dynamicStyles.menuItem}
                  onPress={item.action}
                >
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  <Text style={dynamicStyles.menuItemText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de perfil */}
      <Modal
        visible={showProfile}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfile(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Mi Perfil</Text>
              <TouchableOpacity 
                style={dynamicStyles.closeButton}
                onPress={() => setShowProfile(false)}
              >
                <Text style={dynamicStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              <View style={{ marginBottom: 15 }}>
                <Text style={dynamicStyles.label}>Nombre</Text>
                <Text style={[dynamicStyles.input, { backgroundColor: 'transparent', borderWidth: 0 }]}>
                  {user?.nombre || 'No especificado'}
                </Text>
              </View>
              
              <View style={{ marginBottom: 15 }}>
                <Text style={dynamicStyles.label}>Email</Text>
                <Text style={[dynamicStyles.input, { backgroundColor: 'transparent', borderWidth: 0 }]}>
                  {user?.email || 'No especificado'}
                </Text>
              </View>
              
              <View style={{ marginBottom: 15 }}>
                <Text style={dynamicStyles.label}>Moto</Text>
                <Text style={[dynamicStyles.input, { backgroundColor: 'transparent', borderWidth: 0 }]}>
                  {user?.moto || 'No especificado'}
                </Text>
              </View>
              
              <View style={{ marginBottom: 15 }}>
                <Text style={dynamicStyles.label}>Color</Text>
                <Text style={[dynamicStyles.input, { backgroundColor: 'transparent', borderWidth: 0 }]}>
                  {user?.color || 'No especificado'}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de cambio de contraseña */}
      <Modal
        visible={showChangePassword}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChangePassword(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Cambiar Contraseña</Text>
              <TouchableOpacity 
                style={dynamicStyles.closeButton}
                onPress={() => setShowChangePassword(false)}
              >
                <Text style={dynamicStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              <Text style={dynamicStyles.label}>Contraseña Actual</Text>
              <TextInput
                style={[dynamicStyles.input, currentPassword ? dynamicStyles.inputFocused : null]}
                placeholder="Tu contraseña actual"
                placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              
              <Text style={dynamicStyles.label}>Nueva Contraseña</Text>
              <TextInput
                style={[dynamicStyles.input, newPassword ? dynamicStyles.inputFocused : null]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              
              <Text style={dynamicStyles.label}>Confirmar Nueva Contraseña</Text>
              <TextInput
                style={[dynamicStyles.input, confirmPassword ? dynamicStyles.inputFocused : null]}
                placeholder="Repite la nueva contraseña"
                placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              
              <TouchableOpacity
                style={[
                  dynamicStyles.button,
                  loading ? dynamicStyles.buttonDisabled : null
                ]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                <Text style={dynamicStyles.buttonText}>
                  {loading ? "Cambiando..." : "🔒 Cambiar Contraseña"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

