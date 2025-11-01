import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import reportService from '../services/reportService';

const REASONS = [
  'Lenguaje ofensivo',
  'Spam / autopromoción',
  'Contenido falso',
  'Otro',
];

export default function ReportModal({ visible, onClose, reviewId }) {
  const [reason, setReason] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);

  // ✅ Verificar si ya reportó esta reseña
  useEffect(() => {
    if (visible && reviewId) {
      checkAlreadyReported();
    }
  }, [visible, reviewId]);

  const checkAlreadyReported = async () => {
    const reported = await reportService.checkUserReported(reviewId);
    setAlreadyReported(reported);
  };

  const handleSend = async () => {
    if (!reason || alreadyReported) return;
    
    setSubmitting(true);
    try {
      const res = await reportService.createReport({ 
        review_id: reviewId, 
        reason, 
        comment 
      });
      
      if (!res.success) throw new Error(res.error);
      
      Alert.alert('✅ Reporte enviado', 'Gracias por ayudarnos a mantener la comunidad.');
      setReason(null);
      setComment('');
      setAlreadyReported(true);
      onClose();
    } catch (e) {
      Alert.alert('❌ Error', e.message || 'No se pudo enviar el reporte.');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Mostrar estado si ya reportó
  if (alreadyReported) {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={s.overlay}>
          <View style={s.card}>
            <Text style={s.title}>Ya reportaste esta reseña</Text>
            <Text style={{ textAlign: 'center', marginVertical: 16, color: '#666' }}>
              Tu reporte está en revisión. Gracias por tu colaboración.
            </Text>
            <TouchableOpacity style={s.btn} onPress={onClose}>
              <Text style={s.btnTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Modal original para nuevos reportes
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={s.header}>
            <Text style={s.title}>Reportar reseña</Text>
          </View>

          <Text style={s.label}>Selecciona un motivo *</Text>
          {REASONS.map(r => (
            <TouchableOpacity 
              key={r} 
              style={[s.reasonRow, reason === r && s.reasonRowActive]} 
              onPress={() => setReason(r)}
            >
              <Text style={[s.reasonText, reason === r && s.reasonTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[s.label, { marginTop: 12 }]}>Comentario (opcional)</Text>
          <TextInput
            style={s.textarea}
            value={comment}
            onChangeText={setComment}
            multiline
            placeholder="Detalles adicionales..."
            maxLength={300}
          />

          <View style={s.actions}>
            <TouchableOpacity style={[s.btn, s.cancel]} onPress={onClose} disabled={submitting}>
              <Text style={s.cancelTxt}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[s.btn, (!reason || submitting) && { opacity: 0.6 }]} 
              onPress={handleSend} 
              disabled={!reason || submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Enviar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Tus estilos se mantienen igual...
const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.35)' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  label: { marginTop: 12, fontWeight: '600', color: '#374151' },
  reasonRow: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E9EEF5', marginTop: 8, backgroundColor: '#F8F9FA' },
  reasonRowActive: { backgroundColor: '#FFECE6', borderColor: '#FF8200' },
  reasonText: { color: '#111827' },
  reasonTextActive: { color: '#FF8200', fontWeight: '700' },
  textarea: { marginTop: 8, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, minHeight: 80, textAlignVertical: 'top', backgroundColor: '#fff' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#FF8200' },
  btnTxt: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  cancel: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  cancelTxt: { color: '#374151', fontWeight: '700' },
});