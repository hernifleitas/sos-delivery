// services/ChatService.js
import io from 'socket.io-client';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendURL } from '../config';

const BACKEND_URL = getBackendURL();

class ChatService {
  constructor() {
    this.socket = null;
  }

  getSocket() {
    return this.socket;
  }

  async getToken() {
    return await AsyncStorage.getItem('authToken');
  }

  async connect() {
    if (this.socket && this.socket.connected) return this.socket;
    const token = await this.getToken();
    if (!token) {
      throw new Error('No autenticado: falta token');
    }
    this.socket = io(`${BACKEND_URL}/chat`, {
      transports: ['websocket'],
      auth: { token },
      query: { token },
      extraHeaders: { Authorization: `Bearer ${token}` },
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    this.socket.on('connect_error', async (err) => {
      const msg = String(err?.message || '').toLowerCase();
      console.warn('Socket connect_error:', err?.message);
      if (msg.includes('unauthorized') || msg.includes('forbidden')) {
        // Token inválido/ausente: limpiar y que la UI pida re-login
        try { await AsyncStorage.removeItem('authToken'); } catch {}
      }
    });

    return this.socket;
  }

  on(event, handler) {
    if (!this.socket) return;
    this.socket.on(event, handler);
  }

  off(event, handler) {
    if (!this.socket) return;
    this.socket.off(event, handler);
  }

  async sendMessage(content, room = 'global') {
    if (!this.socket) await this.connect();
    return new Promise((resolve) => {
      this.socket.emit('message:send', { content, room }, (ack) => resolve(ack));
    });
  }

  async deleteMessage(messageId) {
    if (!this.socket) await this.connect();
    return new Promise((resolve) => {
      this.socket.emit('message:delete', { id: messageId }, (ack) => resolve(ack));
    });
  }

  async fetchHistory({ room = 'global', before = null, limit = 50 } = {}) {
  const token = await this.getToken();
  const url = `${BACKEND_URL}/api/chat/history?room=${room}&limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ''}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await AsyncStorage.removeItem('authToken');
        return { success: false, message: 'Sesión expirada' };
      }
      throw new Error('Error en la respuesta del servidor');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en fetchHistory:', error);
    return { success: false, message: error.message || 'Error de conexión' };
  }
}

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new ChatService();
