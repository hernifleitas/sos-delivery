const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json"); // poné la ruta correcta

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;