// AdminPanel.js - Pantalla completa dedicada para usuarios pendientes
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useColorScheme,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { getBackendURL } from "./config";

const BACKEND_URL = getBackendURL();

export default function AdminPanel({ onClose }) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'all'

  useEffect(() => {
    loadPendingUsers();
    loadAllUsers();
  }, []);

  const loadPendingUsers = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('Token obtenido:', token ? 'Sí' : 'No');

      const response = await axios.get(`${BACKEND_URL}/auth/admin/pending-users`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 10000
      });

      console.log('Respuesta del servidor:', response.data);

      if (response.data.success) {
        setPendingUsers(response.data.users || []);
        console.log('Usuarios pendientes cargados:', response.data.users?.length || 0);
      } else {
        console.log('Error del servidor:', response.data.message);
        Alert.alert("Error", response.data.message || "Error cargando usuarios pendientes");
      }
    } catch (error) {
      console.error("Error cargando usuarios pendientes:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      if (error.response?.status === 401) {
        Alert.alert("Error", "No tienes permisos de administrador");
      } else if (error.response?.status === 403) {
        Alert.alert("Error", "Acceso denegado. Solo administradores pueden acceder a esta función");
      } else {
        Alert.alert("Error", "Error de conexión al cargar usuarios pendientes");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${BACKEND_URL}/auth/admin/all-users`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 10000
      });

      if (response.data.success) {
        setAllUsers(response.data.users || []);
        console.log('Todos los usuarios cargados:', response.data.users?.length || 0);
      } else {
        Alert.alert("Error", response.data.message || "Error cargando usuarios");
      }
    } catch (error) {
      console.error("Error cargando todos los usuarios:", error);
      if (error.response?.status === 403) {
        Alert.alert("Error", "Acceso denegado. Solo administradores pueden acceder");
      } else {
        Alert.alert("Error", "Error de conexión al cargar usuarios");
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingUsers();
    await loadAllUsers();
    setRefreshing(false);
  };

  const handleApproveUser = async (userId, userName) => {
    Alert.alert(
      "Aprobar Usuario",
      `¿Estás seguro de que quieres aprobar a ${userName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprobar",
          style: "default",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await axios.post(
                `${BACKEND_URL}/auth/admin/approve-user/${userId}`,
                {},
                {
                  headers: { 'Authorization': `Bearer ${token}` },
                  timeout: 15000
                }
              );

              if (response.data.success) {
                Alert.alert("Éxito", "Usuario aprobado correctamente");
                loadPendingUsers(); // Recargar lista
              } else {
                Alert.alert("Error", response.data.message || "Error aprobando usuario");
              }
            } catch (error) {
              console.error("Error aprobando usuario:", error);
              Alert.alert("Error", "Error de conexión al aprobar usuario");
            }
          }
        }
      ]
    );
  };

  const handleRejectUser = async (userId, userName) => {
    Alert.alert(
      "Rechazar Usuario",
      `¿Estás seguro de que quieres rechazar a ${userName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rechazar",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await axios.post(
                `${BACKEND_URL}/auth/admin/reject-user/${userId}`,
                {},
                {
                  headers: { 'Authorization': `Bearer ${token}` },
                  timeout: 15000
                }
              );

              if (response.data.success) {
                Alert.alert("Éxito", "Usuario rechazado correctamente");
                loadPendingUsers(); // Recargar lista
              } else {
                Alert.alert("Error", response.data.message || "Error rechazando usuario");
              }
            } catch (error) {
              console.error("Error rechazando usuario:", error);
              Alert.alert("Error", "Error de conexión al rechazar usuario");
            }
          }
        }
      ]
    );
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: isDarkMode ? "#2d2d2d" : "#f8f9fa",
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#444444" : "#e1e8ed",
      marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? "#ffffff" : "#2c3e50",
    },
    backButton: {
      padding: 10,
    },
    backButtonText: {
      fontSize: 18,
      color: "#3498db",
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDarkMode ? "#ffffff" : "#2c3e50",
      marginBottom: 20,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: isDarkMode ? "#cccccc" : "#666666",
      marginBottom: 20,
      textAlign: 'center',
    },
    userCard: {
      backgroundColor: isDarkMode ? "#2d2d2d" : "#f8f9fa",
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: isDarkMode ? "#444444" : "#e1e8ed",
    },
    userName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? "#ffffff" : "#2c3e50",
      marginBottom: 5,
    },
    userEmail: {
      fontSize: 14,
      color: isDarkMode ? "#cccccc" : "#666666",
      marginBottom: 5,
    },
    userTelefono: {
      fontSize: 14,
      color: isDarkMode ? "#cccccc" : "#666666",
      marginBottom: 5,
    },
    userInfo: {
      fontSize: 14,
      color: isDarkMode ? "#cccccc" : "#666666",
      marginBottom: 3,
    },
    userDate: {
      fontSize: 12,
      color: isDarkMode ? "#999999" : "#999999",
      marginBottom: 15,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      width: '100%',
    },
    approveButton: {
      backgroundColor: "#27ae60",
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 8,
      flex: 1,
      marginRight: 5,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    rejectButton: {
      backgroundColor: "#e74c3c",
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 8,
      flex: 1,
      marginLeft: 5,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    buttonText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 50,
    },
    emptyStateText: {
      fontSize: 16,
      color: isDarkMode ? "#cccccc" : "#666666",
      textAlign: 'center',
      marginBottom: 10,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: isDarkMode ? "#999999" : "#999999",
      textAlign: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: isDarkMode ? "#cccccc" : "#666666",
      textAlign: 'center',
      marginTop: 20,
    },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: 20,
      backgroundColor: isDarkMode ? "#2d2d2d" : "#f8f9fa",
      borderRadius: 8,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 6,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: "#3498db",
    },
    inactiveTab: {
      backgroundColor: 'transparent',
    },
    tabText: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    activeTabText: {
      color: "#ffffff",
    },
    inactiveTabText: {
      color: isDarkMode ? "#cccccc" : "#666666",
    },
    adminBadge: {
      backgroundColor: "#9b59b6",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    adminBadgeText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: 'bold',
    },
    userStatus: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    approvedStatus: {
      color: "#27ae60",
    },
    pendingStatus: {
      color: "#f39c12",
    },
    rejectedStatus: {
      color: "#e74c3c",
    },
    premiumButton: {
      backgroundColor: "#9b59b6",
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 8,
      flex: 1,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    premiumBadge: {
      backgroundColor: "#9b59b6",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    premiumBadgeText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: 'bold',
    },
  });

  const renderPendingUserItem = (user) => (
    <View key={user.id} style={dynamicStyles.userCard}>
      <Text style={dynamicStyles.userName}>Nombre: {user.nombre}</Text>
      <Text style={dynamicStyles.userTelefono}>Telefono: {user.telefono}</Text>
      <Text style={dynamicStyles.userEmail}>Email: {user.email}</Text>
      <Text style={dynamicStyles.userInfo}>Moto: {user.moto || 'No especificada'}</Text>
      <Text style={dynamicStyles.userInfo}>Color:  {user.color}</Text>
      <Text style={dynamicStyles.userDate}>
        Registrado: {formatDate(user.created_at)}
      </Text>

      <View style={dynamicStyles.buttonRow}>
        <TouchableOpacity
          style={dynamicStyles.approveButton}
          onPress={() => handleApproveUser(user.id, user.nombre)}
        >
          <Text style={dynamicStyles.buttonText}>✅ Aprobar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={dynamicStyles.rejectButton}
          onPress={() => handleRejectUser(user.id, user.nombre)}
        >
          <Text style={dynamicStyles.buttonText}>❌ Rechazar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleMakePremium = async (userId, userName) => {
  Alert.alert(
    "Activar Premium",
    `¿Activar Premium por 30 días para ${userName}?`,
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Activar Premium",
        style: "default",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await axios.post(
              `${BACKEND_URL}/auth/admin/make-premium/${userId}`,
              { days: 30 },
              {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 15000
              }
            );

            if (response.data.success) {
              Alert.alert("✅ Éxito", `Premium activado para ${userName} por 30 días`);
              // Recargar la lista de usuarios
              await loadAllUsers();
            } else {
              Alert.alert("❌ Error", response.data.message || "Error activando premium");
            }
          } catch (error) {
            console.error("Error activando premium:", error);
            Alert.alert(
              "❌ Error", 
              error.response?.data?.message || "Error de conexión al activar premium"
            );
          }
        }
      }
    ]
  );
};

  const renderAllUserItem = (user) => (
    <View key={user.id} style={dynamicStyles.userCard}>
      {(user.role === 'premium' || user.role === 'admin') && (
        <View style={dynamicStyles.premiumBadge}>
          <Text style={dynamicStyles.premiumBadgeText}>
            {user.role === 'admin' ? '👑 ADMIN' : '⭐ PREMIUM'}
          </Text>
        </View>
      )}
      <Text style={dynamicStyles.userName}>Nombre: {user.nombre}</Text>
      <Text style={dynamicStyles.userTelefono}>Teléfono: {user.telefono}</Text>
      <Text style={dynamicStyles.userEmail}>Email: {user.email}</Text>
      <Text style={dynamicStyles.userInfo}>Moto: {user.moto || 'No especificada'}</Text>
      <Text style={dynamicStyles.userInfo}>Color: {user.color}</Text>
      <Text style={dynamicStyles.userInfo}>Rol: {user.role || 'user'}</Text>
      {user.premium_expires_at && (
        <Text style={dynamicStyles.userInfo}>
          Premium hasta: {formatDate(user.premium_expires_at)}
        </Text>
      )}
      <Text style={dynamicStyles.userDate}>
        Registrado: {formatDate(user.created_at)}
      </Text>

      {user.role !== 'admin' && (
        <View style={dynamicStyles.buttonRow}>
          <TouchableOpacity
            style={dynamicStyles.premiumButton}
            onPress={() => handleMakePremium(user.id, user.nombre)}
          >
            <Text style={dynamicStyles.buttonText}>
              {user.role === 'premium' ? '🔄 Renovar Premium 30d' : '⭐ Hacer Premium 30d'}
            </Text>
          </TouchableOpacity>
          
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>Panel de Administración</Text>
        <TouchableOpacity style={dynamicStyles.backButton} onPress={onClose}>
          <Text style={dynamicStyles.backButtonText}>✖</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={dynamicStyles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={dynamicStyles.tabContainer}>
          <TouchableOpacity
            style={[dynamicStyles.tab, activeTab === 'pending' ? dynamicStyles.activeTab : dynamicStyles.inactiveTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[dynamicStyles.tabText, activeTab === 'pending' ? dynamicStyles.activeTabText : dynamicStyles.inactiveTabText]}>
              Pendientes ({pendingUsers?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[dynamicStyles.tab, activeTab === 'all' ? dynamicStyles.activeTab : dynamicStyles.inactiveTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[dynamicStyles.tabText, activeTab === 'all' ? dynamicStyles.activeTabText : dynamicStyles.inactiveTabText]}>
              Todos ({allUsers?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {loading && <Text style={dynamicStyles.loadingText}>Cargando usuarios...</Text>}

        {activeTab === 'pending' && !loading && (
          pendingUsers.length > 0 ? pendingUsers.map(renderPendingUserItem) :
          <View style={dynamicStyles.emptyState}>
            <Text style={dynamicStyles.emptyStateText}>No hay usuarios pendientes.</Text>
            <Text style={dynamicStyles.emptyStateSubtext}>Actualiza para comprobar nuevamente.</Text>
          </View>
        )}

        {activeTab === 'all' && !loading && (
          allUsers.length > 0 ? allUsers.map(renderAllUserItem) :
          <View style={dynamicStyles.emptyState}>
            <Text style={dynamicStyles.emptyStateText}>No hay usuarios registrados.</Text>
            <Text style={dynamicStyles.emptyStateSubtext}>Actualiza para comprobar nuevamente.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
