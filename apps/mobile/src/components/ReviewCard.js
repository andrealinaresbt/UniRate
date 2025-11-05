// components/ReviewCard.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { deleteReview } from '../services/reviewService';
import { VoteService } from '../services/voteService';
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
  
  // Vote state
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [votingInProgress, setVotingInProgress] = useState(false);

  const profName = review?.professors?.full_name || 'Profesor';
  const courseName = review?.courses?.name || 'Materia';
  const created = review?.created_at ? new Date(review.created_at).toLocaleDateString() : '';
  const comment = limited ? '🔒 Inicia sesión para ver el comentario completo.' : (review?.comentario || '—');

  const isOwner = !!(user?.id && review?.user_id && user.id === review.user_id);

  // Load vote status on mount
  useEffect(() => {
    loadVoteStatus();
  }, [review?.id, user?.id]);

  const loadVoteStatus = async () => {
    if (!review?.id) return;
    
    try {
      // Get vote count
      const count = await VoteService.getVoteCount(review.id);
      setVoteCount(count);

      // Check if current user has voted (only if logged in)
      if (user?.id) {
        const voted = await VoteService.hasUserVoted(review.id, user.id);
        setHasVoted(voted);
      }
    } catch (error) {
      console.error('Error loading vote status:', error);
    }
  };

  const handleVote = async (e) => {
    e?.stopPropagation?.();
    
    console.log('handleVote pressed', { userId: user?.id, reviewId: review?.id });
// before the not-logged guard
if (!user?.id) {
  console.log('handleVote: not logged in -> showing alert');
  Alert.alert('Inicia sesión XYZ', 'texto único XYZ');
  return;
}

    if (!review?.id) return;

    if (votingInProgress) return; // Prevent double-clicks

    setVotingInProgress(true);

    // Optimistic UI update
    const previousHasVoted = hasVoted;
    const previousVoteCount = voteCount;
    
    setHasVoted(!hasVoted);
    setVoteCount(hasVoted ? voteCount - 1 : voteCount + 1);

    try {
      const result = await VoteService.toggleVote(review.id, user.id);
      
      if (result.success) {
        // Update with actual values from server
        setHasVoted(result.voted);
        setVoteCount(result.voteCount);
      } else {
        // Revert optimistic update on error
        setHasVoted(previousHasVoted);
        setVoteCount(previousVoteCount);
        Alert.alert('Error', result.error || 'No se pudo registrar tu voto. Intenta de nuevo.');
      }
    } catch (error) {
      // Revert optimistic update on error
      setHasVoted(previousHasVoted);
      setVoteCount(previousVoteCount);
      console.error('Error voting:', error);
      Alert.alert('Error', 'No se pudo registrar tu voto. Intenta de nuevo.');
    } finally {
      setVotingInProgress(false);
    }
  };

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

      {/* Vote button */}
      {!limited && (
        <View style={styles.voteSection}>
          <TouchableOpacity
            style={styles.voteButton}
            onPress={handleVote}
            disabled={votingInProgress}
            activeOpacity={0.7}
          >
            <Icon 
              name={hasVoted ? "thumb-up" : "thumb-up-off-alt"} 
              size={18} 
              color={hasVoted ? COLORS.primary : COLORS.muted} 
            />
            <Text style={[styles.voteText, hasVoted && styles.voteTextActive]}>
              Útil
            </Text>
          </TouchableOpacity>
          {voteCount > 0 && (
            <Text style={styles.voteCount}>
              {voteCount} {voteCount === 1 ? 'persona encontró' : 'personas encontraron'} esto útil
            </Text>
          )}
        </View>
      )}

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
  comment: { fontSize: 14, color: COLORS.text, marginBottom: 8 },

  dotButton: { padding: 6, borderRadius: 8 },

  // Vote section
  voteSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F6F7F8',
    marginRight: 12,
  },
  voteText: {
    fontSize: 13,
    color: COLORS.muted,
    marginLeft: 6,
    fontWeight: '500',
  },
  voteTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  voteCount: {
    fontSize: 12,
    color: COLORS.muted,
    flex: 1,
  },

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
