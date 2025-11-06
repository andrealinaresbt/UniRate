import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { fetchIsAdmin } from '../services/AuthService';
import { useAuth } from '../services/AuthContext';
import { getFlaggedReviews, dismissReportsForReview } from '../services/reportService';
// NUEVO: utilidades para borrar reportes / restaurar / eliminar reseña
import { purgeReportsForReview, unhideReview, deleteReview } from '../services/reportService';

export default function AdminFlaggedReviews({ navigation }) {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => { fetchList(); }, []);

  const fetchList = async () => {
    setLoading(true);
    const res = await getFlaggedReviews();
    if (res.success) setReviews(res.data || []);
    else Alert.alert('Error', res.error || 'No se pudieron cargar las reseñas ocultadas');
    setLoading(false);
  };

  // === RESTAURAR: borra reportes y vuelve visible ===
  const handleRestore = async (reviewId) => {
    Alert.alert(
      'Restaurar reseña',
      'Se eliminarán todos los reportes de esta reseña y volverá a mostrarse. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, restaurar',
          onPress: async () => {
            try {
              setLoading(true);
              // si quieres mantener el "histórico", puedes dejar "dismiss"; pero aquí pediste **eliminar**
              await purgeReportsForReview(reviewId);
              await unhideReview(reviewId);
              Alert.alert('Hecho', 'Reseña restaurada y reportes eliminados.');
              await fetchList();
            } catch (e) {
              Alert.alert('Error', 'No se pudo restaurar la reseña.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // === ELIMINAR: borra reportes y borra la reseña ===
  const handleDelete = async (reviewId) => {
    Alert.alert(
      'Eliminar reseña',
      'Se eliminarán todos los reportes y la reseña será borrada permanentemente. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await purgeReportsForReview(reviewId);
              await deleteReview(reviewId);
              Alert.alert('Hecho', 'Reseña y reportes eliminados.');
              await fetchList();
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar la reseña.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (checking) return (
    <View style={s.center}><ActivityIndicator/><Text style={s.muted}>Verificando permisos…</Text></View>
  );

  if (!isAdmin) return (
    <View style={s.center}><Text style={s.block}>Acceso restringido.</Text><Text style={s.muted}>Solo administradores.</Text></View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 12 }}>
      <Text style={s.h1}>Reseñas ocultadas automáticamente</Text>
      {loading && <ActivityIndicator />}
      <FlatList
        data={reviews}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={{ flex: 1 }}>
              <Text style={s.score}>ID: {item.id} — {item.courses?.name || 'Sin materia'}</Text>
              <Text style={s.comment}>{item.comment || item.comment}</Text>
              <Text style={s.meta}>Reportes: {item.reports_count} — Profesor: {item.professors?.full_name || 'N/A'}</Text>
              {Array.isArray(item.reports) && item.reports.slice(0,3).map((rep) => (
                <Text key={rep.id} style={s.reportRow}>• {rep.reason} — {rep.status || 'pending'}</Text>
              ))}
            </View>

            {/* NUEVO: dos botones */}
            <View style={{ justifyContent: 'center', gap: 8 }}>
              <TouchableOpacity style={s.btnOk} onPress={() => handleRestore(item.id)}>
                <Text style={s.btnTxt}>Restaurar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnDanger} onPress={() => handleDelete(item.id)}>
                <Text style={s.btnTxt}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={{ padding: 24 }}><Text style={s.muted}>No hay reseñas ocultadas actualmente.</Text></View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 20, fontWeight: '800', marginBottom: 12, color: '#111827' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  block: { fontSize: 18, fontWeight: '700', color: '#111827' },
  muted: { color: '#6b7280' },
  card: { padding: 12, borderWidth: 1, borderColor: '#eef2ff', borderRadius: 12, marginBottom: 10, flexDirection: 'row', gap: 12, backgroundColor: '#fff' },
  score: { fontWeight: '700', color: '#111827' },
  comment: { color: '#374151', marginTop: 6 },
  meta: { color: '#6b7280', marginTop: 8 },
  reportRow: { color: '#6b7280', fontSize: 13 },
  btnOk: { backgroundColor: '#10b981', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, minWidth: 108, alignItems: 'center' },
  btnDanger: { backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, minWidth: 108, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '700' }
});
