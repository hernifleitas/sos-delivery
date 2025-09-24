// MainMenu.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, useColorScheme } from 'react-native';

export default function MainMenu({
  visible,
  onClose,
  isAdmin = false,
  trackingActivo = false,
  onQuickNotifications,
  onToggleTracking,
  onOpenAdmin,
  onOpenChat,
  isInvisible = false,
  onToggleInvisible
}) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
      alignItems: 'center'
    },
    sheet: {
      width: '100%',
      backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 16,
      paddingBottom: 24,
      borderTopWidth: 1,
      borderColor: isDarkMode ? '#333' : '#eee'
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#fff' : '#2c3e50'
    },
    close: { padding: 6 },
    closeText: { fontSize: 22, color: '#e74c3c', fontWeight: 'bold' },
    option: {
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginVertical: 6,
      backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa',
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#e1e8ed'
    },
    optionText: {
      color: isDarkMode ? '#fff' : '#2c3e50',
      fontSize: 16,
      fontWeight: '600'
    },
    subtitle: {
      color: isDarkMode ? '#ccc' : '#7f8c8d',
      fontSize: 12,
      marginTop: 4
    }
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Menú</Text>
            <TouchableOpacity style={styles.close} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.option} onPress={onQuickNotifications}>
            <Text style={styles.optionText}>🔔 Notificaciones rápidas</Text>
            <Text style={styles.subtitle}>Enviar/mostrar accesos rápidos de SOS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.option} onPress={onToggleTracking}>
            <Text style={styles.optionText}>
              {trackingActivo ? '🛑 Desactivar Seguimiento' : '🟢 Activar Seguimiento'}
            </Text>
            <Text style={styles.subtitle}>
              {trackingActivo ? 'Detener seguimiento de ubicación' : 'Iniciar seguimiento en segundo plano'}
            </Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity style={styles.option} onPress={onOpenAdmin}>
              <Text style={styles.optionText}>🛠️ Verificar Usuarios</Text>
              <Text style={styles.subtitle}>Aprobar o rechazar registros pendientes</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.option} onPress={onOpenChat}>
            <Text style={styles.optionText}>💬 ChatRiders</Text>
            <Text style={styles.subtitle}>Chat global entre riders (Premium)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}