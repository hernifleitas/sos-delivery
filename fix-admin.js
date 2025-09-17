// Script para aprobar al usuario administrador
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// La base de datos real está en sos-backend/users.db
const dbPath = path.join(__dirname, 'sos-backend', 'users.db');

// Permitir pasar el email por argumento: node fix-admin.js correo@dominio.com
const targetEmail = process.argv[2] || 'hernifleitas235@gmail.com';

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error abriendo la base de datos:', err.message);
    return;
  }
  
  console.log('Conectado a la base de datos SQLite');
  
  // Aprobar al usuario administrador
  db.run("UPDATE users SET status = 'approved' WHERE email = ?", [targetEmail], function(err) {
    if (err) {
      console.error('Error actualizando usuario:', err.message);
    } else {
      console.log(`Usuario ${targetEmail} aprobado exitosamente`);
    }
    
    // Verificar el estado
    db.get("SELECT id, nombre, email, status, role FROM users WHERE email = ?", [targetEmail], (err, row) => {
      if (err) {
        console.error('Error consultando usuario:', err.message);
      } else {
        console.log('Estado actual del usuario:');
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
