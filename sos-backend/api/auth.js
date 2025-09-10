const express = require('express');
const router = express.Router();
const authService = require('../auth');
const emailService = require('../email');

// Ruta de registro
router.post('/register', async (req, res) => {
  try {
    console.log('Datos recibidos en registro:', req.body);
    const result = await authService.register(req.body);
    console.log('Resultado del registro:', result);
    
    if (result.success) {
      // Enviar email de bienvenida
      try {
        await emailService.sendWelcomeEmail(result.user);
        console.log(`Email de bienvenida enviado a ${result.user.email}`);
      } catch (emailError) {
        console.error('Error enviando email de bienvenida:', emailError);
        // No fallar el registro si el email falla
      }
      
      res.status(201).json({
        success: true,
        message: 'Usuario registrado correctamente',
        user: result.user,
        token: result.token
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta de login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        user: result.user,
        token: result.token
      });
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para verificar token
router.get('/verify', authService.authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Ruta para actualizar perfil
router.put('/profile', authService.authenticateToken, async (req, res) => {
  try {
    const result = await authService.updateProfile(req.user.id, req.body);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para cambiar contraseña
router.put('/change-password', authService.authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para reset de contraseña
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.resetPassword(email);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
