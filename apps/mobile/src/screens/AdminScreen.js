// screens/AdminScreen.js
import React from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../services/AuthContext';

export default function AdminScreen({ navigation }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  // Validamos con el booleano REAL de tu tabla: has_unlimited_access
  if (!user || !user.has_unlimited_access) {
    return (
      <View style={styles.center}>
        <Text>Acceso restringido. Solo administradores.</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Panel de Administración</Text>
      <Button title="Crear Profesor" onPress={() => navigation.navigate('CreateProfessor')} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
});

