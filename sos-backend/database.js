// database.js - Implementación SOLO PostgreSQL
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

class Database {
  constructor() {
    this.pool = null;
    this.init();
  }

  init() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('DATABASE_URL no está definida. Configura la URL de PostgreSQL en variables de entorno.');
      process.exit(1);
    }

    this.pool = new Pool({
      connectionString,
      ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false }
    });

    this.createTablesPg()
      .then(() => console.log('Conectado a PostgreSQL y tablas verificadas'))
      .catch((err) => console.error('Error creando tablas en PostgreSQL:', err.message));
  }

  // =================== CREACIÓN DE TABLAS ===================
  async createTablesPg() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  mercadopago_payment_id VARCHAR(255) REFERENCES payments(mercadopago_payment_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Asegúrate de que no haya duplicados activos
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_active_subscription 
ON premium_subscriptions(user_id) 
WHERE is_active = true;
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          room TEXT DEFAULT 'global',
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          deleted_at TIMESTAMP,
          deleted_by INTEGER
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS device_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          token TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          preference_id TEXT NOT NULL,
          mercadopago_payment_id VARCHAR(255) UNIQUE,
          amount DECIMAL(10, 2) NOT NULL,
          currency VARCHAR(3) NOT NULL,
          subscription_id INTEGER REFERENCES premium_subscriptions(id) ON DELETE SET NULL,
          status VARCHAR(20) DEFAULT 'pending',
          payment_method_id TEXT,
          payment_type_id TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(preference_id)
        );
      `);

      await client.query(`
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      // Crear triggers para updated_at
      const triggers = [
        { table: 'device_tokens', name: 'device_tokens_set_updated_at' },
        { table: 'payments', name: 'payments_set_updated_at' },
        { table: 'premium_subscriptions', name: 'premium_subscriptions_set_updated_at' }
      ];

      for (const trigger of triggers) {
        await client.query(`
          DROP TRIGGER IF EXISTS ${trigger.name} ON ${trigger.table};
          CREATE TRIGGER ${trigger.name}
          BEFORE UPDATE ON ${trigger.table}
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at();
        `);
      }

      await client.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'device_tokens_set_updated_at'
          ) THEN
            CREATE TRIGGER device_tokens_set_updated_at
            BEFORE UPDATE ON device_tokens
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
          END IF;
        END $$;
      `);
    } finally {
      client.release();
    }
  }

  // =================== MÉTODOS USUARIOS ===================
  createUser(userData) {
    return (async () => {
      const { nombre, email, password, moto, color, telefono } = userData;
      const sql = `
        INSERT INTO users (nombre, email, password, moto, color, telefono)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, nombre, email, moto, color, telefono, created_at
      `;
      const { rows } = await this.pool.query(sql, [nombre, email, password, moto, color, telefono]);
      return rows[0];
    })();
  }

  findUserByEmail(email) {
    return (async () => {
      const sql = 'SELECT * FROM users WHERE email = $1 AND is_active = TRUE';
      const { rows } = await this.pool.query(sql, [email]);
      return rows[0];
    })();
  }

  findUserById(id) {
    return (async () => {
      const sql = 'SELECT * FROM users WHERE id = $1 AND is_active = TRUE';
      const { rows } = await this.pool.query(sql, [id]);
      return rows[0];
    })();
  }

  updateUser(id, userData) {
    return (async () => {
      const { nombre, moto, color } = userData;
      const sql = `
        UPDATE users
        SET nombre = $1, moto = $2, color = $3, updated_at = NOW()
        WHERE id = $4
      `;
      const result = await this.pool.query(sql, [nombre, moto, color, id]);
      return { changes: result.rowCount };
    })();
  }

  updateUserPassword(id, password) {
    return (async () => {
      const sql = `
        UPDATE users
        SET password = $1, updated_at = NOW()
        WHERE id = $2
      `;
      const result = await this.pool.query(sql, [password, id]);
      return { changes: result.rowCount };
    })();
  }

  deactivateUser(id) {
    return (async () => {
      const result = await this.pool.query('UPDATE users SET is_active = FALSE WHERE id = $1', [id]);
      return { changes: result.rowCount };
    })();
  }

  getAllUsers() {
    return (async () => {
      const { rows } = await this.pool.query(`
        SELECT id, nombre, email, moto, color, telefono, created_at, status, role, premium_expires_at
        FROM users
        WHERE is_active = TRUE
      `);
      return rows;
    })();
  }

  getPendingUsers() {
    return (async () => {
      const { rows } = await this.pool.query("SELECT id, nombre, email, moto, color, telefono, created_at FROM users WHERE status = 'pending' AND is_active = TRUE");
      return rows;
    })();
  }

  approveUser(id) {
    return (async () => {
      const result = await this.pool.query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2', ['approved', id]);
      return { changes: result.rowCount };
    })();
  }

  rejectUser(id) {
    return (async () => {
      const result = await this.pool.query('UPDATE users SET status = $1, is_active = FALSE, updated_at = NOW() WHERE id = $2', ['rejected', id]);
      return { changes: result.rowCount };
    })();
  }

  saveResetToken(email, token, expiresAt) {
    return (async () => {
      const sql = 'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3';
      const result = await this.pool.query(sql, [token, expiresAt, email]);
      return { changes: result.rowCount };
    })();
  }

  findUserByResetToken(token) {
    return (async () => {
      const sql = 'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW() AND is_active = TRUE';
      const { rows } = await this.pool.query(sql, [token]);
      return rows[0];
    })();
  }

  clearResetToken(id) {
    return (async () => {
      const sql = 'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1';
      const result = await this.pool.query(sql, [id]);
      return { changes: result.rowCount };
    })();
  }

  makeAdmin(id) {
    return (async () => {
      const result = await this.pool.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', id]);
      return { changes: result.rowCount };
    })();
  }


  async makePremium(userId, months = 1) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Calcular fecha de expiración
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);

      // 1. Actualizar el usuario
      await client.query(`
        UPDATE users 
        SET 
          role = 'premium',
          is_premium = true,
          premium_expires_at = $1,
          updated_at = NOW()
        WHERE id = $2
      `, [endDate, userId]);

      // 2. Desactivar suscripciones anteriores
      await client.query(`
        UPDATE premium_subscriptions 
        SET is_active = false, 
            updated_at = NOW() 
        WHERE user_id = $1
      `, [userId]);

      // 3. Crear nueva suscripción
      await client.query(`
        INSERT INTO premium_subscriptions 
          (user_id, start_date, end_date, is_active)
        VALUES 
          ($1, NOW(), $2, true)
      `, [userId, endDate]);

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Usuario actualizado a premium exitosamente',
        expiresAt: endDate
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en makePremium:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async removePremium(userId) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar si el usuario es admin (no se puede quitar premium a un admin)
      const adminCheck = await client.query(
        'SELECT role FROM users WHERE id = $1 AND role = $2',
        [userId, 'admin']
      );

      if (adminCheck.rows.length > 0) {
        return { changes: 0, message: 'No se puede quitar premium a un administrador' };
      }

      // Quitar premium y limpiar fecha de expiración
      const result = await client.query(
        `UPDATE users 
         SET role = 'user', is_premium = false, premium_expires_at = NULL, updated_at = NOW() 
         WHERE id = $1 AND role = 'premium'
         RETURNING id`,
        [userId]
      );

      // Desactivar suscripciones activas
      await client.query(
        `UPDATE premium_subscriptions 
         SET is_active = FALSE, updated_at = NOW() 
         WHERE user_id = $1 AND is_active = TRUE`,
        [userId]
      );

      await client.query('COMMIT');
      return {
        changes: result.rowCount,
        success: result.rowCount > 0,
        message: result.rowCount > 0 ? 'Premium eliminado correctamente' : 'Usuario no encontrado o no era premium'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en removePremium:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  // Verificar si un usuario es administrador
  async isAdmin(userId) {
    const client = await this.pool.connect();
    try {
      console.log(`Verificando si el usuario ${userId} es admin...`);
      const result = await client.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        console.log(`Usuario con ID ${userId} no encontrado`);
        return false;
      }

      const userRole = result.rows[0].role;
      console.log(`Rol del usuario ${userId}:`, userRole);
      return userRole === 'admin';
    } catch (error) {
      console.error('Error en isAdmin:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async isPremium(userId) {
    const client = await this.pool.connect();
    try {
      // 1. Verificar si el usuario es admin (siempre premium)
      const adminCheck = await client.query(
        'SELECT role FROM users WHERE id = $1 AND role = $2 AND is_active = TRUE',
        [userId, 'admin']
      );

      if (adminCheck.rows.length > 0) return true;

      // 2. Verificar usuario premium con expiración
      const { rows } = await client.query(
        `SELECT role, is_premium, premium_expires_at, is_active 
         FROM users WHERE id = $1 AND is_active = TRUE`,
        [userId]
      );

      if (rows.length === 0) return false;

      const user = rows[0];

      // 3. Verificar si es premium por rol o por bandera is_premium
      const isPremiumUser = user.role === 'premium' || user.is_premium === true;

      if (!isPremiumUser) return false;

      // 4. Si no tiene fecha de expiración, es premium permanente
      if (!user.premium_expires_at) return true;

      // 5. Verificar si la suscripción ha expirado
      const now = new Date();
      const expiresAt = new Date(user.premium_expires_at);

      if (now > expiresAt) {
        // 6. Si expiró, actualizar el estado
        await client.query(
          `UPDATE users 
           SET role = $1, 
               is_premium = false, 
               premium_expires_at = NULL, 
               updated_at = NOW() 
           WHERE id = $2`,
          ['user', userId]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en isPremium:', error);
      return false;
    } finally {
      client.release();
    }
  }
  async activatePremiumSubscription(paymentId, paymentData) {
    console.log(`[DEBUG] activatePremiumSubscription - paymentId: ${paymentId}, paymentData:`, paymentData);

    if (!paymentId) {
      throw new Error(`paymentId inválido: ${paymentId}`);
    }

    const client = await this.pool.connect();
    let userId = null;

    try {
      await client.query('BEGIN');
      // Buscar solo pagos aprobados
      const paymentResult = await client.query(
        `SELECT * FROM payments
   WHERE (mercadopago_payment_id = $1 OR preference_id = $1)
     AND status = 'approved'`,
        [paymentId.toString()]
      );

      if (paymentResult.rows.length === 0) {
        throw new Error(`No se puede activar premium: pago no encontrado o no aprobado`);
      }

      const payment = paymentResult.rows[0];
      userId = payment.user_id;
      const status = payment.status;

      // Si el pago ya fue procesado, verificar la suscripción
      if (status === 'approved' || status === 'completed') {
        console.log(`[INFO] El pago ya fue procesado con estado: ${status}, verificando suscripción...`);

        const subscriptionCheck = await client.query(
          `SELECT * FROM premium_subscriptions 
           WHERE mercadopago_payment_id = $1 AND is_active = true`,
          [payment.mercadopago_payment_id || paymentId]
        );

        if (subscriptionCheck.rows.length > 0) {
          console.log(`[INFO] El usuario ya tiene una suscripción activa para este pago`);
          return {
            success: true,
            message: `El usuario ya tiene una suscripción activa para este pago`,
            alreadyProcessed: true
          };
        }
        // Si no hay suscripción activa, continuar con la activación
        console.log(`[INFO] Reactivando suscripción para pago aprobado previamente`);
      }
      // Si el pago no está aprobado ni completado
      else if (status !== 'pending') {
        throw new Error(`Estado de pago inesperado: ${status}`);
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 mes de suscripción

      console.log(`[DEBUG] Procesando pago para usuario ID: ${userId}, paymentId: ${paymentId}`);

      // 2. Desactivar suscripciones activas anteriores
      await client.query(
        `UPDATE premium_subscriptions
         SET is_active = false, 
             updated_at = NOW()
         WHERE user_id = $1 AND is_active = true`,
        [userId]
      );
      const existingSubscription = await client.query(
        `SELECT * FROM premium_subscriptions 
         WHERE mercadopago_payment_id = $1`,
        [paymentId]
      );

      // Si ya existe una suscripción activa, no hacer nada
      if (existingSubscription.rows.length > 0 && existingSubscription.rows[0].is_active) {
        await client.query('COMMIT');
        return {
          success: true,
          message: 'Suscripción ya activada previamente',
          subscription: existingSubscription.rows[0],
          alreadyProcessed: true
        };
      }

      // 4. Crear o actualizar suscripción (evita error de clave duplicada)
      const subscriptionResult = await client.query(
        `INSERT INTO premium_subscriptions (
      user_id,
      mercadopago_payment_id,
      start_date,
      end_date,
      is_active
  ) VALUES ($1, $2, $3, $4, true)
  ON CONFLICT (mercadopago_payment_id)
  DO UPDATE SET
      is_active = EXCLUDED.is_active,
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      updated_at = NOW()
  RETURNING *;`,
        [userId, payment.id, startDate, endDate]
      );

      // 5. Actualizar el usuario a premium
      await client.query(
        `UPDATE users 
         SET is_premium = true,
             premium_expires_at = $1,
             role = 'premium',
             updated_at = NOW()
         WHERE id = $2`,
        [endDate, userId]
      );

      await client.query('COMMIT');

      console.log(`[SUCCESS] Suscripción premium activada para usuario ${userId}`);
      return {
        success: true,
        message: 'Suscripción premium activada correctamente',
        endDate: endDate.toISOString(),
        subscription: subscriptionResult.rows[0]
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en activatePremiumSubscription:', {
        paymentId,
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserSubscriptions(userId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT ps.*, p.amount, p.currency, p.status as payment_status, p.created_at as payment_date, p.mercadopago_payment_id
         FROM premium_subscriptions ps
         LEFT JOIN payments p ON p.mercadopago_payment_id = ps.mercadopago_payment_id
         WHERE ps.user_id = $1
         ORDER BY ps.start_date DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error en getUserSubscriptions:', error);
      throw error;
    } finally {
      client.release();
    }
  }


  async savePaymentDetails(paymentData) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Validar solo los campos mínimos necesarios
      const requiredFields = ['user_id', 'preference_id', 'amount', 'currency'];
      const missingFields = requiredFields.filter(field => !paymentData[field]);

      if (missingFields.length > 0) {
        throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
      }

      const {
        user_id,
        preference_id,
        amount,
        currency,
        subscription_id = null,
        status = 'pending',
        mercadopago_payment_id = null,
        payment_method_id = null,
        payment_type_id = null
      } = paymentData;

      console.log(`[PAYMENT] Guardando pago para usuario ${user_id}, preferencia: ${preference_id}`);

      // Insertar o actualizar si ya existe la preferencia
      const result = await client.query(
        `INSERT INTO payments (
        user_id, 
        preference_id, 
        amount, 
        currency, 
        subscription_id,
        status,
        mercadopago_payment_id,
        payment_method_id,
        payment_type_id,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (preference_id) 
      DO UPDATE SET
        status = EXCLUDED.status,
        mercadopago_payment_id = COALESCE(EXCLUDED.mercadopago_payment_id, payments.mercadopago_payment_id),
        payment_method_id = COALESCE(EXCLUDED.payment_method_id, payments.payment_method_id),
        payment_type_id = COALESCE(EXCLUDED.payment_type_id, payments.payment_type_id),
        updated_at = NOW()
      RETURNING *`,
        [
          user_id,
          preference_id,
          amount,
          currency,
          subscription_id,
          status,
          mercadopago_payment_id,
          payment_method_id,
          payment_type_id
        ]
      );

      await client.query('COMMIT');
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en savePaymentDetails:', {
        error: error.message,
        paymentData: {
          ...paymentData,
          card_token: paymentData.card_token ? '[FILTRADO]' : undefined
        }
      });
      throw error;
    } finally {
      client.release();
    }
  }
  // =================== CHAT ===================
  addMessage(userId, content, room = 'global') {
    return (async () => {
      const sql = 'INSERT INTO messages (user_id, room, content) VALUES ($1, $2, $3) RETURNING id';
      const { rows } = await this.pool.query(sql, [userId, room, content]);
      return { id: rows[0].id };
    })();
  }

  getMessages({ room = 'global', before = null, limit = 50 }) {
    return (async () => {
      const params = [room];
      let sql = `
        SELECT m.id, m.content, m.created_at, u.id AS user_id, u.nombre, u.moto, u.color
        FROM messages m
        JOIN users u ON u.id = m.user_id
        WHERE m.room = $1 AND m.deleted_at IS NULL
      `;
      if (before) {
        sql += ' AND m.created_at < $2';
        params.push(before);
      }
      sql += ' ORDER BY m.created_at DESC LIMIT ' + Number(limit);
      const { rows } = await this.pool.query(sql, params);
      return rows.reverse();
    })();
  }

  softDeleteMessage(messageId, adminUserId) {
    return (async () => {
      const sql = `
        UPDATE messages
        SET deleted_at = NOW(), deleted_by = $1
        WHERE id = $2 AND deleted_at IS NULL
      `;
      const result = await this.pool.query(sql, [adminUserId, messageId]);
      return { changes: result.rowCount };
    })();
  }

  // =================== TOKENS ===================
  upsertDeviceToken(userId, token) {
    return (async () => {
      const sql = `
        INSERT INTO device_tokens (user_id, token)
        VALUES ($1, $2)
        ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, updated_at = NOW()
        RETURNING id
      `;
      const { rows } = await this.pool.query(sql, [userId, token]);
      return { id: rows[0]?.id || null, changes: rows[0] ? 1 : 0 };
    })();
  }

  getAllTokensExcept(userId) {
    return (async () => {
      const { rows } = await this.pool.query('SELECT token FROM device_tokens WHERE user_id != $1', [userId]);
      return rows.map(r => r.token);
    })();
  }

  getAllTokens() {
    return (async () => {
      const { rows } = await this.pool.query('SELECT token FROM device_tokens');
      return rows.map(r => r.token);
    })();
  }

  // =================== CIERRE ===================
  close() {
    if (this.pool) {
      this.pool.end().catch((e) => console.error('Error cerrando pool PG:', e));
    }
  }
}

module.exports = new Database();
