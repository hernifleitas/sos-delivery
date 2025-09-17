// PremiumPaywall.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, useColorScheme } from 'react-native';

export default function PremiumPaywall({ visible, onClose, onSubscribe }) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    card: {
      width: '90%',
      backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333' : '#eee'
    },
    title: { fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#2c3e50', marginBottom: 8 },
    subtitle: { color: isDarkMode ? '#ccc' : '#7f8c8d', marginBottom: 16 },
    feature: { color: isDarkMode ? '#fff' : '#2c3e50', marginVertical: 4 },
    buttons: { flexDirection: 'row', marginTop: 16 },
    btn: { flex: 1, padding: 14, borderRadius: 12, marginHorizontal: 6, alignItems: 'center' },
    btnPrimary: { backgroundColor: '#e74c3c' },
    btnSecondary: { backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f0f0' },
    btnTextPrimary: { color: '#fff', fontWeight: 'bold' },
    btnTextSecondary: { color: isDarkMode ? '#fff' : '#2c3e50', fontWeight: 'bold' }
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Versión Premium</Text>
          <Text style={styles.subtitle}>Accedé al chat de riders y a futuras funciones exclusivas.</Text>
          <Text style={styles.feature}>• ChatRiders en tiempo real</Text>
          <Text style={styles.feature}>• Próximamente: canales por zona y mensajes privados</Text>
          <Text style={styles.feature}>• Soporte prioritario</Text>

          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onClose}>
              <Text style={styles.btnTextSecondary}>Más tarde</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onSubscribe}>
              <Text style={styles.btnTextPrimary}>Mejorar a Premium</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
