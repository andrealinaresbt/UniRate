// apps/mobile/src/screens/AdminScreen.js
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useAuth } from '../services/AuthContext';

const Card = ({ emoji, title, subtitle, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [
    styles.card, pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 }
  ]}>
    <View style={styles.cardEmojiWrap}><Text style={styles.cardEmoji}>{emoji}</Text></View>
    <View style={{ flex: 1 }}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
    </View>
    <Text style={styles.cardArrow}>›</Text>
  </Pressable>
);

export default function AdminScreen({ navigation }) {
  const { user, loading } = useAuth();

  if (loading) return <View style={styles.center}><Text style={{ opacity: 0.6 }}>Cargando…</Text></View>;
  if (!user || !user.has_unlimited_access)
    return <View style={styles.center}><Text>Acceso restringido. Solo administradores.</Text></View>;

  const name = user.full_name || user.name || user.email || 'Admin';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerHi}>Hola,</Text>
        <Text style={styles.headerName}>{name}</Text>
        <Text style={styles.headerSub}>Panel de administración</Text>
      </View>

      <Text style={styles.sectionTitle}>Gestión</Text>
      <Card emoji="👨‍🏫" title="Crear Profesor" subtitle="Añade un nuevo profesor" onPress={() => navigation.navigate('CreateProfessor')} />
      <Card emoji="📘"   title="Crear Materia"   subtitle="Registra una nueva asignatura" onPress={() => navigation.navigate('CreateCourse')} />

      <Text style={styles.sectionTitle}>Relaciones</Text>
      <Card
        emoji="🔗"
        title="Conectar / Desconectar"
        subtitle="Vincula materias con profesores"
        onPress={() => navigation.navigate('ManageLinks')}
      />

      <Text style={styles.sectionTitle}>Utilidades</Text>
      <Card emoji="📊" title="Reportes (pronto)" subtitle="Métricas y estadísticas" onPress={() => {}} />
      <Card emoji="⚙️" title="Configuración (pronto)" subtitle="Permisos y políticas" onPress={() => {}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },

  header: { backgroundColor: '#0F172A', borderRadius: 16, padding: 18, marginBottom: 18 },
  headerHi: { color: '#9CA3AF', fontSize: 14 },
  headerName: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: 2 },
  headerSub: { color: '#CBD5E1', marginTop: 6 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 10, marginTop: 6 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  cardEmojiWrap: { backgroundColor: '#F1F5F9', width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardEmoji: { fontSize: 22 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  cardArrow: { fontSize: 28, color: '#94A3B8', marginLeft: 8 },
});
