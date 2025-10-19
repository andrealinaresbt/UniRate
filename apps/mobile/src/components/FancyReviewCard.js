// apps/mobile/src/components/FancyReviewCard.js
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
  const full = Math.round((v / max) * 5); // normaliza a 5 estrellas
  return (
    <Text style={{ fontSize: size, lineHeight: size + 2 }}>
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
        </View>
        <View style={styles.badgeScore}>
          <Text style={styles.badgeScoreValue}>{Number(score).toFixed(1)}</Text>
          <Text style={styles.badgeScoreLabel}>Calidad</Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={styles.metaRow}>
        <View style={styles.chip}><Text style={styles.chipText}>📅 {created}</Text></View>
        <View style={styles.chip}><Text style={styles.chipText}>🗓️ T{trimester}</Text></View>
        <View style={[styles.chip, again ? styles.chipOk : styles.chipWarn]}>
          <Text style={[styles.chipText, { color: again ? '#065F46' : '#78350F' }]}>
            {again ? 'La tomaría de nuevo' : 'No la tomaría de nuevo'}
          </Text>
        </View>
      </View>

      {/* Stars + difficulty */}
      <View style={styles.section}>
        <View style={styles.kv}>
          <Text style={styles.kvLabel}>Satisfacción</Text>
          <View style={styles.kvValueRow}>
            <Stars value={score} />
            <Text style={styles.kvValueNote}>({Number(score).toFixed(1)}/5)</Text>
          </View>
        </View>

        <View style={[styles.kv, { marginTop: 8 }]}>
          <Text style={styles.kvLabel}>Dificultad</Text>
          <View style={{ marginTop: 6 }}>
            <Bar value={difficulty} />
            <Text style={styles.kvValueNote}>({Number(difficulty).toFixed(1)}/5)</Text>
          </View>
        </View>
      </View>

      {/* Comment */}
      {comment?.trim()?.length ? (
        <View style={styles.commentBox}>
          <Text style={styles.commentMark}>“</Text>
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  badgeScore: {
    marginLeft: 12, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#F9FAFB',
  },
  badgeScoreValue: { fontSize: 18, fontWeight: '800', color: COLORS.text, lineHeight: 20 },
  badgeScoreLabel: { fontSize: 10, color: COLORS.muted, marginTop: 2 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#F3F4F6' },
  chipText: { fontSize: 12, color: COLORS.text },
  chipOk: { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' },
  chipWarn: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },

  section: { marginTop: 12 },
  kv: {},
  kvLabel: { fontSize: 12, color: COLORS.muted },
  kvValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  kvValueNote: { fontSize: 12, color: COLORS.muted },

  barTrack: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 999 },

  commentBox: {
    marginTop: 14, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 12, position: 'relative'
  },
  commentMark: {
    position: 'absolute', top: -8, left: 10, fontSize: 26, color: COLORS.accent, fontWeight: '900'
  },
  commentText: { fontSize: 14, color: COLORS.text, lineHeight: 20, marginTop: 4 },
  muted: { color: COLORS.muted, marginTop: 8 },
});
