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

  async getToken() {
    return await AsyncStorage.getItem('authToken');
  }

  async connect() {
    if (this.socket && this.socket.connected) return this.socket;
    const token = await this.getToken();
    this.socket = io(`${BACKEND_URL}/chat`, {
      transports: ['websocket'],
      auth: { token },
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
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
    const response = await axios.get(`${BACKEND_URL}/chat/history`, {
      params: { room, before, limit },
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    return response.data;
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
