import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useAuth } from '../services/AuthContext';
import { getReviews } from '../services/reviewService';
import ReviewCard from '../components/ReviewCard';
import { useIsFocused } from '@react-navigation/native';
import { EventBus } from '../utils/EventBus';

export default function MyReviewsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const isFocused = useIsFocused();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!user?.id) {
      console.log('[MyReviews] no user id yet, skipping load');
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const res = await getReviews({ user_id: user.id, limit: 100, orderBy: 'created_at', order: 'desc' });
      console.log('[MyReviews] load res for user', user.id, res);
      if (res.success) {
        setItems(res.data || []);
      } else {
        setItems([]);
        setError(res.error || 'Error cargando reseñas');
      }
    } catch (e) {
      console.error('[MyReviews] load error', e);
      setItems([]);
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    if (isFocused && mounted) load();
    // subscribe to events to refresh immediately
    const off1 = EventBus.on('review:created', () => { if (mounted) load(); });
    const off2 = EventBus.on('review:updated', () => { if (mounted) load(); });
    const off3 = EventBus.on('review:deleted', () => { if (mounted) load(); });

    return () => { mounted = false; off1(); off2(); off3(); };
  }, [isFocused, load]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Mis reseñas</Text>
      {error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => <ReviewCard review={item} />}
          ListEmptyComponent={<Text style={styles.empty}>No has publicado reseñas todavía.</Text>}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#F6F7F8' },
  title: { fontSize: 22, fontWeight: '800', color: '#003087', marginBottom: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: '#8A93A2', marginTop: 24 },
});
