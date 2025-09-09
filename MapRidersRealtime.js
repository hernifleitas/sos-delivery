// MapRidersRealtimeOSM.js
import React, { useState, useEffect, useRef } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKEND_URL = "http://192.168.1.41:10000/riders";

export default function MapRidersRealtimeOSM() {
  const [loading, setLoading] = useState(true);
  const webviewRef = useRef(null);

  useEffect(() => {
    const fetchRiders = async () => {
      try {
        const res = await axios.get(BACKEND_URL, {
          timeout: 10000, // 10 segundos timeout
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (res.data && Array.isArray(res.data)) {
          const riders = res.data.map(r => {
            let sosColor = "green";
            if (r.tipo === "robo") sosColor = "red";
            else if (r.tipo === "pinchazo") sosColor = "yellow";
            else if (r.tipo === "normal") sosColor = "green";

            let tipoDisplay = r.tipo || "Activo";
            if (r.tipo === "normal") tipoDisplay = "Normal (SOS Cancelado)";

            // Formatear fecha y hora
            let fechaFormateada = "-";
            if (r.fechaHora) {
              try {
                const fecha = new Date(r.fechaHora);
                fechaFormateada = fecha.toLocaleString('es-ES', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });
              } catch (error) {
                fechaFormateada = r.fechaHora;
              }
            }

            const getStatusClass = (tipo) => {
              switch(tipo) {
                case 'robo': return 'status-robo';
                case 'pinchazo': return 'status-pinchazo';
                default: return 'status-normal';
              }
            };

            return {
              ...r,
              sosColor,
              popupContent: '<div class="custom-popup">' +
                '<div class="popup-title">🏍️ ' + (r.nombre || "Rider") + '</div>' +
                '<div class="popup-status ' + getStatusClass(r.tipo) + '">' + tipoDisplay + '</div>' +
                '<div class="popup-info"><strong>Moto:</strong> ' + (r.moto || "-") + '</div>' +
                '<div class="popup-info"><strong>Color:</strong> ' + (r.color || "-") + '</div>' +
                '<div class="popup-info"><strong>ID:</strong> ' + r.riderId + '</div>' +
                '<div class="popup-info"><strong>Última actualización:</strong> ' + fechaFormateada + '</div>' +
                '</div>'
            };
          });

          webviewRef.current?.postMessage(JSON.stringify(riders));
          setLoading(false);
        } else {
          console.warn("Respuesta del servidor no válida:", res.data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching riders:", err.message);
        
        // Solo mostrar error si no se ha mostrado recientemente
        const ultimoError = await AsyncStorage.getItem('ultimoErrorMapa');
        const ahora = Date.now();
        
        if (!ultimoError || (ahora - parseInt(ultimoError)) > 30000) { // 30 segundos
          webviewRef.current?.postMessage(JSON.stringify([{
            error: true,
            message: "Error de conexión con el servidor. Verifica que el backend esté funcionando."
          }]));
          await AsyncStorage.setItem('ultimoErrorMapa', ahora.toString());
        }
        
        setLoading(false);
      }
    };

    fetchRiders();
    const interval = setInterval(fetchRiders, 15000); // Aumentado a 15 segundos para reducir carga
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <style>
          #map { 
            height: 100vh; 
            width: 100%; 
            margin:0; 
            padding:0; 
            background: #f0f0f0;
          }
          .custom-popup {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
          }
          .popup-title {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
            border-bottom: 1px solid #eee;
            padding-bottom: 4px;
          }
          .popup-info {
            margin: 4px 0;
          }
          .popup-status {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            margin-bottom: 8px;
          }
          .status-robo { background-color: #e74c3c; }
          .status-pinchazo { background-color: #f39c12; }
          .status-normal { background-color: #27ae60; }
          .custom-marker {
            background: transparent !important;
            border: none !important;
          }
          .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .leaflet-popup-tip {
            background: white;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([-34.833, -58.449], 15);
          
          // Usar un tile layer más moderno
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
          }).addTo(map);

          let markers = {};

          function animateMarker(marker, newLatLng) {
            const start = marker.getLatLng();
            const end = newLatLng;
            const frames = 20;
            let i = 0;
            const interval = setInterval(() => {
              i++;
              const lat = start.lat + (end.lat - start.lat) * (i / frames);
              const lng = start.lng + (end.lng - start.lng) * (i / frames);
              marker.setLatLng([lat, lng]);
              if (i === frames) clearInterval(interval);
            }, 50);
          }

          function updateMarkers(riders) {
            // Verificar si hay error
            if (riders.length === 1 && riders[0].error) {
              console.error('Error en el mapa:', riders[0].message);
              // Mostrar mensaje de error en el mapa
              if (!window.errorMarker) {
                window.errorMarker = L.marker([-34.833, -58.449])
                  .addTo(map)
                  .bindPopup('<b>Error de Conexión</b><br/>' + riders[0].message)
                  .openPopup();
              }
              return;
            }

            // Limpiar marcador de error si existe
            if (window.errorMarker) {
              map.removeLayer(window.errorMarker);
              window.errorMarker = null;
            }

            const currentIds = new Set();

            riders.forEach(r => {
              if (!r.riderId) return; // Saltar si no hay riderId
              
              currentIds.add(r.riderId);

              // Crear marcador circular personalizado
              const createCustomIcon = (color, size = 20) => {
                const svgIcon = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24">' +
                  '<circle cx="12" cy="12" r="10" fill="' + color + '" stroke="white" stroke-width="3"/>' +
                  '<circle cx="12" cy="12" r="6" fill="white" opacity="0.8"/>' +
                  '<circle cx="12" cy="12" r="3" fill="' + color + '"/>' +
                  '</svg>';
                
                return L.divIcon({
                  html: svgIcon,
                  className: 'custom-marker',
                  iconSize: [size, size],
                  iconAnchor: [size/2, size/2]
                });
              };

              const getMarkerColor = (sosColor) => {
                switch(sosColor) {
                  case 'red': return '#e74c3c';
                  case 'yellow': return '#f39c12';
                  default: return '#27ae60';
                }
              };

              const markerColor = getMarkerColor(r.sosColor);
              const markerSize = (r.sosColor === 'red' || r.sosColor === 'yellow') ? 25 : 20;

              if (markers[r.riderId]) {
                animateMarker(markers[r.riderId], [r.lat, r.lng]);
                markers[r.riderId].setIcon(createCustomIcon(markerColor, markerSize));
                markers[r.riderId].getPopup().setContent(r.popupContent);
              } else {
                const marker = L.marker([r.lat, r.lng], { 
                  icon: createCustomIcon(markerColor, markerSize)
                })
                  .addTo(map)
                  .bindPopup(r.popupContent, {
                    className: 'custom-popup',
                    maxWidth: 300
                  });

                // Abrir popup automáticamente si SOS activo
                if (r.sosColor === "red" || r.sosColor === "yellow") {
                  marker.openPopup();
                }

                markers[r.riderId] = marker;
              }
            });

            Object.keys(markers).forEach(id => {
              if (!currentIds.has(id)) {
                map.removeLayer(markers[id]);
                delete markers[id];
              }
            });
          }

          document.addEventListener('message', function(event) {
            const riders = JSON.parse(event.data);
            updateMarkers(riders);
          });
        </script>
      </body>
    </html>
  `;

  return <WebView ref={webviewRef} originWhitelist={['*']} source={{ html }} style={styles.map} />;
}

const styles = StyleSheet.create({
  map: { flex: 1, width: "100%" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
