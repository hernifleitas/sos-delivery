  const express = require('express');
  const router = express.Router();
  const authService = require('../auth');
  const emailService = require('../email');
  const database = require('../database');

  // Ruta de registro
  router.post('/register', async (req, res) => {
    try {
      console.log('Datos recibidos en registro:', req.body);
      const result = await authService.register(req.body);
      console.log('Resultado del registro:', result);
      
      if (result.success) {
        res.status(201).json(result);
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

  // Promover a Premium por 30 días (solo admin)
  router.post('/admin/make-premium/:userId', authService.authenticateToken.bind(authService), authService.requireAdmin.bind(authService), async (req, res) => {
    try {
      const { userId } = req.params;
      const { days = 30 } = req.body; // Por defecto 30 días si no se especifica
      
      if (isNaN(days) || days < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'El número de días debe ser un número mayor a 0' 
        });
      }
      
      const result = await database.makePremium(userId, days);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: `Usuario promovido a Premium por ${days} días`,
          expiresAt: result.expiresAt
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: 'Error al actualizar el usuario a Premium' 
        });
      }
    } catch (error) {
      console.error('Error promoviendo a Premium:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  });

  // Quitar Premium (solo admin)
  router.post('/admin/remove-premium/:userId', authService.authenticateToken.bind(authService), authService.requireAdmin.bind(authService), async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await database.removePremium(userId);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: result.message || 'Se ha quitado el estado Premium al usuario'
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: result.message || 'No se pudo quitar el estado Premium'
        });
      }
    } catch (error) {
      console.error('Error quitando Premium:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor al procesar la solicitud' 
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
  router.get('/verify', authService.authenticateToken.bind(authService), (req, res) => {
    res.json({
      success: true,
      user: req.user
    });
  });

  // Ruta para actualizar perfil
  router.put('/profile', authService.authenticateToken.bind(authService), async (req, res) => {
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
  router.put('/change-password', authService.authenticateToken.bind(authService), async (req, res) => {
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

  // Ruta para solicitar reset de contraseña
  router.post('/request-password-reset', async (req, res) => {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error solicitando reset de contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  });

  // Ruta para reset de contraseña con token
  router.post('/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPasswordWithToken(token, newPassword);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error reseteando contraseña con token:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  });

  // Rutas de administración
  // Obtener todos los usuarios
  router.get(
    '/admin/all-users',
    authService.authenticateToken.bind(authService),
    authService.requireAdmin.bind(authService),
    async (req, res) => {
      try {
        const users = await database.getAllUsers(); // database solo para leer datos
        res.json({
          success: true,
          users: users.map(user => ({
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            moto: user.moto,
            color: user.color,
            status: user.status,
            role: user.role || 'user',
            premium_expires_at: user.premium_expires_at,
            created_at: user.created_at
          }))
        });
      } catch (error) {
        console.error('Error obteniendo todos los usuarios:', error);
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor'
        });
      }
    }
  );
  

  // Obtener usuarios pendientes
  router.get('/admin/pending-users', authService.authenticateToken.bind(authService), authService.requireAdmin.bind(authService), async (req, res) => {
    try {
      const result = await authService.getPendingUsers();
      res.json(result);
    } catch (error) {
      console.error('Error obteniendo usuarios pendientes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  });

  // Aprobar usuario
  router.post('/admin/approve-user/:userId', authService.authenticateToken.bind(authService), authService.requireAdmin.bind(authService), async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await authService.approveUser(userId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error aprobando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  });

  // Rechazar usuario
  router.post('/admin/reject-user/:userId', authService.authenticateToken.bind(authService), authService.requireAdmin.bind(authService), async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await authService.rejectUser(userId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error rechazando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  });

  // Ruta para hacer administrador (solo para desarrollo)
  router.post('/admin/make-admin/:userId', authService.authenticateToken.bind(authService), async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await database.makeAdmin(userId);
      
      if (result.changes > 0) {
        res.json({
          success: true,
          message: 'Usuario promovido a administrador'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
    } catch (error) {
      console.error('Error promoviendo a administrador:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  });

  module.exports = router;
