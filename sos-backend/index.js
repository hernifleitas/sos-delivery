const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Guardar info de riders en memoria
let riders = {};

// Función para enviar notificación a otros usuarios sobre SOS
const notificarSOSAOtrosUsuarios = (sosData) => {
  // Esta función se puede expandir para enviar notificaciones push reales
  // Por ahora, solo logueamos la información
  console.log(`🚨 ALERTA SOS: ${sosData.tipo.toUpperCase()} de ${sosData.nombre}`);
  console.log(`📍 Ubicación: ${sosData.ubicacion.lat}, ${sosData.ubicacion.lng}`);
  console.log(`🏍️ Moto: ${sosData.moto} (${sosData.color})`);
  console.log(`⏰ Hora: ${sosData.fechaHora}`);
  console.log('---');
  
  // Aquí se podría integrar con servicios como Firebase Cloud Messaging
  // para enviar notificaciones push reales a otros usuarios
};

// Recibir ubicación/SOS
app.post("/sos", (req, res) => {
  try {
    const { riderId, nombre, moto, color, ubicacion, fechaHora, tipo } = req.body;
    if (!riderId || !nombre || !moto || !color || !ubicacion || !ubicacion.lat || !ubicacion.lng || !tipo) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    // Verificar si es un nuevo SOS (no actualización)
    const esNuevoSOS = tipo && tipo !== "normal" && tipo !== "actualizacion" && !riders[riderId];
    const esSOSInicial = tipo && tipo !== "normal" && tipo !== "actualizacion" && riders[riderId]?.tipo !== tipo;

    // Guardamos/actualizamos info del rider
    riders[riderId] = {
      nombre,
      moto,
      color,
      ubicacion,
      fechaHora: new Date(fechaHora),
      tipo, // "robo", "pinchazo", "normal" o "" si no hay SOS
      lastUpdate: Date.now(),
      appActive: tipo === "normal" ? true : riders[riderId]?.appActive || false, // Solo true si es tipo normal
    };

    console.log(`Ubicación recibida de ${nombre} (${riderId}):`, ubicacion, "tipo:", tipo);
    
    // Notificar a otros usuarios si es un nuevo SOS
    if (esNuevoSOS || esSOSInicial) {
      notificarSOSAOtrosUsuarios({
        riderId,
        nombre,
        moto,
        color,
        ubicacion,
        fechaHora,
        tipo
      });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error recibiendo SOS:", err.message);
    res.status(500).json({ error: "No se pudo recibir la ubicación" });
  }
});

// Endpoint para obtener riders activos
app.get("/riders", (req, res) => {
  const now = Date.now();
  const cincoMinutos = 5 * 60 * 1000;
  const dosMinutos = 2 * 60 * 1000; // Para bandera verde después de cancelar SOS

  const ridersArray = Object.keys(riders)
    .filter((riderId) => {
      const r = riders[riderId];
      const tiempoInactivo = now - r.lastUpdate;
      
      // Si es tipo "normal" (bandera verde), solo mostrar por 2 minutos
      if (r.tipo === "normal") {
        return tiempoInactivo <= dosMinutos;
      }
      
      // Para otros tipos, mostrar por 5 minutos
      return tiempoInactivo <= cincoMinutos;
    })
    .map((riderId) => {
      const r = riders[riderId];
      let tipoMostrar = r.tipo;
      
      // Si es tipo "normal" y han pasado más de 2 minutos, no mostrar
      if (r.tipo === "normal" && (now - r.lastUpdate) > dosMinutos) {
        return null;
      }

      return {
        riderId,
        lat: r.ubicacion.lat,
        lng: r.ubicacion.lng,
        tipo: tipoMostrar || null,
        nombre: r.nombre,
        moto: r.moto,
        color: r.color,
        fechaHora: r.fechaHora,
      };
    })
    .filter(rider => rider !== null); // Filtrar los null

  res.json(ridersArray);
});

// Endpoint para obtener alertas SOS recientes
app.get("/alertas", (req, res) => {
  const now = Date.now();
  const cincoMinutos = 5 * 60 * 1000;

  const alertasArray = Object.keys(riders)
    .filter((riderId) => {
      const r = riders[riderId];
      const tiempoInactivo = now - r.lastUpdate;
      
      // Solo mostrar alertas SOS activas (no normales)
      return r.tipo && r.tipo !== "normal" && r.tipo !== "actualizacion" && tiempoInactivo <= cincoMinutos;
    })
    .map((riderId) => {
      const r = riders[riderId];
      return {
        riderId,
        nombre: r.nombre,
        moto: r.moto,
        color: r.color,
        tipo: r.tipo,
        ubicacion: r.ubicacion,
        fechaHora: r.fechaHora,
        tiempoTranscurrido: Math.floor((now - r.lastUpdate) / 1000) // en segundos
      };
    })
    .sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora)); // Más recientes primero

  res.json(alertasArray);
});

const PORT = 10000;
app.listen(PORT, '192.168.1.41', () => console.log(`Servidor corriendo en http://192.168.1.41:${PORT}`));
