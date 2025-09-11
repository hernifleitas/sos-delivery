// Script para aprobar al usuario administrador
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'users.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error abriendo la base de datos:', err.message);
    return;
  }
  
  console.log('Conectado a la base de datos SQLite');
  
  // Aprobar al usuario administrador
  db.run("UPDATE users SET status = 'approved' WHERE email = 'hernifleitas235@gmail.com'", function(err) {
    if (err) {
      console.error('Error actualizando usuario:', err.message);
    } else {
      console.log('Usuario hernifleitas235@gmail.com aprobado exitosamente');
    }
    
    // Verificar el estado
    db.get("SELECT id, nombre, email, status, role FROM users WHERE email = 'hernifleitas235@gmail.com'", (err, row) => {
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
