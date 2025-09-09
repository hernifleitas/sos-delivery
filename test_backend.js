// test_backend.js - Script para probar el backend
const axios = require('axios');

const BACKEND_URL = 'http://192.168.1.41:10000';

async function testBackend() {
  console.log('🧪 Probando backend...');
  
  try {
    // Test 1: Verificar que el servidor responde
    console.log('\n1. Probando conexión al servidor...');
    const response = await axios.get(`${BACKEND_URL}/auth/verify`, {
      timeout: 5000
    });
    console.log('✅ Servidor responde correctamente');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Servidor responde (401 es esperado sin token)');
    } else {
      console.log('❌ Error de conexión:', error.message);
      return;
    }
  }

  // Test 2: Probar registro
  console.log('\n2. Probando registro de usuario...');
  const testUser = {
    nombre: 'Usuario Test',
    email: 'test@example.com',
    password: '123456',
    moto: 'Honda CB 250',
    color: 'Rojo'
  };

  try {
    const registerResponse = await axios.post(`${BACKEND_URL}/auth/register`, testUser, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (registerResponse.data.success) {
      console.log('✅ Registro exitoso:', registerResponse.data.message);
      console.log('👤 Usuario creado:', registerResponse.data.user.nombre);
    } else {
      console.log('❌ Error en registro:', registerResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Error en registro:', error.response?.data || error.message);
  }

  // Test 3: Probar login
  console.log('\n3. Probando login...');
  try {
    const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: 'test@example.com',
      password: '123456'
    }, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login exitoso:', loginResponse.data.message);
      console.log('🔑 Token recibido:', loginResponse.data.token ? 'Sí' : 'No');
    } else {
      console.log('❌ Error en login:', loginResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Error en login:', error.response?.data || error.message);
  }

  console.log('\n🏁 Pruebas completadas');
}

// Ejecutar las pruebas
testBackend().catch(console.error);
