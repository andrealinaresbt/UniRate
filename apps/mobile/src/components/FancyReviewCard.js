import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
  const prof = review?.professors?.full_name || 'Profesor';
  const courseCode = review?.courses?.code || '';
  const courseName = review?.courses?.name || 'Materia';
  const created = review?.created_at ? new Date(review.created_at).toLocaleDateString('es-ES') : '-';
  const trimester = review?.trimester || review?.term || '-';
  const score = review?.score ?? review?.calidad ?? 0;
  const difficulty = review?.difficulty ?? review?.dificultad ?? 0;
  const again = !!(review?.would_take_again ?? review?.volveria);
  const comment = review?.comment ?? review?.comentario ?? '';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{prof}</Text>
          <Text style={styles.subtitle}>
            {courseCode ? `${courseCode} · ` : ''}{courseName}
          </Text>
          <Text style={styles.date}>{`Trimestre ${trimester} • ${created}`}</Text>
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
});
