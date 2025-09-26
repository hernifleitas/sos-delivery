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
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState({
    pending: false,
    all: false
  });
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' o 'all'

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadAllUsers = async () => {
    setLoading(prev => ({...prev, all: true}));
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('Token obtenido (all-users):', token ? 'Sí' : 'No');
      
      console.log('Solicitando a la URL:', `${BACKEND_URL}/auth/admin/all-users`);
      
      const response = await axios.get(`${BACKEND_URL}/auth/admin/all-users`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        validateStatus: function (status) {
          // Asegurarse de que axios no lance un error para códigos de estado HTTP 4xx/5xx
          return status >= 200 && status < 500; // Resolver siempre que el código de estado sea menor a 500
        }
      });

      console.log('Respuesta del servidor (all-users):', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      if (response.status === 200 && response.data.success) {
        console.log('Usuarios cargados:', response.data.users?.length || 0);
        setAllUsers(response.data.users || []);
      } else {
        console.error('Error del servidor (all-users):', response.data?.message || 'Error desconocido');
        Alert.alert(
          "Error", 
          response.data?.message || `Error cargando usuarios (${response.status}: ${response.statusText})`
        );
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      if (error.response?.status === 401) {
        Alert.alert("Sesión expirada", "Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
      } else if (error.response?.status === 403) {
        Alert.alert("Acceso denegado", "No tienes permiso para acceder a esta función.");
      } else if (error.code === 'ECONNABORTED') {
        Alert.alert("Error de conexión", "La solicitud está tardando demasiado. Verifica tu conexión a internet e inténtalo de nuevo.");
      } else {
        Alert.alert("Error", `Error de conexión: ${error.message || 'Error desconocido'}`);
      }
    } finally {
      setLoading(prev => ({...prev, all: false}));
    }
  };

  const loadPendingUsers = async () => {
    setLoading(prev => ({...prev, pending: true}));
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
      setLoading(prev => ({...prev, pending: false}));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'pending') {
      await loadPendingUsers();
    } else {
      await loadAllUsers();
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (activeTab === 'all') {
      loadAllUsers();
    }
  }, [activeTab]);

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

  const handleMakePremium = async (userId, userName) => {
    try {
      // Mostrar diálogo para seleccionar días
      Alert.prompt(
        'Hacer Premium',
        `¿Por cuántos días quieres habilitar el plan Premium para ${userName}?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Aceptar',
            onPress: async (days) => {
              const numDays = parseInt(days, 10) || 30; // Por defecto 30 días si no se especifica
              
              if (numDays < 1) {
                Alert.alert('Error', 'El número de días debe ser mayor a 0');
                return;
              }
              
              try {
                const token = await AsyncStorage.getItem('authToken');
                const response = await axios.post(
                  `${BACKEND_URL}/auth/admin/make-premium/${userId}`, 
                  { days: numDays },
                  {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 10000
                  }
                );

                if (response.data.success) {
                  const expirationDate = new Date(response.data.expiresAt);
                  const formattedDate = expirationDate.toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  
                  Alert.alert(
                    "Éxito", 
                    `${userName} ahora es usuario Premium hasta el ${formattedDate}`
                  );
                  loadPendingUsers(); // Recargar la lista de usuarios
                } else {
                  Alert.alert("Error", response.data.message || "Error al hacer Premium al usuario");
                }
              } catch (error) {
                console.error("Error en handleMakePremium:", error);
                Alert.alert(
                  "Error", 
                  error.response?.data?.message || 
                  "Error de conexión. Por favor, verifica tu conexión a internet e inténtalo de nuevo."
                );
              }
            },
          },
        ],
        'plain-text',
        '30', // Valor por defecto
        'number-pad'
      );
    } catch (error) {
      console.error("Error en handleMakePremium:", error);
      Alert.alert(
        "Error", 
        "Ocurrió un error inesperado. Por favor, inténtalo de nuevo."
      );
    }
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
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f0f0',
      borderRadius: 10,
      margin: 15,
      padding: 5,
    },
    tabButton: {
      flex: 1,
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    tabText: {
      color: isDarkMode ? '#888' : '#666',
      fontWeight: '600',
    },
    activeTabText: {
      color: isDarkMode ? '#fff' : '#2c3e50',
      fontWeight: 'bold',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      marginBottom: 10,
      zIndex: 1, // Asegura que esté por encima de otros elementos
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 5,
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
    premiumButton: {
      backgroundColor: "#f39c12",
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 8,
      marginTop: 10,
      width: '100%',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      borderWidth: 1,
      borderColor: '#e67e22',
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
  });

  const renderUserItem = (user) => (
    <View key={user.id} style={dynamicStyles.userCard}>
      <Text style={dynamicStyles.userName}>{user.nombre}</Text>
      <Text style={dynamicStyles.userEmail}>{user.email}</Text>
      <Text style={dynamicStyles.userInfo}>Moto: {user.moto || 'No especificada'}</Text>
      <Text style={dynamicStyles.userInfo}>Estado: {user.estado || 'Activo'}</Text>
      {user.premiumExpires && (
        <Text style={[dynamicStyles.userInfo, {color: '#f39c12'}]}>
          Premium hasta: {formatDate(user.premiumExpires)}
        </Text>
      )}
      <Text style={dynamicStyles.userDate}>
        Registrado: {formatDate(user.created_at)}
      </Text>
      
      <View style={{marginTop: 10}}>
        <View style={dynamicStyles.buttonContainer}>
          <TouchableOpacity
            style={[dynamicStyles.premiumButton, {width: '100%'}]}
            onPress={() => handleMakePremium(user.id, user.nombre)}
          >
            <Text style={[dynamicStyles.buttonText, {fontSize: 15}]}>
              {user.premiumExpires ? '⭐ RENOVAR PREMIUM' : '⭐ HACER PREMIUM'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPendingUserItem = (user) => (
    <View key={user.id} style={dynamicStyles.userCard}>
      <Text style={dynamicStyles.userName}>{user.nombre}</Text>
      <Text style={dynamicStyles.userEmail}>{user.email}</Text>
      <Text style={dynamicStyles.userInfo}>Moto: {user.moto || 'No especificada'}</Text>
      <Text style={dynamicStyles.userDate}>
        Registrado: {formatDate(user.created_at)}
      </Text>
      
      <View style={{marginTop: 10}}>
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
        
        <View style={dynamicStyles.buttonContainer}>
          <TouchableOpacity
            style={[dynamicStyles.premiumButton, {width: '100%'}]}
            onPress={() => handleMakePremium(user.id, user.nombre)}
          >
            <Text style={[dynamicStyles.buttonText, {fontSize: 15}]}>⭐ HACER PREMIUM</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>Panel de Administración</Text>
        <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
          <Text style={dynamicStyles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Pestañas */}
      <View style={dynamicStyles.tabContainer}>
        <TouchableOpacity 
          style={[
            dynamicStyles.tabButton, 
            activeTab === 'pending' && dynamicStyles.activeTab
          ]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[
            dynamicStyles.tabText,
            activeTab === 'pending' && dynamicStyles.activeTabText
          ]}>
            Pendientes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            dynamicStyles.tabButton, 
            activeTab === 'all' && dynamicStyles.activeTab
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[
            dynamicStyles.tabText,
            activeTab === 'all' && dynamicStyles.activeTabText
          ]}>
            Todos los usuarios
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={dynamicStyles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'pending' ? (
          <>
            <Text style={dynamicStyles.title}>👥 Usuarios Pendientes</Text>
            <Text style={dynamicStyles.subtitle}>
              Gestiona las solicitudes de registro de nuevos usuarios
            </Text>

            {loading.pending ? (
              <Text style={dynamicStyles.loadingText}>Cargando usuarios pendientes...</Text>
            ) : pendingUsers.length === 0 ? (
              <View style={dynamicStyles.emptyState}>
                <Text style={dynamicStyles.emptyStateText}>🎉 ¡No hay usuarios pendientes!</Text>
                <Text style={dynamicStyles.emptyStateSubtext}>
                  Todos los usuarios han sido procesados
                </Text>
              </View>
            ) : (
              pendingUsers.map(renderPendingUserItem)
            )}
          </>
        ) : (
          <>
            <Text style={dynamicStyles.title}>👥 Todos los Usuarios</Text>
            <Text style={dynamicStyles.subtitle}>
              Gestiona los usuarios del sistema
            </Text>
            
            {loading.all ? (
              <Text style={dynamicStyles.loadingText}>Cargando usuarios...</Text>
            ) : allUsers.length === 0 ? (
              <View style={dynamicStyles.emptyState}>
                <Text style={dynamicStyles.emptyStateText}>No se encontraron usuarios</Text>
              </View>
            ) : (
              allUsers.map(renderUserItem)
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
