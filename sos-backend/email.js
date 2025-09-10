const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    // Configurar el transporter de email
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verificar la configuración
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Error configurando email:', error);
      } else {
        console.log('✅ Servidor de email listo para enviar mensajes');
      }
    });
  }

  // Enviar email de reset de contraseña
  async sendPasswordResetEmail(user, newPassword) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Rider SOS <noreply@ridersos.com>',
        to: user.email,
        subject: '🔐 Nueva Contraseña - Rider SOS',
        html: this.generatePasswordResetEmailHTML(user, newPassword),
        text: this.generatePasswordResetEmailText(user, newPassword)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email de reset de contraseña enviado:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error enviando email de reset:', error);
      throw error;
    }
  }

  // Enviar email de bienvenida
  async sendWelcomeEmail(user) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Rider SOS <noreply@ridersos.com>',
        to: user.email,
        subject: '🚀 ¡Bienvenido a Rider SOS!',
        html: this.generateWelcomeEmailHTML(user),
        text: this.generateWelcomeEmailText(user)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email de bienvenida enviado:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error enviando email de bienvenida:', error);
      throw error;
    }
  }

  // Generar HTML del email de reset de contraseña
  generatePasswordResetEmailHTML(user, newPassword) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nueva Contraseña - Rider SOS</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 20px 0; }
          .password-box { background: #f8f9fa; border: 2px solid #e74c3c; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
          .password { font-size: 24px; font-weight: bold; color: #e74c3c; letter-spacing: 2px; font-family: monospace; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Nueva Contraseña</h1>
            <p>Rider SOS - Seguridad para Repartidores</p>
          </div>
          
          <div class="content">
            <h2>Hola ${user.nombre},</h2>
            
            <p>Has solicitado una nueva contraseña para tu cuenta de Rider SOS. Aquí tienes tu nueva contraseña:</p>
            
            <div class="password-box">
              <p><strong>Tu nueva contraseña es:</strong></p>
              <div class="password">${newPassword}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Guarda esta contraseña en un lugar seguro</li>
                <li>Te recomendamos cambiarla después de iniciar sesión</li>
                <li>No compartas esta información con nadie</li>
              </ul>
            </div>
            
            <p>Puedes iniciar sesión en la aplicación con tu email y esta nueva contraseña.</p>
            
            <p><strong>Datos de tu cuenta:</strong></p>
            <ul>
              <li><strong>Nombre:</strong> ${user.nombre}</li>
              <li><strong>Email:</strong> ${user.email}</li>
              <li><strong>Moto:</strong> ${user.moto}</li>
              <li><strong>Color:</strong> ${user.color}</li>
            </ul>
            
            <p>Si no solicitaste este cambio, por favor contacta con soporte inmediatamente.</p>
            
            <p>¡Gracias por usar Rider SOS y mantenerte seguro en la carretera!</p>
          </div>
          
          <div class="footer">
            <p>Rider SOS - Sistema de Seguridad para Repartidores</p>
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generar texto del email de reset de contraseña
  generatePasswordResetEmailText(user, newPassword) {
    return `
Nueva Contraseña - Rider SOS
Seguridad para Repartidores

Hola ${user.nombre},

Has solicitado una nueva contraseña para tu cuenta de Rider SOS.

TU NUEVA CONTRASEÑA ES: ${newPassword}

IMPORTANTE:
- Guarda esta contraseña en un lugar seguro
- Te recomendamos cambiarla después de iniciar sesión
- No compartas esta información con nadie

Datos de tu cuenta:
- Nombre: ${user.nombre}
- Email: ${user.email}
- Moto: ${user.moto}
- Color: ${user.color}

Puedes iniciar sesión en la aplicación con tu email y esta nueva contraseña.

Si no solicitaste este cambio, por favor contacta con soporte inmediatamente.

¡Gracias por usar Rider SOS y mantenerte seguro en la carretera!

---
Rider SOS - Sistema de Seguridad para Repartidores
Este es un email automático, por favor no respondas a este mensaje.
    `;
  }

  // Generar HTML del email de bienvenida
  generateWelcomeEmailHTML(user) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a Rider SOS</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                color: white;
                padding: 30px;
                border-radius: 10px;
                margin-bottom: 30px;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: bold;
            }
            .header p {
                margin: 10px 0 0 0;
                font-size: 16px;
                opacity: 0.9;
            }
            .content {
                margin-bottom: 30px;
            }
            .welcome-message {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #e74c3c;
                margin-bottom: 20px;
            }
            .user-info {
                background-color: #fff;
                border: 1px solid #e1e8ed;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 8px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            .info-row:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }
            .info-label {
                font-weight: bold;
                color: #2c3e50;
            }
            .info-value {
                color: #7f8c8d;
            }
            .features {
                margin-top: 30px;
            }
            .feature-item {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                padding: 10px;
                background-color: #f8f9fa;
                border-radius: 6px;
            }
            .feature-icon {
                font-size: 24px;
                margin-right: 15px;
                width: 40px;
                text-align: center;
            }
            .feature-text {
                flex: 1;
            }
            .feature-title {
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 5px;
            }
            .feature-description {
                color: #7f8c8d;
                font-size: 14px;
            }
            .cta {
                text-align: center;
                margin-top: 30px;
                padding: 20px;
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                border-radius: 8px;
                color: white;
            }
            .cta-button {
                display: inline-block;
                background-color: #ffffff;
                color: #e74c3c;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin-top: 10px;
                transition: all 0.3s ease;
            }
            .cta-button:hover {
                background-color: #f8f9fa;
                transform: translateY(-2px);
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e1e8ed;
                color: #7f8c8d;
                font-size: 14px;
            }
            .social-links {
                margin-top: 15px;
            }
            .social-links a {
                color: #e74c3c;
                text-decoration: none;
                margin: 0 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 Rider SOS</h1>
                <p>Seguridad para Repartidores</p>
            </div>
            
            <div class="content">
                <div class="welcome-message">
                    <h2>¡Hola ${user.nombre}!</h2>
                    <p>Te has registrado correctamente en <strong>Rider SOS</strong> con tu moto <strong>${user.moto}</strong> de color <strong>${user.color}</strong>.</p>
                    <p>Tu cuenta ha sido creada exitosamente y ya puedes comenzar a usar todas las funcionalidades de seguridad que ofrecemos.</p>
                </div>
                
                <div class="user-info">
                    <h3>📋 Información de tu cuenta</h3>
                    <div class="info-row">
                        <span class="info-label">Nombre:</span>
                        <span class="info-value">${user.nombre}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${user.email}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Moto:</span>
                        <span class="info-value">${user.moto}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Color:</span>
                        <span class="info-value">${user.color}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Fecha de registro:</span>
                        <span class="info-value">${new Date(user.created_at).toLocaleDateString('es-ES')}</span>
                    </div>
                </div>
                
                <div class="features">
                    <h3>🛡️ Características de Rider SOS</h3>
                    
                    <div class="feature-item">
                        <div class="feature-icon">🚨</div>
                        <div class="feature-text">
                            <div class="feature-title">Alertas SOS Instantáneas</div>
                            <div class="feature-description">Activa alertas de emergencia con un solo toque</div>
                        </div>
                    </div>
                    
                    <div class="feature-item">
                        <div class="feature-icon">📍</div>
                        <div class="feature-text">
                            <div class="feature-title">Seguimiento en Tiempo Real</div>
                            <div class="feature-description">Comparte tu ubicación automáticamente cada 2 minutos</div>
                        </div>
                    </div>
                    
                    <div class="feature-item">
                        <div class="feature-icon">🔔</div>
                        <div class="feature-text">
                            <div class="feature-title">Notificaciones de Emergencia</div>
                            <div class="feature-description">Recibe y envía alertas a otros repartidores</div>
                        </div>
                    </div>
                    
                    <div class="feature-item">
                        <div class="feature-icon">👥</div>
                        <div class="feature-text">
                            <div class="feature-title">Comunidad de Repartidores</div>
                            <div class="feature-description">Conecta con otros riders para mayor seguridad</div>
                        </div>
                    </div>
                </div>
                
                <div class="cta">
                    <h3>🎯 ¡Comienza a usar Rider SOS!</h3>
                    <p>Recuerda activar el seguimiento de ubicación desde la aplicación para mayor seguridad.</p>
                    <a href="#" class="cta-button">Abrir Aplicación</a>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Rider SOS</strong> - Tu seguridad es nuestra prioridad</p>
                <p>Gracias por confiar en nosotros para mantenerte seguro mientras trabajas.</p>
                <div class="social-links">
                    <a href="#">Soporte</a> |
                    <a href="#">Términos de Uso</a> |
                    <a href="#">Privacidad</a>
                </div>
                <p style="margin-top: 15px; font-size: 12px;">
                    Este email fue enviado automáticamente. Por favor no respondas a este mensaje.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Generar texto plano del email de bienvenida
  generateWelcomeEmailText(user) {
    return `
🚀 RIDER SOS - Seguridad para Repartidores

¡Hola ${user.nombre}!

Te has registrado correctamente en Rider SOS con tu moto ${user.moto} de color ${user.color}.

INFORMACIÓN DE TU CUENTA:
- Nombre: ${user.nombre}
- Email: ${user.email}
- Moto: ${user.moto}
- Color: ${user.color}
- Fecha de registro: ${new Date(user.created_at).toLocaleDateString('es-ES')}

CARACTERÍSTICAS DE RIDER SOS:
🚨 Alertas SOS Instantáneas - Activa alertas de emergencia con un solo toque
📍 Seguimiento en Tiempo Real - Comparte tu ubicación automáticamente cada 2 minutos
🔔 Notificaciones de Emergencia - Recibe y envía alertas a otros repartidores
👥 Comunidad de Repartidores - Conecta con otros riders para mayor seguridad

¡IMPORTANTE!
Recuerda activar el seguimiento de ubicación desde la aplicación para mayor seguridad.

Gracias por confiar en Rider SOS para mantenerte seguro mientras trabajas.

Rider SOS - Tu seguridad es nuestra prioridad

---
Este email fue enviado automáticamente. Por favor no respondas a este mensaje.
    `;
  }
}

module.exports = new EmailService();
