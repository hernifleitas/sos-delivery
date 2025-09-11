// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    const dbPath = path.join(__dirname, 'users.db');
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error abriendo la base de datos:', err.message);
      } else {
        console.log('Conectado a la base de datos SQLite');
        this.createTables();
      }
    });
  }

  createTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        moto TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        status TEXT DEFAULT 'pending',
        reset_token TEXT,
        reset_token_expires DATETIME,
        role TEXT DEFAULT 'user'
      )
    `;

    this.db.run(createUsersTable, (err) => {
      if (err) {
        console.error('Error creando tabla users:', err.message);
      } else {
        console.log('Tabla users creada/verificada correctamente');
      }
    });
  }

  // Crear usuario
  createUser(userData) {
    return new Promise((resolve, reject) => {
      const { nombre, email, password, moto, color } = userData;
      
      const sql = `
        INSERT INTO users (nombre, email, password, moto, color)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      this.db.run(sql, [nombre, email, password, moto, color], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            nombre,
            email,
            moto,
            color,
            created_at: new Date().toISOString()
          });
        }
      });
    });
  }

  // Buscar usuario por email
  findUserByEmail(email) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email = ? AND is_active = 1';
      
      this.db.get(sql, [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Buscar usuario por ID
  findUserById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE id = ? AND is_active = 1';
      
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Actualizar usuario
  updateUser(id, userData) {
    return new Promise((resolve, reject) => {
      const { nombre, moto, color } = userData;
      
      const sql = `
        UPDATE users 
        SET nombre = ?, moto = ?, color = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      this.db.run(sql, [nombre, moto, color, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Actualizar contraseña de usuario
  updateUserPassword(id, password) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE users 
        SET password = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      this.db.run(sql, [password, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Desactivar usuario
  deactivateUser(id) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE users SET is_active = 0 WHERE id = ?';
      
      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Obtener todos los usuarios activos
  getAllUsers() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, nombre, email, moto, color, created_at FROM users WHERE is_active = 1';
      
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Obtener usuarios pendientes de aprobación
  getPendingUsers() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, nombre, email, moto, color, created_at FROM users WHERE status = "pending" AND is_active = 1';
      
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Aprobar usuario
  approveUser(id) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE users SET status = "approved", updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      
      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Rechazar usuario
  rejectUser(id) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE users SET status = "rejected", is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      
      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Guardar token de reset
  saveResetToken(email, token, expiresAt) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?';
      
      this.db.run(sql, [token, expiresAt, email], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Buscar usuario por token de reset
  findUserByResetToken(token) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > CURRENT_TIMESTAMP AND is_active = 1';
      
      this.db.get(sql, [token], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Limpiar token de reset
  clearResetToken(id) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?';
      
      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Hacer usuario administrador
  makeAdmin(id) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE users SET role = "admin" WHERE id = ?';
      
      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Verificar si usuario es administrador
  isAdmin(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT role FROM users WHERE id = ? AND is_active = 1';
      
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row?.role === 'admin');
        }
      });
    });
  }

  // Cerrar conexión
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error cerrando la base de datos:', err.message);
        } else {
          console.log('Conexión a la base de datos cerrada');
        }
      });
    }
  }
}

module.exports = new Database();

