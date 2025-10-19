import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useAuth } from '../services/AuthContext';
import { getReviews } from '../services/reviewService';
import ReviewCard from '../components/ReviewCard';

export default function MyReviewsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      if (!user?.id) {
        if (mounted) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      const res = await getReviews({ user_id: user.id, limit: 100, orderBy: 'created_at', order: 'desc' });
      if (!mounted) return;
      if (res.success) setItems(res.data || []);
      else setItems([]);
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [user?.id]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Mis reseñas</Text>

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
