// apps/mobile/src/screens/AdminScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../services/AuthContext';
import { fetchIsAdmin } from '../services/AuthService';

const Tile = ({ emoji, title, subtitle, onPress, borderColor = '#1f6feb' }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [
    styles.tile, { borderColor }, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
  ]}>
    <Text style={styles.tileEmoji}>{emoji}</Text>
    <View style={{ flex: 1 }}>
      <Text style={styles.tileTitle}>{title}</Text>
      {subtitle ? <Text style={styles.tileSub}>{subtitle}</Text> : null}
    </View>
    <Text style={styles.tileArrow}>›</Text>
  </Pressable>
);

export default function AdminScreen({ navigation }) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ok = await fetchIsAdmin(user?.email || '');
        if (alive) setIsAdmin(!!ok);
      } finally { if (alive) setChecking(false); }
    })();
    return () => { alive = false; };
  }, [user?.email]);

  if (loading || checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Verificando permisos…</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.block}>Acceso restringido.</Text>
        <Text style={styles.muted}>Solo administradores pueden gestionar profesores y materias.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: '#fff', flexGrow: 1 }}>
      <Text style={styles.h1}>Panel de Administración</Text>

      <Text style={styles.h2}>Profesores</Text>
      <Tile emoji="🧑‍🏫" title="Crear Profesor" subtitle="Formulario con validaciones" onPress={() => navigation.navigate('CreateProfessor')} />
      <Tile emoji="✏️" title="Modificar Profesor" subtitle="Precarga + validaciones" borderColor="#f59e0b" onPress={() => navigation.navigate('EditProfessor')} />
      <Tile emoji="🗑️" title="Eliminar Profesor" subtitle="Borrado en cascada" borderColor="#dc2626" onPress={() => navigation.navigate('DeleteProfessor')} />

      <View style={{ height: 18 }} />

      <Text style={styles.h2}>Materias</Text>
      <Tile emoji="📚" title="Crear Materia" subtitle="Validaciones y guardado" onPress={() => navigation.navigate('CreateCourse')} />
      <Tile emoji="✏️" title="Modificar Materia" subtitle="Precarga + código único" borderColor="#f59e0b" onPress={() => navigation.navigate('EditCourse')} />
      <Tile emoji="🗑️" title="Eliminar Materia" subtitle="Borrado en cascada" borderColor="#dc2626" onPress={() => navigation.navigate('DeleteCourse')} />

      <View style={{ height: 18 }} />

      <Text style={styles.h2}>Vínculos</Text>
      <Tile emoji="🔗" title="Vincular Materias ↔ Profesores" subtitle="Alta/Baja de relaciones" onPress={() => navigation.navigate('ManageLinks')} />

      <View style={{ height: 18 }} />

      <Text style={styles.h2}>Usuario</Text>
      <Tile emoji="⭐" title="Mis reseñas" subtitle="Historial de tus reseñas" onPress={() => navigation.navigate('myReviews')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h1: { color: '#111827', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  h2: { color: '#374151', fontSize: 16, fontWeight: '700', marginBottom: 8, marginTop: 12 },
  tile: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  tileEmoji: { fontSize: 22, marginRight: 8 },
  tileTitle: { color: '#111827', fontSize: 16, fontWeight: '700' },
  tileSub: { color: '#6b7280', fontSize: 12 },
  tileArrow: { color: '#9ca3af', fontSize: 28, marginLeft: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#fff' },
  block: { color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  muted: { color: '#6b7280', textAlign: 'center' },
});
