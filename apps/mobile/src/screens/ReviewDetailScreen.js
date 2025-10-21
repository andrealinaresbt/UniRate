// apps/mobile/src/screens/ReviewDetailScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { getReviewById } from '../services/reviewService';
import { EventBus } from '../utils/EventBus';
import FancyReviewCard from '../components/FancyReviewCard';
import { useAuth } from '../services/AuthContext';

const COLORS = {
  bg: '#F6F7F8',
  white: '#FFFFFF',
  text: '#1A1A1A',
  muted: '#6B7280',
  primary: '#003087',
  border: '#E5E7EB'
};

export default function ReviewDetailScreen() {
  const route = useRoute();
  const { reviewId } = route.params || {};

  // added hooks
  const navigation = useNavigation();
  const {
    user,
    canAnonViewAnother, registerAnonReviewView,
    canAuthedViewAnother, registerAuthedReviewView
  } = useAuth();

  // gate: handle both authed and anon limits, replace to gate when blocked
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      (async () => {
        try {
          // authed path
          if (user?.id) {
            const { allowed } = await canAuthedViewAnother(user.id);
            if (!active) return;
            if (!allowed) {
              navigation.replace('ReviewAccessGate', { reviewId });
              return;
            }
            await registerAuthedReviewView(user.id);
            return;
          }

          // anon path
          const { allowed } = await canAnonViewAnother(reviewId);
          if (!active) return;
          if (!allowed) {
            navigation.replace('ReviewAccessGate', { reviewId });
            return;
          }
          await registerAnonReviewView(reviewId);
        } catch (err) {
          console.error('view gate error:', err);
        }
      })();
      return () => { active = false; };
    }, [user?.id, reviewId, navigation, canAnonViewAnother, registerAnonReviewView, canAuthedViewAnother, registerAuthedReviewView])
  );

  const [state, setState] = useState({ loading: true, error: null, review: null });

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!reviewId) {
        setState({ loading: false, error: 'No se recibió un ID de reseña.', review: null });
        return;
      }
      const res = await getReviewById(reviewId);
      if (!mounted) return;
      if (!res.success) setState({ loading: false, error: res.error || 'Error cargando la reseña', review: null });
      else setState({ loading: false, error: null, review: res.data });
    })();
    const off = EventBus.on('review:updated', ({ id } = {}) => {
      if (!mounted) return;
      if (id && id === reviewId) {
        (async () => {
          const r = await getReviewById(reviewId);
          if (!mounted) return;
          if (r.success) setState({ loading: false, error: null, review: r.data });
        })();
      }
    });

    return () => { mounted = false; off(); };
  }, [reviewId]);

  if (state.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando reseña...</Text>
      </View>
    );
  }
  if (state.error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>{state.error}</Text>
      </View>
    );
  }

  const r = state.review;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Reseña completa</Text>
          <Text style={styles.subtitle}>
            {(r?.professors?.full_name || 'Profesor')} · {(r?.courses?.code || '')} {(r?.courses?.name || '')}
          </Text>
          <Text style={styles.subtitleSmall}>
            Publicada el {new Date(r?.created_at).toLocaleDateString('es-ES')} · Trimestre {r?.trimester || '-'}
          </Text>
        </View>

        <View style={styles.card}>
          <FancyReviewCard review={r} limited={false} />
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaTitle}>Detalles</Text>
          <Text style={styles.metaRow}>Satisfacción: <Text style={styles.bold}>{r?.score ?? '-'}</Text></Text>
          <Text style={styles.metaRow}>Dificultad: <Text style={styles.bold}>{r?.difficulty ?? '-'}</Text></Text>
          <Text style={styles.metaRow}>¿La tomaría de nuevo?: <Text style={styles.bold}>{r?.would_take_again ? 'Sí' : 'No'}</Text></Text>
          {r?.user?.full_name ? (
            <Text style={styles.metaRow}>Autor: <Text style={styles.bold}>{r.user.full_name}</Text></Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: COLORS.muted, marginTop: 8 },
  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: 14, color: COLORS.text, marginTop: 4 },
  subtitleSmall: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 8, marginTop: 6 },
  meta: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginTop: 12 },
  metaTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, color: COLORS.primary },
  metaRow: { fontSize: 14, color: COLORS.text, marginBottom: 4 },
  bold: { fontWeight: '700' },
});
