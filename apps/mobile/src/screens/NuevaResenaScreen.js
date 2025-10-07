// apps/mobile/src/screens/NuevaResenaScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ProfessorService } from '../services/professorService';
import { ReviewService } from '../services/reviewService';

const TAGS = [
  'Exigente',
  'Claro',
  'Justo',
  'Proyectos',
  'Mucho teórico',
  'Abre debate',
  'Poco práctico',
];

// Paleta
const COLORS = {
  bg: '#F6F7F8',
  accent: '#FF8200',
  primary: '#003087',
  secondary: '#2B529A',
  text: '#1A1A1A',
  border: '#E0E3E7',
  white: '#FFFFFF',
  muted: '#8A93A2',
};

export default function NuevaResenaScreen() {
  const navigation = useNavigation();

  // catálogos
  const [profesores, setProfesores] = useState([]);
  const [materias, setMaterias] = useState([]);

  // selección
  const [profesorId, setProfesorId] = useState(null);
  const [materiaId, setMateriaId] = useState(null);

  // campos
  const [asistencia, setAsistencia] = useState(false);
  const [usoTexto, setUsoTexto] = useState(false);
  const [calidad, setCalidad] = useState('');
  const [dificultad, setDificultad] = useState('');
  const [volveria, setVolveria] = useState(false);
  const [comentario, setComentario] = useState('');
  const [etiquetas, setEtiquetas] = useState([]);

  // UI
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('idle'); // idle|validando|enviando|exito|error
  const [openProfPicker, setOpenProfPicker] = useState(false);
  const [openCoursePicker, setOpenCoursePicker] = useState(false);

  // cargar catálogos
  useEffect(() => {
    (async () => {
      try {
        const [p, c] = await Promise.all([
          ProfessorService.getAllProfessors(),
          ReviewService.getAllCourses(),
        ]);
        if (p.success) setProfesores(p.data || []);
        if (c.success) setMaterias(c.data || []);
      } catch (_) {
        Alert.alert('Error', 'No fue posible cargar los catálogos.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Cargar borrador guardado (si lo hay)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('draft_review');
        if (raw) {
          const d = JSON.parse(raw);
          setProfesorId(d.profesorId ?? null);
          setMateriaId(d.materiaId ?? null);
          setAsistencia(!!d.asistencia);
          setUsoTexto(!!d.usoTexto);
          setCalidad(d.calidad?.toString() ?? '');
          setDificultad(d.dificultad?.toString() ?? '');
          setVolveria(!!d.volveria);
          setComentario(d.comentario ?? '');
          setEtiquetas(Array.isArray(d.etiquetas) ? d.etiquetas : []);
        }
      } catch (_) {}
    })();
  }, []);

  // Autosave borrador
  useEffect(() => {
    const payload = {
      profesorId,
      materiaId,
      asistencia,
      usoTexto,
      calidad,
      dificultad,
      volveria,
      comentario,
      etiquetas,
    };
    AsyncStorage.setItem('draft_review', JSON.stringify(payload));
  }, [
    profesorId,
    materiaId,
    asistencia,
    usoTexto,
    calidad,
    dificultad,
    volveria,
    comentario,
    etiquetas,
  ]);

  const toggleEtiqueta = (tag) => {
    if (etiquetas.includes(tag)) {
      setEtiquetas(etiquetas.filter((t) => t !== tag));
    } else if (etiquetas.length < 3) {
      setEtiquetas([...etiquetas, tag]);
    } else {
      Alert.alert('Límite de etiquetas', 'Solo puedes seleccionar hasta 3.');
    }
  };

  const validar = () => {
    const cal = parseInt(calidad, 10);
    const dif = parseInt(dificultad, 10);
    if (!profesorId || !materiaId) return 'Selecciona profesor y materia.';
    if (Number.isNaN(cal) || cal < 1 || cal > 5)
      return 'Calidad debe estar entre 1 y 5.';
    if (Number.isNaN(dif) || dif < 1 || dif > 5)
      return 'Dificultad debe estar entre 1 y 5.';
    if (comentario.length > 300)
      return 'Comentario máximo 300 caracteres.';
    return null;
  };

  const handleSubmit = async () => {
    setStatus('validando');
    const errorMsg = validar();
    if (errorMsg) {
      Alert.alert('Formulario inválido', errorMsg);
      setStatus('error');
      return;
    }

    setStatus('enviando');
    setSubmitting(true);

    const payload = {
      professor_id: profesorId,
      course_id: materiaId,
      asistencia,
      uso_texto: usoTexto,
      calidad: parseInt(calidad, 10),
      dificultad: parseInt(dificultad, 10),
      volveria,
      comentario,
      etiquetas, // text[] en Supabase
    };

    const res = await ReviewService.createReview(payload);
    setSubmitting(false);

    if (res.success) {
      setStatus('exito');
      await AsyncStorage.removeItem('draft_review');
      Alert.alert('¡Listo!', 'Reseña publicada con éxito.');
      navigation.goBack();
    } else {
      setStatus('error');
      Alert.alert(
        'Error',
        res.error ||
          'No se pudo publicar la reseña. Conservamos tus datos, intenta de nuevo.'
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.text }}>Cargando datos…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Publicar Reseña</Text>

      {/* Profesor */}
      <Text style={styles.label}>Profesor *</Text>
      <TouchableOpacity
        style={styles.select}
        onPress={() => setOpenProfPicker(true)}
      >
        <Text style={styles.selectText}>
          {profesorId
            ? profesores.find((p) => p.id === profesorId)?.full_name ||
              'Profesor seleccionado'
            : 'Selecciona un profesor'}
        </Text>
      </TouchableOpacity>

      {/* Materia */}
      <Text style={styles.label}>Materia *</Text>
      <TouchableOpacity
        style={styles.select}
        onPress={() => setOpenCoursePicker(true)}
      >
        <Text style={styles.selectText}>
          {materiaId
            ? materias.find((m) => m.id === materiaId)?.name ||
              'Materia seleccionada'
            : 'Selecciona una materia'}
        </Text>
      </TouchableOpacity>

      {/* Switches */}
      <View style={styles.row}>
        <Text style={styles.labelInline}>Asistencia</Text>
        <Switch
          value={asistencia}
          onValueChange={setAsistencia}
          trackColor={{ true: COLORS.secondary, false: '#C8CCD4' }}
          thumbColor={asistencia ? COLORS.accent : COLORS.white}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.labelInline}>¿Usa texto?</Text>
        <Switch
          value={usoTexto}
          onValueChange={setUsoTexto}
          trackColor={{ true: COLORS.secondary, false: '#C8CCD4' }}
          thumbColor={usoTexto ? COLORS.accent : COLORS.white}
        />
      </View>

      {/* Calificaciones */}
      <Text style={styles.label}>Calidad (1–5) *</Text>
      <TextInput
        style={styles.input}
        value={calidad}
        onChangeText={setCalidad}
        placeholder="Ej: 4"
        keyboardType="number-pad"
        maxLength={1}
        placeholderTextColor={COLORS.muted}
      />

      <Text style={styles.label}>Dificultad (1–5) *</Text>
      <TextInput
        style={styles.input}
        value={dificultad}
        onChangeText={setDificultad}
        placeholder="Ej: 3"
        keyboardType="number-pad"
        maxLength={1}
        placeholderTextColor={COLORS.muted}
      />

      {/* Volvería */}
      <View style={styles.row}>
        <Text style={styles.labelInline}>¿Lo volverías a tomar?</Text>
        <Switch
          value={volveria}
          onValueChange={setVolveria}
          trackColor={{ true: COLORS.secondary, false: '#C8CCD4' }}
          thumbColor={volveria ? COLORS.accent : COLORS.white}
        />
      </View>

      {/* Comentario */}
      <Text style={styles.label}>Comentario (máx. 300)</Text>
      <TextInput
        style={[styles.input, { minHeight: 90 }]}
        value={comentario}
        onChangeText={setComentario}
        placeholder="Escribe tu experiencia…"
        multiline
        maxLength={300}
        placeholderTextColor={COLORS.muted}
      />
      <Text style={styles.helper}>{comentario.length}/300 caracteres</Text>

      {/* Etiquetas */}
      <Text style={styles.label}>Etiquetas (máx. 3)</Text>
      <View style={styles.tagsWrap}>
        {TAGS.map((tag) => {
          const active = etiquetas.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, active && styles.tagActive]}
              onPress={() => toggleEtiqueta(tag)}
            >
              <Text style={[styles.tagText, active && styles.tagTextActive]}>
                {tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Botón enviar */}
      <TouchableOpacity
        style={[styles.button, submitting && { opacity: 0.6 }]}
        disabled={submitting}
        onPress={handleSubmit}
      >
        {submitting ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>Enviar Reseña</Text>
        )}
      </TouchableOpacity>

      {status !== 'idle' && (
        <Text style={styles.helper}>
          {status === 'validando' && 'Validando…'}
          {status === 'enviando' && 'Enviando…'}
          {status === 'exito' && '✅ Enviado correctamente'}
          {status === 'error' && '⚠️ Revisa los datos e inténtalo de nuevo'}
        </Text>
      )}

      {/* Picker Profesor */}
      <Modal
        visible={openProfPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenProfPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona profesor</Text>
            <FlatList
              data={profesores}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setProfesorId(item.id);
                    setOpenProfPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.full_name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Picker Materia */}
      <Modal
        visible={openCoursePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenCoursePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona materia</Text>
            <FlatList
              data={materias}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setMateriaId(item.id);
                    setOpenCoursePicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {item.name} {item.code ? `(${item.code})` : ''}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: COLORS.bg },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: COLORS.text,
  },
  labelInline: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  helper: {
    fontSize: 12,
    color: COLORS.muted,
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 8,
  },
  select: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectText: { color: COLORS.text },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  tagText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  tagTextActive: { color: COLORS.white },
  button: {
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.accent, // CTA naranja
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: COLORS.white, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: { backgroundColor: COLORS.white, borderRadius: 16, maxHeight: '70%', padding: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: COLORS.primary },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemText: { fontSize: 14, color: COLORS.text },
});
