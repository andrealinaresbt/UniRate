// components/ReviewCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  border: '#E0E3E7',
  text: '#1A1A1A',
  muted: '#8A93A2',
  primary: '#003087',
};

export default function ReviewCard({ review, limited = false }) {
  const navigation = useNavigation();
  const profName = review?.professors?.full_name || 'Profesor';
  const courseName = review?.courses?.name || 'Materia';
  const created = review?.created_at ? new Date(review.created_at).toLocaleDateString() : '';

  const comment = limited
    ? '🔒 Inicia sesión para ver el comentario completo.'
    : (review?.comentario || '—');

  const handlePress = () => {
    if (!review?.id) return;
    navigation.navigate('ReviewDetail', { reviewId: review.id });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
      <Text style={styles.header}>{courseName}</Text>
      <Text style={styles.subheader}>{profName} • {created}</Text>

      <View style={styles.row}>
        <Text style={styles.badge}>Calidad: {review?.calidad ?? '-'}</Text>
        <Text style={styles.badge}>Dificultad: {review?.dificultad ?? '-'}</Text>
        <Text style={styles.badge}>Volvería: {review?.volveria ? 'Sí' : 'No'}</Text>
      </View>

      <Text style={[styles.comment, limited && { color: COLORS.muted }]}>{comment}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  header: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  subheader: { fontSize: 12, color: COLORS.muted, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  badge: {
    fontSize: 12,
    color: COLORS.text,
    backgroundColor: '#F6F7F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comment: { fontSize: 14, color: COLORS.text },
});
