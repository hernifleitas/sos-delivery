// ChatScreen.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, StyleSheet, FlatList, TextInput, TouchableOpacity, useColorScheme, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import ChatService from './services/ChatService';

export default function ChatScreen({ visible, onClose, isPremium = false, isAdmin = false, currentUserId, onUpgrade }) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);
  const [kbVisible, setKbVisible] = useState(false);

  // Utilidad: fusionar mensajes por id, evitando duplicados y manteniendo orden DESC por created_at
  const mergeUniqueById = (base = [], incoming = []) => {
    const map = new Map();
    [...base, ...incoming].forEach((m) => {
      if (!m || (!m.id && !m.created_at)) return; // proteger entradas inválidas
      const key = m.id ?? `${m.user_id || 'u'}-${m.created_at || Date.now()}`;
      // preferir el mensaje más nuevo si hay conflicto
      const prev = map.get(key);
      if (!prev) {
        map.set(key, m);
      } else {
        const prevTs = new Date(prev.created_at || 0).getTime();
        const curTs = new Date(m.created_at || 0).getTime();
        map.set(key, curTs >= prevTs ? { ...prev, ...m } : prev);
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  useEffect(() => {
    if (!visible) return;

    let mounted = true;
    const init = async () => {
      try {
        setLoading(true);
        // Conectar socket
        await ChatService.connect();
        // Historial inicial
        const hist = await ChatService.fetchHistory({ room: 'global', limit: 50 });
        if (mounted && hist?.success) {
          const uniqueOrdered = mergeUniqueById([], hist.messages || []);
          setMessages(uniqueOrdered);
        }
        // Suscripciones
        ChatService.on('message:new', handleIncoming);
        ChatService.on('message:deleted', handleDeleted);
      } catch (e) {
        console.warn('Error iniciando chat:', e?.message);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      ChatService.off('message:new', handleIncoming);
      ChatService.off('message:deleted', handleDeleted);
    };
  }, [visible]);

  // Listeners de teclado (Android: para evitar espacios residuales con adjustPan)
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKbVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKbVisible(false));
    return () => { try { showSub.remove(); hideSub.remove(); } catch (_) {} };
  }, []);

  const handleIncoming = (msg) => {
    if (!msg) return;
    setMessages((prev) => {
      // Evitar duplicados (a veces llegan por socket y por fetch/paginación)
      const merged = mergeUniqueById(prev, [msg]);
      return merged;
    });
  };

  const handleDeleted = ({ id }) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, content: "Un administrador eliminó este mensaje", deleted: true } : m
      )
    );
  };

  const send = async () => {
    const content = message.trim();
    if (!isPremium && !isAdmin) {
      onUpgrade?.();
      return;
    }
    if (!content) return;
    setMessage('');
    const ack = await ChatService.sendMessage(content, 'global');
    if (!ack?.success) {
      Alert.alert('Error', ack?.message || 'No se pudo enviar el mensaje');
    }
  };

  const onLongPressMessage = (item) => {
    if (!isAdmin) return;
    Alert.alert(
      'Eliminar mensaje',
      `¿Querés marcar este mensaje de ${item?.nombre} como eliminado?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            // Usar deleteMessage del servicio (no existe editMessage)
            const ack = await ChatService.deleteMessage(item.id);
            if (!ack?.success) {
              Alert.alert('Error', ack?.message || 'No se pudo editar el mensaje');
            } else {
              // Actualizamos localmente
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === item.id ? { ...m, content: "Un administrador eliminó este mensaje", deleted: true } : m
                )
              );
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: isDarkMode ? '#0e0e0e' : '#f6f7f8' },
    header: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#222' : '#eaeaea',
      backgroundColor: isDarkMode ? '#121212' : '#ffffff'
    },
    title: { fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#2c3e50' },
    close: { padding: 8 },
    closeText: { fontSize: 18, color: '#e74c3c', fontWeight: 'bold' },

    list: { flex: 1 },
    msgRow: { paddingHorizontal: 12, paddingVertical: 8, marginVertical: 2 },
    msgBubble: {
      borderRadius: 12,
      padding: 10,
      maxWidth: '85%'
    },
    ownBubble: {
      alignSelf: 'flex-end',
      backgroundColor: '#e74c3c'
    },
    otherBubble: {
      alignSelf: 'flex-start',
      backgroundColor: isDarkMode ? '#2b2b2b' : '#ecf0f1'
    },
    deletedBubble: {
      backgroundColor: isDarkMode ? '#1f1f1f' : '#f0f0f0',
      alignSelf: 'center'
    },
    msgHeader: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 2 },
    meta: { fontSize: 12, color: isDarkMode ? '#ddd' : '#2c3e50', marginRight: 6 },
    metaOther: { color: isDarkMode ? '#aaa' : '#7f8c8d' },
    msgText: { fontSize: 15, color: '#ffffff' },
    msgTextOther: { color: isDarkMode ? '#fff' : '#2c3e50' },
    deletedText: {
      fontSize: 13,
      fontStyle: 'italic',
      color: isDarkMode ? '#b0b0b0' : '#7f8c8d',
      textAlign: 'center',
      letterSpacing: 0.3
    },

    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: Platform.OS === 'android' ? 16 : 12,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#222' : '#eaeaea',
      backgroundColor: isDarkMode ? '#121212' : '#ffffff'
    },
    input: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333' : '#dcdde1',
      backgroundColor: isDarkMode ? '#1d1d1d' : '#fff',
      color: isDarkMode ? '#fff' : '#2c3e50',
      borderRadius: 10,
      paddingHorizontal: 12,
      marginRight: 8
    },
    sendBtn: { backgroundColor: '#e74c3c', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
    sendText: { color: '#fff', fontWeight: 'bold' },

    premiumOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center'
    },
    premiumCard: {
      width: '88%',
      backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333' : '#eee'
    },
    premiumTitle: { fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#2c3e50', marginBottom: 6 },
    premiumText: { color: isDarkMode ? '#ccc' : '#7f8c8d' },
    premiumBtn: { marginTop: 14, backgroundColor: '#e74c3c', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    premiumBtnText: { color: '#fff', fontWeight: 'bold' }
  });

  const renderItem = ({ item }) => {
    const fecha = item?.created_at ? new Date(item.created_at) : null;
    const hora = fecha ? `${fecha.getHours().toString().padStart(2,'0')}:${fecha.getMinutes().toString().padStart(2,'0')}` : '';
    const isOwn = item?.user_id && currentUserId && Number(item.user_id) === Number(currentUserId);
    const isDeleted = item?.deleted || item?.content === 'Un administrador eliminó este mensaje';
    const bubbleStyle = [
      styles.msgBubble,
      isDeleted ? styles.deletedBubble : (isOwn ? styles.ownBubble : styles.otherBubble)
    ];
    const metaStyle = [styles.meta, !isOwn && styles.metaOther];
    const textStyle = isDeleted
      ? [styles.deletedText]
      : [styles.msgText, !isOwn && styles.msgTextOther];
    return (
      <TouchableOpacity
        style={styles.msgRow}
        onLongPress={isDeleted ? undefined : () => onLongPressMessage(item)}
        delayLongPress={300}
        disabled={isDeleted}
      >
        <View style={bubbleStyle}>
          <View style={styles.msgHeader}>
            <Text style={metaStyle}> {item?.nombre || 'Usuario'}</Text>
            <Text style={metaStyle}> {item?.moto || 'Moto'}</Text>
            {!!hora && <Text style={metaStyle}> {hora}</Text>}
          </View>
          <Text style={textStyle}>{item.content}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Text style={styles.title}> ChatRiders</Text>
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}> </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 0 : 100 }}
          data={messages}
          inverted={true}
          keyExtractor={(item) => String(item?.id ?? `${item?.user_id || 'u'}-${item?.created_at || Math.random()}`)}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          refreshing={loading}
          onRefresh={async () => {
            try {
              setLoading(true);
              // En orden descendente, el último elemento es el más viejo
              const before = messages?.[messages.length - 1]?.created_at || null;
              const resp = await ChatService.fetchHistory({ room: 'global', before, limit: 50 });
              if (resp?.success && resp.messages?.length) {
                setMessages((prev) => mergeUniqueById(prev, resp.messages));
              }
            } finally {
              setLoading(false);
            }
          }}
          removeClippedSubviews={false}
          initialNumToRender={20}
          windowSize={10}
          maxToRenderPerBatch={20}
          updateCellsBatchingPeriod={50}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={isPremium|| isAdmin ? 'Escribe un mensaje...' : 'Disponible con Premium'}
            placeholderTextColor={isDarkMode ? '#777' : '#999'}
            value={message}
            onChangeText={setMessage}
            editable={isPremium || isAdmin}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity style={[styles.sendBtn, (!isPremium && !isAdmin) && { opacity: 0.5 }]} onPress={send} disabled={!isPremium && !isAdmin}>
            <Text style={styles.sendText}>Enviar</Text>
          </TouchableOpacity>
        </View>

        {!isPremium && !isAdmin && (
          <View style={styles.premiumOverlay}>
            <View style={styles.premiumCard}>
              <Text style={styles.premiumTitle}>Función Premium</Text>
              <Text style={styles.premiumText}>
                Para chatear con otros riders necesitás la versión Premium. Podrás enviar y recibir mensajes en tiempo real.ngeText={setMessage}
              </Text>
              <TouchableOpacity style={styles.premiumBtn} onPress={onUpgrade}>
                <Text style={styles.premiumBtnText}>Mejorar a Premium</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
