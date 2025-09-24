// AdminPanel.js
import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  useColorScheme,
  ScrollView,
  RefreshControl
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { getBackendURL } from "./config";

const BACKEND_URL = getBackendURL();

export default function AdminPanel({ onClose }) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPendingUsers();
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingUsers();
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
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
      zIndex: 1000,
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
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? "#ffffff" : "#2c3e50",
    },
    closeButton: {
      padding: 10,
    },
    closeButtonText: {
      fontSize: 18,
      color: "#e74c3c",
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
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    approveButton: {
      backgroundColor: "#27ae60",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      flex: 1,
      marginRight: 5,
    },
    rejectButton: {
      backgroundColor: "#e74c3c",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      flex: 1,
      marginLeft: 5,
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
  });

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>Panel de Administración</Text>
        <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
          <Text style={dynamicStyles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={dynamicStyles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={dynamicStyles.title}>👥 Usuarios Pendientes</Text>
        <Text style={dynamicStyles.subtitle}>
          Gestiona las solicitudes de registro de nuevos usuarios
        </Text>

        {loading ? (
          <Text style={dynamicStyles.loadingText}>Cargando usuarios pendientes...</Text>
        ) : pendingUsers.length === 0 ? (
          <View style={dynamicStyles.emptyState}>
            <Text style={dynamicStyles.emptyStateText}>🎉 ¡No hay usuarios pendientes!</Text>
            <Text style={dynamicStyles.emptyStateSubtext}>
              Todos los usuarios han sido procesados
            </Text>
          </View>
        ) : (
          pendingUsers.map((user) => (
            <View key={user.id} style={dynamicStyles.userCard}>
              <Text style={dynamicStyles.userName}>{user.nombre}</Text>
              <Text style={dynamicStyles.userEmail}>{user.email}</Text>
              <Text style={dynamicStyles.userInfo}>Moto: {user.moto}</Text>
              <Text style={dynamicStyles.userInfo}>Color: {user.color}</Text>
              <Text style={dynamicStyles.userDate}>
                Registrado: {formatDate(user.created_at)}
              </Text>
              
              <View style={dynamicStyles.buttonContainer}>
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
          ))
        )}
      </ScrollView>
    </View>
  );
}
