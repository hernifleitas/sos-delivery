// Script completo para arreglar la base de datos
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'users.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error abriendo la base de datos:', err.message);
    return;
  }
  
  console.log('Conectado a la base de datos SQLite');
  
  // Verificar estructura de la tabla
  db.all('PRAGMA table_info(users)', (err, rows) => {
    if (err) {
      console.error('Error obteniendo estructura de tabla:', err.message);
      return;
    }
    
    console.log('Estructura actual de la tabla users:');
    console.log(JSON.stringify(rows, null, 2));
    
    // Verificar si existen las columnas necesarias
    const hasStatus = rows.some(row => row.name === 'status');
    const hasRole = rows.some(row => row.name === 'role');
    const hasResetToken = rows.some(row => row.name === 'reset_token');
    
    console.log('Columnas existentes:');
    console.log('- status:', hasStatus);
    console.log('- role:', hasRole);
    console.log('- reset_token:', hasResetToken);
    
    // Agregar columnas faltantes
    const addColumns = async () => {
      if (!hasStatus) {
        await new Promise((resolve, reject) => {
          db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending'", (err) => {
            if (err) {
              console.log('Error agregando columna status:', err.message);
            } else {
              console.log('Columna status agregada');
            }
            resolve();
          });
        });
      }
      
      if (!hasRole) {
        await new Promise((resolve, reject) => {
          db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", (err) => {
            if (err) {
              console.log('Error agregando columna role:', err.message);
            } else {
              console.log('Columna role agregada');
            }
            resolve();
          });
        });
      }
      
      if (!hasResetToken) {
        await new Promise((resolve, reject) => {
          db.run("ALTER TABLE users ADD COLUMN reset_token TEXT", (err) => {
            if (err) {
              console.log('Error agregando columna reset_token:', err.message);
            } else {
              console.log('Columna reset_token agregada');
            }
            resolve();
          });
        });
      }
      
      if (!rows.some(row => row.name === 'reset_token_expires')) {
        await new Promise((resolve, reject) => {
          db.run("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME", (err) => {
            if (err) {
              console.log('Error agregando columna reset_token_expires:', err.message);
            } else {
              console.log('Columna reset_token_expires agregada');
            }
            resolve();
          });
        });
      }
    };
    
    addColumns().then(() => {
      // Aprobar al usuario administrador
      db.run("UPDATE users SET status = 'approved', role = 'admin' WHERE email = 'hernifleitas235@gmail.com'", function(err) {
        if (err) {
          console.error('Error actualizando usuario:', err.message);
        } else {
          console.log('Usuario hernifleitas235@gmail.com aprobado y promovido a administrador');
        }
        
        // Verificar el estado final
        db.get("SELECT id, nombre, email, status, role FROM users WHERE email = 'hernifleitas235@gmail.com'", (err, row) => {
          if (err) {
            console.error('Error consultando usuario:', err.message);
          } else {
            console.log('Estado final del usuario:');
            console.log(JSON.stringify(row, null, 2));
          }
          
          // Cerrar conexión
          db.close((err) => {
            if (err) {
              console.error('Error cerrando la base de datos:', err.message);
            } else {
              console.log('Conexión cerrada');
            }
          });
        });
      });
    });
  });
});
