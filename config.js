// config.js - Configuración de la aplicación
export const CONFIG = {
  // URLs del backend
  BACKEND_URL: __DEV__ 
    ? 'http://192.168.1.51:3000'  // Desarrollo
    : 'http://192.168.1.51:3000',     // Producción
    
  // Timeouts
  API_TIMEOUT: 15000,
  
  // Intervalos
  LOCATION_INTERVAL: 2 * 60 * 1000, // 2 minutos para SOS
  MAP_UPDATE_INTERVAL: 3000,        // 30 segundos para mapa
  ALERTAS_UPDATE_INTERVAL: 10000,    // 10 segundos para alertas
  
  // Configuración de notificaciones
  NOTIFICATION_COOLDOWN: 30000,      // 30 segundos entre notificaciones
  
  // Configuración de tracking
  LOCATION_ACCURACY: 'balanced',
  LOCATION_DISTANCE_INTERVAL: 50,    // metros
  LOCATION_DEFERRED_INTERVAL: 60000, // 1 minuto
  
  // Colores del tema
  COLORS: {
    primary: '#e74c3c',
    primaryDark: '#c0392b',
    secondary: '#2c3e50',
    background: '#1a1a1a',
    backgroundLight: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#cccccc',
    success: '#27ae60',
    warning: '#f39c12',
    error: '#e74c3c',
    border: '#444444'
  },
  
  // Configuración de la app
  APP_NAME: 'Rider SOS',
  APP_VERSION: '1.0.0',
  
  // Configuración de email
  EMAIL_CONFIG: {
    from: 'Rider SOS <noreply@ridersos.com>',
    subject: '🚀 ¡Bienvenido a Rider SOS!'
  }
};

// Función para obtener la URL del backend
export const getBackendURL = () => {
  return CONFIG.BACKEND_URL;
};

// Función para obtener headers por defecto
export const getDefaultHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Función para validar email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para validar contraseña
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Función para formatear fecha
export const formatDate = (date) => {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Función para formatear tiempo transcurrido
export const formatElapsedTime = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
};

export default CONFIG;
