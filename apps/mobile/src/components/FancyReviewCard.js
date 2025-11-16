import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../services/AuthContext';
import { VoteService } from '../services/voteService';

const COLORS = {
  bg: '#F6F7F8',
  white: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  primary: '#003087',   
  accent: '#FF8200',    
  border: '#E5E7EB',
  good: '#10B981',
  warn: '#F59E0B',
  bad:  '#EF4444',
};

function Stars({ value = 0, max = 5, size = 16 }) {
  const v = Math.max(0, Math.min(max, Number(value) || 0));
  const full = Math.round((v / max) * 5);
  return (
    <Text style={{ fontSize: size, lineHeight: size + 2, color: COLORS.accent }}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </Text>
  );
}

function Bar({ value = 0, max = 5 }) {
  const pct = Math.max(0, Math.min(100, (Number(value) || 0) / max * 100));
  let barColor = COLORS.warn;
  if (value <= 2) barColor = COLORS.good;
  if (value >= 4) barColor = COLORS.bad;
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
    </View>
  );
}

export default function FancyReviewCard({ review }) {

  if (review?.hidden) {
    return (
      <View style={styles.card}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center' }}>Esta reseña ha sido ocultada por múltiples reportes y está bajo revisión.</Text>
        <Text style={{ color: COLORS.muted, marginTop: 8, textAlign: 'center' }}>Si crees que esto es un error, contacta a soporte.</Text>
      </View>
    );
  }

  const navigation = useNavigation();
  const { user } = useAuth();
  
  // Vote state
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [votingInProgress, setVotingInProgress] = useState(false);


  const prof = review?.professors?.full_name || 'Profesor';
  const courseCode = review?.courses?.code || '';
  const courseName = review?.courses?.name || 'Materia';
  const created = review?.created_at ? new Date(review.created_at).toLocaleDateString('es-ES') : '-';
  const trimester = review?.trimester || review?.term || '-';
  const score = review?.score ?? review?.calidad ?? 0;
  const difficulty = review?.difficulty ?? review?.dificultad ?? 0;
  const again = !!(review?.would_take_again ?? review?.volveria);
  const comment = review?.comment ?? review?.comentario ?? '';

  // Load vote status on mount
  useEffect(() => {
    loadVoteStatus();
  }, [review?.id, user?.id]);

  const loadVoteStatus = async () => {
    if (!review?.id) return;
    
    try {
      const count = await VoteService.getVoteCount(review.id);
      setVoteCount(count);

      if (user?.id) {
        const voted = await VoteService.hasUserVoted(review.id, user.id);
        setHasVoted(voted);
      }
    } catch (error) {
      console.error('Error loading vote status:', error);
    }
  };

  const handleVote = async () => {
    if (!user?.id) {
      // navigate to Login and include redirect so the app can return to this review after auth
      try {
        navigation.navigate('Login', { redirectTo: { type: 'vote', reviewId: review?.id } });
      } catch (_) {
        try { navigation.navigate('SignIn', { redirectTo: { type: 'vote', reviewId: review?.id } }); } catch (__ ) {}
      }
      return;
    }

    if (!review?.id) return;
    if (votingInProgress) return;

    setVotingInProgress(true);

    // Optimistic UI update
    const previousHasVoted = hasVoted;
    const previousVoteCount = voteCount;
    
    setHasVoted(!hasVoted);
    setVoteCount(hasVoted ? voteCount - 1 : voteCount + 1);

    try {
      const result = await VoteService.toggleVote(review.id, user.id);
      
      if (result.success) {
        setHasVoted(result.voted);
        setVoteCount(result.voteCount);
      } else {
        setHasVoted(previousHasVoted);
        setVoteCount(previousVoteCount);
        Alert.alert('Error', result.error || 'No se pudo registrar tu voto.');
      }
    } catch (error) {
      setHasVoted(previousHasVoted);
      setVoteCount(previousVoteCount);
      console.error('Error voting:', error);
      Alert.alert('Error', 'No se pudo registrar tu voto.');
    } finally {
      setVotingInProgress(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{prof}</Text>
          <Text style={styles.subtitle}>
            {courseCode ? `${courseCode} · ` : ''}{courseName}
          </Text>
        </View>
        <View style={styles.badgeScore}>
          <Text style={styles.badgeScoreValue}>{Number(score).toFixed(1)}</Text>
          <Text style={styles.badgeScoreLabel}>Calidad</Text>
        </View>
      </View>

      {/* Meta */}
      <View style={styles.metaRow}>
        <View style={[styles.chip, again ? styles.chipOk : styles.chipWarn]}>
          <Text style={[styles.chipText, { color: again ? '#065F46' : '#78350F' }]}>
            {again ? 'La tomaría de nuevo' : 'No la tomaría de nuevo'}
          </Text>
        </View>
      </View>

      {/* Satisfacción y Dificultad */}
      <View style={styles.section}>
        <View style={styles.kv}>
          <Text style={styles.kvLabel}>Satisfacción</Text>
          <View style={styles.kvValueRow}>
            <Stars value={score} />
            <Text style={styles.kvValueNote}>{Number(score).toFixed(1)}/5</Text>
          </View>
        </View>

        <View style={[styles.kv, { marginTop: 12 }]}>
          <Text style={styles.kvLabel}>Dificultad</Text>
          <View style={{ marginTop: 6 }}>
            <Bar value={difficulty} />
            <Text style={styles.kvValueNote}>{Number(difficulty).toFixed(1)}/5</Text>
          </View>
        </View>
      </View>

      {/* Comentario */}
      {comment?.trim()?.length ? (
        <View style={styles.commentBox}>
          <Text style={styles.commentText}>{comment.trim()}</Text>
        </View>
      ) : (
        <Text style={styles.muted}>Sin comentario del estudiante.</Text>
      )}

      {/* Vote section */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 8,
    borderWidth: 0,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    marginVertical: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  subtitle: { fontSize: 14, color: COLORS.text, marginTop: 2 },
  date: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  badgeScore: {
    marginLeft: 12,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
  },
  badgeScoreValue: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  badgeScoreLabel: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  metaRow: { flexDirection: 'row', marginTop: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  chipOk: { backgroundColor: '#E6F9F0' },
  chipWarn: { backgroundColor: '#FFF7E6' },
  chipText: { fontSize: 12, fontWeight: '500' },
  section: { marginTop: 16 },
  kv: {},
  kvLabel: { fontSize: 13, color: COLORS.muted },
  kvValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  kvValueNote: { fontSize: 12, color: COLORS.muted },
  barTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: { height: 8, borderRadius: 999 },
  commentBox: {
    marginTop: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
  },
  commentText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  muted: { color: COLORS.muted, marginTop: 10, fontSize: 13 },
  
  // Vote section
  voteSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
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
});
