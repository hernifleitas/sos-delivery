const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// 🔹 Configuración del BOT de Telegram
const TELEGRAM_BOT_TOKEN = "8202650308:AAHNRuK3AsQLTEEvr7ubKob1ZG-39Qn3Au4";
const TELEGRAM_CHAT_ID = "-4669903719";

// Endpoint para recibir SOS
app.post("/sos", async (req, res) => {
  try {
    const { nombre, moto, ubicacion, fechaHora } = req.body;

    if (!nombre || !moto || !ubicacion || !ubicacion.lat || !ubicacion.lng) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    // Crear mensaje para Telegram
    const mensaje = `
🚨 *SOS ACTIVADO* 🚨
🧑 Usuario: ${nombre}
🏍️ Moto: ${moto}
📍 Ubicación: https://maps.google.com/?q=${ubicacion.lat},${ubicacion.lng}
🕒 Fecha y hora: ${fechaHora}
    `;

    // Enviar mensaje al grupo de Telegram
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: mensaje,
        parse_mode: "Markdown",
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error enviando SOS:", err);
    res.status(500).json({ error: "No se pudo enviar el SOS" });
  }
});

// Iniciar servidor
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});