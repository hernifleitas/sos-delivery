import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { iniciarUbicacionBackground } from "./tasks";

export default function App() {
  const [nombre, setNombre] = useState("");
  const [moto, setMoto] = useState("");
  const [registrado, setRegistrado] = useState(false);
  const [sosActivo, setSosActivo] = useState(false);
  const [contador, setContador] = useState(0);

  const intervaloSOS = useRef(null); // 🔹 guardar setInterval

  useEffect(() => {
    const cargarDatos = async () => {
      const datos = await AsyncStorage.getItem("usuario");
      if (datos) {
        const { nombre, moto } = JSON.parse(datos);
        setNombre(nombre);
        setMoto(moto);
        setRegistrado(true);
      }
    };
    cargarDatos();
    iniciarUbicacionBackground();
  }, []);

  // Control del contador SOS
  useEffect(() => {
    let timer;
    if (contador > 0) {
      timer = setTimeout(() => setContador(contador - 1), 1000);
    } else if (contador === 0 && sosActivo) {
      // Se terminó la cuenta regresiva → iniciar envíos periódicos
      enviarUbicacionSOS(); // enviar inmediatamente
      intervaloSOS.current = setInterval(() => {
        enviarUbicacionSOS();
      }, 60000); // cada 1 minuto
    }
    return () => clearTimeout(timer);
  }, [contador, sosActivo]);

  const registrar = async () => {
    if (!nombre || !moto) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    await AsyncStorage.setItem("usuario", JSON.stringify({ nombre, moto }));
    setRegistrado(true);
  };

  const activarSOS = async () => {
  setSosActivo(true);
  setContador(30);

  // Guardar estado en AsyncStorage para que el background task lo lea
  await AsyncStorage.setItem("sosActivo", "true");
  await AsyncStorage.setItem("nombre", nombre);
  await AsyncStorage.setItem("moto", moto);
};

const cancelarSOS = async () => {
  setSosActivo(false);
  setContador(0);
  await AsyncStorage.setItem("sosActivo", "false");

  Alert.alert("Cancelado", "El SOS fue cancelado");
};

  const enviarUbicacionSOS = async () => {
    try {
      const ubicacionString = await AsyncStorage.getItem("ultimaUbicacion");
      let ubicacion = { lat: 0, lng: 0 };
      if (ubicacionString) ubicacion = JSON.parse(ubicacionString);

      const fechaHora = new Date().toLocaleString();

      await axios.post("http://192.168.1.33:4000/sos", {
        nombre,
        moto,
        ubicacion,
        fechaHora,
      });

      console.log("Ubicación enviada:", fechaHora);
    } catch (err) {
      console.error("Error enviando SOS:", err);
    }
  };

  if (!registrado) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Registro</Text>
        <TextInput
          placeholder="Tu nombre"
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
        />
        <TextInput
          placeholder="Tu moto"
          style={styles.input}
          value={moto}
          onChangeText={setMoto}
        />
        <Button title="Guardar" onPress={registrar} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hola, {nombre}</Text>
      {!sosActivo ? (
        <Button title="🚨 Activar SOS" color="red" onPress={activarSOS} />
      ) : (
        <View>
          {contador > 0 ? (
            <Text style={{ fontSize: 18, marginBottom: 10 }}>
              Enviando SOS en {contador}s
            </Text>
          ) : (
            <Text style={{ fontSize: 18, marginBottom: 10 }}>
              SOS activo - ubicación enviada cada 1 minuto
            </Text>
          )}
          <Button title="❌ Cancelar SOS" onPress={cancelarSOS} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 15, width: "100%" },
});
