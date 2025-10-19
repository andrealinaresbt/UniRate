// components/ReviewCard.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { deleteReview } from '../services/reviewService';
import { EventBus } from '../utils/EventBus';
import { MaterialIcons as Icon } from '@expo/vector-icons';

// Ensure icon font is loaded (helps in bare RN environments)
try { Icon.loadFont && Icon.loadFont(); } catch (e) { /* ignore */ }

const COLORS = {
  border: '#E0E3E7',
  text: '#1A1A1A',
  muted: '#8A93A2',
  primary: '#003087',
};

export default function ReviewCard({ review, limited = false }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const profName = review?.professors?.full_name || 'Profesor';
  const courseName = review?.courses?.name || 'Materia';
  const created = review?.created_at ? new Date(review.created_at).toLocaleDateString() : '';
  const comment = limited ? '🔒 Inicia sesión para ver el comentario completo.' : (review?.comentario || '—');

  const isOwner = !!(user?.id && review?.user_id && user.id === review.user_id);

  const handlePress = () => {
    if (!review?.id) return;
    navigation.navigate('ReviewDetail', { reviewId: review.id });
  };

  const handleEdit = () => {
    setMenuOpen(false);
    navigation.navigate('NuevaResena', { editReview: review });
  };

  const handleDelete = () => {
    setMenuOpen(false);
    Alert.alert('Confirmar', '¿Eliminar esta reseña?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const res = await deleteReview(review.id);
        if (res?.success) {
          Alert.alert('Eliminado', 'La reseña fue eliminada.');
          EventBus.emit('review:deleted', { id: review.id });
          // If we are on a detail screen, try to go back; otherwise lists will refresh via EventBus
          try { navigation.goBack(); } catch (_) {}
        } else {
          Alert.alert('Error', res?.error || 'No se pudo eliminar.');
        }
      }}
    ]);
  };

  return (
    <Pressable style={styles.card} onPress={handlePress} android_ripple={{ color: '#eee' }}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.header}>{courseName}</Text>
          <Text style={styles.subheader}>{profName} • {created}</Text>
        </View>

        {isOwner && (
          <TouchableOpacity
            onPress={(e) => { e?.stopPropagation?.(); setMenuOpen(true); }}
            style={styles.dotButton}
            activeOpacity={0.7}
          >
            <Icon name="more-vert" size={22} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.rowStats}>
        <Text style={styles.badge}>Calidad: {review?.calidad ?? '-'}</Text>
        <Text style={styles.badge}>Dificultad: {review?.dificultad ?? '-'}</Text>
        <Text style={styles.badge}>Volvería: {review?.volveria ? 'Sí' : 'No'}</Text>
      </View>

      <Text style={[styles.comment, limited && { color: COLORS.muted }]}>{comment}</Text>

      {/* Bottom sheet menu */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <TouchableOpacity style={[styles.sheetItem, styles.sheetItemPrimary]} onPress={handleEdit}>
              <Icon name="edit" size={20} color={COLORS.primary} style={styles.sheetIcon} />
              <Text style={[styles.sheetText, styles.sheetTextPrimary]}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.sheetItem, styles.sheetItemDanger]} onPress={handleDelete}>
              <Icon name="delete" size={20} color="#E53935" style={styles.sheetIcon} />
              <Text style={[styles.sheetText, styles.sheetTextDanger]}>Eliminar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.sheetItem, styles.sheetItemCancel]} onPress={() => setMenuOpen(false)}>
              <Icon name="close" size={20} color="#666" style={styles.sheetIcon} />
              <Text style={[styles.sheetText, styles.sheetTextCancel]}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </Pressable>
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
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  header: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  subheader: { fontSize: 12, color: COLORS.muted, marginBottom: 8 },
  rowStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  badge: { fontSize: 12, color: COLORS.text, backgroundColor: '#F6F7F8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  comment: { fontSize: 14, color: COLORS.text },

  dotButton: { padding: 6, borderRadius: 8 },

  // bottom sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 14, borderTopRightRadius: 14, paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E6E6E6', borderRadius: 2, alignSelf: 'center', marginVertical: 8 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#F4F4F4' },
  sheetIcon: { marginRight: 12 },
  sheetText: { fontSize: 16, color: '#222' },
  sheetItemPrimary: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.primary, marginHorizontal: 16, borderRadius: 8 },
  sheetTextPrimary: { color: COLORS.primary, fontWeight: '600' },
  sheetItemDanger: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E53935', marginHorizontal: 16, borderRadius: 8, marginTop: 10 },
  sheetTextDanger: { color: '#E53935', fontWeight: '600' },
  sheetItemCancel: { backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginTop: 12 },
  sheetTextCancel: { color: '#666', fontWeight: '600' },
});
