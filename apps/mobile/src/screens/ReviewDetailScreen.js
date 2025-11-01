// apps/mobile/src/screens/ReviewDetailScreen.js
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FancyReviewCard from '../components/FancyReviewCard';
import ReportModal from '../components/ReportModal';
import { useAuth } from '../services/AuthContext';
import { getReviewById } from '../services/reviewService';
import { EventBus } from '../utils/EventBus';

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

  const navigation = useNavigation();
  const {
    user,
    canAnonViewAnother, registerAnonReviewView,
    canAuthedViewAnother, registerAuthedReviewView
  } = useAuth();

  const [reportModalVisible, setReportModalVisible] = useState(false);

  // If navigated back with openReport param, open the modal automatically
  useEffect(() => {
    try {
      if (route?.params?.openReport) {
        setReportModalVisible(true);
        navigation.setParams?.({ openReport: false });
      }
    } catch (e) {
      // ignore
    }
  }, [route?.params?.openReport]);

  const openReportFlow = () => {
    if (!user?.id) {
      // Redirect to login; after login user can return manually or handle redirect param
      try { navigation.navigate('Login', { redirectTo: { type: 'report', reviewId } }); } catch (_) {}
      return;
    }
    setReportModalVisible(true);
  };

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
            await registerAuthedReviewView(user.id, reviewId);
            return;
          }

          // anon path
          const { allowed } = await canAnonViewAnother(reviewId);
          if (!active) return;
          if (!allowed) {
            navigation.replace('ReviewAccessGate', { reviewId });
            return;
          }
          
          if (reviewId) {
            console.log('[registerAuthedReviewView call]', { userId: user.id, reviewId });
            await registerAuthedReviewView(user.id, reviewId);
          }
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
      if (!reviewId || reviewId === '') {
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
        {/* Header card: concise, avoids repeating professor/course that the FancyReviewCard shows */}
        <View style={[styles.card, styles.headerCard]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Reseña</Text>
              <Text style={styles.subtitleSmall}>Publicada el {new Date(r?.created_at).toLocaleDateString('es-ES')}</Text>
            </View>

            <TouchableOpacity style={styles.reportPill} onPress={openReportFlow} accessibilityRole="button">
              <Text style={styles.reportPillText}>Reportar</Text>
            </TouchableOpacity>
          </View>

          {/* subtle meta row (trimester + author) */}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Trimestre {r?.trimester || '-'}</Text>
            </View>
            {r?.user?.full_name ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>Autor: {r.user.full_name}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Review content card */}
        <View style={[styles.card, styles.contentCard]}>
          <FancyReviewCard review={r} limited={false} />
        </View>
      </ScrollView>
      <ReportModal visible={reportModalVisible} onClose={() => setReportModalVisible(false)} reviewId={reviewId} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: COLORS.muted, marginTop: 8 },
  container: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: COLORS.muted, marginTop: 8 },

  /* base card */
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    // subtle elevation / shadow
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 }
    })
  },

  /* header */
  headerCard: { marginTop: 6, paddingVertical: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  subtitleSmall: { fontSize: 12, color: COLORS.muted, marginTop: 4 },

  reportPill: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F1B0AD',
  },
  reportPillText: { color: '#E53935', fontWeight: '700' },

  chipsRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  chip: { backgroundColor: '#F8FAFC', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: '#EFF3F7' },
  chipText: { color: COLORS.muted, fontSize: 13 },

  /* content */
  contentCard: { padding: 8 },

  /* details */
  meta: { paddingVertical: 14 },
  metaTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: COLORS.primary },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6' },
  metaLabel: { fontSize: 14, color: COLORS.muted },
  metaValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  bold: { fontWeight: '700' },
});
