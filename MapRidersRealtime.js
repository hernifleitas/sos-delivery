// MapRidersRealtimeOSM.js
import React, { useState, useEffect, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text, Linking } from "react-native";
import { WebView } from "react-native-webview";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';
import { getBackendURL } from "./config";

const RIDERS_ENDPOINT = `${getBackendURL()}/riders`;
const ALERTAS_ENDPOINT = `${getBackendURL()}/alertas`;

// Umbrales para considerar cambios significativos
const CHANGE_DISTANCE_METERS = 10; // no actualizar si el cambio es menor
const CHANGE_TIME_MS = 5000; // considerar cambio si la última actualización es reciente pero con movimiento

// Helpers geográficos
function toRad(v){ return (v * Math.PI) / 180; }
function haversineMeters(lat1, lon1, lat2, lon2){
  const R = 6371000; // m
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
function bearingDegrees(lat1, lon1, lat2, lon2){
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  let brng = Math.atan2(y, x) * 180 / Math.PI; // -180..+180
  brng = (brng + 360) % 360; // 0..360
  return brng;
}
function bearingToCardinal(deg){
  const dirs = ['N','NE','E','SE','S','SO','O','NO'];
  const idx = Math.round(deg / 45) % 8;
  return dirs[idx];
}

function hasSignificantChanges(prevArr, nextArr){
  try {
    if (!Array.isArray(prevArr) || !Array.isArray(nextArr)) return true;
    if (prevArr.length !== nextArr.length) return true;
    const prevMap = Object.fromEntries(prevArr.map(r => [r.riderId, r]));
    for (const r of nextArr){
      const p = prevMap[r.riderId];
      if (!p) return true;
      if (p.tipo !== r.tipo) return true;
      // si cambió la posición notablemente
      const dist = haversineMeters(p.lat, p.lng, r.lat, r.lng);
      if (dist >= CHANGE_DISTANCE_METERS) return true;
    }
    return false;
  } catch { return true; }
}

export default function MapRidersRealtimeOSM() {
  const [loading, setLoading] = useState(true);
  const webviewRef = useRef(null);
  const [webReady, setWebReady] = useState(false);
  const lastRidersRef = useRef(null);

  const fetchRiders = async () => {
    try {
      const [res, alertasRes] = await Promise.all([
        axios.get(RIDERS_ENDPOINT, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }),
        axios.get(ALERTAS_ENDPOINT, {
          timeout: 8000,
          headers: { 'Content-Type': 'application/json' }
        }).catch(() => ({ data: [] }))
      ]);
      
      if (res.data && Array.isArray(res.data)) {
        // Mapa de tipos activos por rider desde /alertas
        const tiposPorRider = {};
        if (alertasRes?.data && Array.isArray(alertasRes.data)) {
          alertasRes.data.forEach(a => {
            if (a?.riderId && a?.tipo) tiposPorRider[a.riderId] = a.tipo;
          });
        }

        // Crear mapa previo para cálculos de velocidad/dirección
        const prevById = Array.isArray(lastRidersRef.current)
          ? Object.fromEntries(lastRidersRef.current.map(r => [r.riderId, r]))
          : {};

        const riders = res.data.map(r => {
          // Si hay alerta activa para este rider, forzar ese tipo
          const tipoEfectivo = tiposPorRider[r.riderId] || r.tipo;

          let sosColor = "green";
          if (tipoEfectivo === "robo") sosColor = "red";
          else if (tipoEfectivo === "accidente") sosColor = "yellow";
          else if (tipoEfectivo === "pinchazo") sosColor = "yellow";
          else if (tipoEfectivo === "repartiendo") sosColor = "green";

          let tipoDisplay = "Repartiendo";
          switch (tipoEfectivo) {
            case 'robo': tipoDisplay = 'ROBO'; break;
            case 'accidente': tipoDisplay = 'ACCIDENTE'; break;
            case 'repartiendo': tipoDisplay = 'REPARTIENDO'; break;
            default: tipoDisplay = 'Repartiendo';
          }

          // Formatear fecha
          let fechaFormateada = "-";
          let fechaMillis = null;
          if (r.fechaHora) {
            try {
              const fecha = new Date(r.fechaHora);
              fechaMillis = fecha.getTime();
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

          // Calcular velocidad y dirección si existe previo válido
          let velocidadKmh = null;
          let rumboCardinal = null;
          const prev = prevById[r.riderId];
          if (prev && typeof prev.lat === 'number' && typeof prev.lng === 'number' && prev.fechaHora) {
            try {
              const distM = haversineMeters(prev.lat, prev.lng, r.lat, r.lng);
              const prevMs = new Date(prev.fechaHora).getTime();
              const dtH = Math.max( ( (fechaMillis || 0) - (prevMs || 0) ) / 3600000, 0 );
              velocidadKmh = (distM / 1000) / dtH;
              const brng = bearingDegrees(prev.lat, prev.lng, r.lat, r.lng);
              rumboCardinal = bearingToCardinal(brng);
            } catch {}
          }

          const extraInfo = [];
          if (typeof velocidadKmh === 'number' && isFinite(velocidadKmh)) {
            extraInfo.push(`<div class="popup-info"><strong>Velocidad:</strong> ${velocidadKmh.toFixed(1)} km/h</div>`);
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
            tipo: tipoEfectivo,
            sosColor,
            popupContent: '<div class="custom-popup">' +
              '<div class="popup-title"> ' + (r.nombre || "Rider") + '</div>' +
              '<div class="popup-status ' + getStatusClass(tipoEfectivo) + '">' + tipoDisplay + '</div>' +
              '<div class="popup-info"><strong>Moto:</strong> ' + (r.moto || "-") + '</div>' +
              '<div class="popup-info"><strong>Color:</strong> ' + (r.color || "-") + '</div>' +
              '<div class="popup-info"><strong>Última actualización:</strong> ' + fechaFormateada + '</div>' +
              extraInfo.join('') +
              '<div class="popup-actions" style="margin-top:8px;">' +
                '<button style="padding:6px 10px;background:#2ecc71;color:#fff;border:none;border-radius:6px;cursor:pointer;" ' +
                  'onclick="window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type: \'navigate\', lat: ' + Number(r.lat) + ', lng: ' + Number(r.lng) + '}))"' +
                '>Navegar</button>' +
              '</div>' +
              '</div>'
          };
        });

        // Guardar referencia local
        const hadSignificant = hasSignificantChanges(lastRidersRef.current, riders);
        lastRidersRef.current = riders;
        if (webReady && hadSignificant) {
          const payload = JSON.stringify(riders);
          webviewRef.current?.injectJavaScript(`window.updateRiders(${payload}); true;`);
        }
        setLoading(false);
      } else {
        console.warn("Respuesta del servidor no válida:", res.data);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching riders:", err.message);
      
      const ultimoError = await AsyncStorage.getItem('ultimoErrorMapa');
      const ahora = Date.now();
      
      if (!ultimoError || (ahora - parseInt(ultimoError)) > 30000) {
        const errorMsg = JSON.stringify([
          { error: true, message: "Error de conexión con el servidor. Verifica que el backend esté funcionando." }
        ]);
        if (webReady) {
          webviewRef.current?.postMessage(errorMsg);
        } else {
          lastRidersRef.current = [
            { error: true, message: "Error de conexión con el servidor. Verifica que el backend esté funcionando." }
          ];
        }
        await AsyncStorage.setItem('ultimoErrorMapa', ahora.toString());
      }
      
      setLoading(false);
    }
  };

  const onRecenterPress = async () => {
    try {
      // 1) Obtener ubicación actual del admin
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permiso de ubicación denegado');
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = pos?.coords?.latitude || -34.833;
      const lng = pos?.coords?.longitude || -58.449;

      // 2) Refrescar riders inmediatamente
      await fetchRiders();

      // 2.bis) Forzar actualización visual aunque no se detecten cambios significativos
      if (webReady && lastRidersRef.current) {
        const payload = JSON.stringify(lastRidersRef.current);
        webviewRef.current?.injectJavaScript(`window.updateRiders(${payload}); true;`);
      }

      // 3) Enviar comando al WebView para recentrar
      if (webReady) {
        webviewRef.current?.injectJavaScript(`window.recenter(${lat}, ${lng}, 15); true;`);
      }
    } catch (e) {
      console.warn('No se pudo recentrar:', e?.message);
    }
  };

  const onFitAllPress = async () => {
    try {
      if (webReady) {
        webviewRef.current?.injectJavaScript(`window.fitToAllRiders && window.fitToAllRiders(); true;`);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchRiders();
    const interval = setInterval(fetchRiders, 5000);
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
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
          }).addTo(map);

          let markers = {};

          function distanceMeters(a, b){
            const toRad = v => v * Math.PI / 180;
            const R = 6371000;
            const dLat = toRad(b.lat - a.lat);
            const dLng = toRad(b.lng - a.lng);
            const s = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2)**2;
            const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
            return R * c;
          }

          function animateMarker(marker, newLatLng) {
            try {
              // Limpiar animación previa si existe
              if (marker._animInt) { clearInterval(marker._animInt); marker._animInt = null; }
              const start = marker.getLatLng();
              const end = newLatLng;
              const dist = distanceMeters({lat:start.lat,lng:start.lng},{lat:end.lat,lng:end.lng});
              // Si el desplazamiento es mayor a 2km, setear directo para evitar animaciones largas
              if (dist > 2000) { marker.setLatLng(end); return; }
              // Si el desplazamiento es muy pequeño, ajustar directo
              if (dist < 0.5) { marker.setLatLng(end); return; }
              const frames = 20;
              let i = 0;
              marker._animInt = setInterval(() => {
                i++;
                const lat = start.lat + (end.lat - start.lat) * (i / frames);
                const lng = start.lng + (end.lng - start.lng) * (i / frames);
                marker.setLatLng([lat, lng]);
                if (i >= frames) {
                  clearInterval(marker._animInt);
                  marker._animInt = null;
                  // Asegurar posición final exacta
                  marker.setLatLng(end);
                }
              }, 50);
            } catch(e) { try { marker.setLatLng(newLatLng); } catch(_) {} }
          }

          function updateMarkers(riders) {
            if (riders.length === 1 && riders[0].error) {
              console.error('Error en el mapa:', riders[0].message);
              if (!window.errorMarker) {
                window.errorMarker = L.marker([-34.833, -58.449])
                  .addTo(map)
                  .bindPopup('<b>Error de Conexión</b><br/>' + riders[0].message)
                  .openPopup();
              }
              return;
            }

            if (window.errorMarker) {
              map.removeLayer(window.errorMarker);
              window.errorMarker = null;
            }

            const currentIds = new Set();

            riders.forEach(r => {
              if (!r.riderId) return;
              currentIds.add(r.riderId);

              const createCustomIcon = (color, size = 20) => {
                const svgIcon = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24">' +
                  '<circle cx="12" cy="12" r="10" fill="' + color + '" stroke="white" stroke-width="3"/>' +
                  '<circle cx="12" cy="12" r="6" fill="white" opacity="0.8"/>' +
                  '<circle cx="12" cy="12" r="3" fill="' + color + '"/>' +
                  '</svg>';
                return L.divIcon({ html: svgIcon, className: 'custom-marker', iconSize: [size, size], iconAnchor: [size/2, size/2] });
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
              const targetLatLng = L.latLng(Number(r.lat), Number(r.lng));

              if (markers[r.riderId]) {
                animateMarker(markers[r.riderId], targetLatLng);
                markers[r.riderId].setIcon(createCustomIcon(markerColor, markerSize));
                markers[r.riderId].getPopup().setContent(r.popupContent);
              } else {
                const marker = L.marker(targetLatLng, { icon: createCustomIcon(markerColor, markerSize) })
                  .addTo(map)
                  .bindPopup(r.popupContent, { className: 'custom-popup', maxWidth: 300 });
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

          // Fit bounds a todos los riders visibles
          window.fitToAllRiders = function(){
            try {
              const ids = Object.keys(markers);
              if (!ids.length) return;
              const group = L.featureGroup(ids.map(id => markers[id]));
              map.fitBounds(group.getBounds().pad(0.2));
            } catch(e) { console.error('fitToAllRiders error', e); }
          }

          // Funciones globales para que RN actualice marcadores o recentre
          window.updateRiders = function(riders){
            try {
              const data = Array.isArray(riders) ? riders : JSON.parse(riders);
              if (Array.isArray(data)) updateMarkers(data);
            } catch(e) { console.error('updateRiders error', e); }
          }
          window.recenter = function(lat, lng, zoom){
            try { map.setView([lat, lng], zoom || 15, { animate: true }); } catch(e) {}
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.map}
        onMessage={({ nativeEvent }) => {
          try {
            const msg = JSON.parse(nativeEvent.data || '{}');
            if (msg?.type === 'navigate' && typeof msg.lat === 'number' && typeof msg.lng === 'number') {
              const url = `https://www.google.com/maps/search/?api=1&query=${msg.lat},${msg.lng}`;
              Linking.openURL(url);
            }
          } catch (e) {}
        }}
        onLoadEnd={() => {
          setWebReady(true);
          if (lastRidersRef.current) {
            const payload = JSON.stringify(lastRidersRef.current);
            webviewRef.current?.injectJavaScript(`window.updateRiders(${payload}); true;`);
          }
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={onRecenterPress} activeOpacity={0.8}>
        <Text style={styles.fabText}>⟳</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.fabFit} onPress={onFitAllPress} activeOpacity={0.8}>
        <Text style={styles.fabText}>☍</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, width: "100%" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  fab: {
    position: 'absolute',
    right: 10,
    bottom: 220,
    backgroundColor: '#e74c3c',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  fabFit: {
    position: 'absolute',
    right: 70,
    bottom: 220,
    backgroundColor: '#34495e',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 22, fontWeight: 'bold' }
});
