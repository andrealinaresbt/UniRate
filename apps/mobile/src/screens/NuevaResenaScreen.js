import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Switch, TouchableOpacity,
  ActivityIndicator, Alert, FlatList, Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ProfessorService } from '../services/professorService';
import { ReviewService } from '../services/reviewService';

const TAGS = ['Exigente', 'Claro', 'Justo', 'Proyectos', 'Mucho teórico', 'Abre debate', 'Poco práctico'];

export default function NuevaResenaScreen() {
  const navigation = useNavigation();

  // catálogos
  const [profesores, setProfesores] = useState([]);
  const [materias, setMaterias] = useState([]);

  // formulario
  const [profesorId, setProfesorId] = useState(null);
  const [materiaId, setMateriaId] = useState(null);
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
  const [openProfPicker, setOpenProfPicker] = useState(false);
  const [openCoursePicker, setOpenCoursePicker] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, c] = await Promise.all([
        ProfessorService.getAllProfessors(),
        ReviewService.getAllCourses()
      ]);
      if (p.success) setProfesores(p.data || []);
      if (c.success) setMaterias(c.data || []);
      setLoading(false);
    })();
  }, []);

  const toggleEtiqueta = (tag) => {
    if (etiquetas.includes(tag)) {
      setEtiquetas(etiquetas.filter(t => t !== tag));
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
    if (Number.isNaN(cal) || cal < 1 || cal > 5) return 'Calidad debe estar entre 1 y 5.';
    if (Number.isNaN(dif) || dif < 1 || dif > 5) return 'Dificultad debe estar entre 1 y 5.';
    if (comentario.length > 300) return 'Comentario máximo 300 caracteres.';
    return null;
  };

  const handleSubmit = async () => {
    const errorMsg = validar();
    if (errorMsg) {
      Alert.alert('Formulario inválido', errorMsg);
      return;
    }

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
      etiquetas // ajusta al tipo de tu columna (array/text)
    };

    const res = await ReviewService.createReview(payload);
    setSubmitting(false);

    if (res.success) {
      Alert.alert('¡Listo!', 'Reseña publicada con éxito.');
      navigation.goBack();
    } else {
      Alert.alert('Error', res.error || 'No se pudo publicar la reseña. Conservamos tus datos, intenta de nuevo.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando datos…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Publicar Reseña</Text>

      {/* Profesor */}
      <Text style={styles.label}>Profesor *</Text>
      <TouchableOpacity style={styles.select} onPress={() => setOpenProfPicker(true)}>
        <Text style={styles.selectText}>
          {profesorId
            ? (profesores.find(p => p.id === profesorId)?.full_name || 'Profesor seleccionado')
            : 'Selecciona un profesor'}
        </Text>
      </TouchableOpacity>

      {/* Materia */}
      <Text style={styles.label}>Materia *</Text>
      <TouchableOpacity style={styles.select} onPress={() => setOpenCoursePicker(true)}>
        <Text style={styles.selectText}>
          {materiaId
            ? (materias.find(m => m.id === materiaId)?.name || 'Materia seleccionada')
            : 'Selecciona una materia'}
        </Text>
      </TouchableOpacity>

      {/* Switches */}
      <View style={styles.row}>
        <Text style={styles.labelInline}>Asistencia</Text>
        <Switch value={asistencia} onValueChange={setAsistencia} />
      </View>
      <View style={styles.row}>
        <Text style={styles.labelInline}>¿Usa texto?</Text>
        <Switch value={usoTexto} onValueChange={setUsoTexto} />
      </View>

      {/* Calificaciones */}
      <Text style={styles.label}>Calidad (1–5) *</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={calidad}
        onChangeText={setCalidad}
        placeholder="Ej. 4"
      />

      <Text style={styles.label}>Dificultad (1–5) *</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={dificultad}
        onChangeText={setDificultad}
        placeholder="Ej. 3"
      />

      <View style={styles.row}>
        <Text style={styles.labelInline}>¿Lo volverías a tomar?</Text>
        <Switch value={volveria} onValueChange={setVolveria} />
      </View>

      {/* Comentario */}
      <Text style={styles.label}>Comentario (máx. 300)</Text>
      <TextInput
        style={[styles.input, { height: 90 }]}
        multiline
        maxLength={300}
        value={comentario}
        onChangeText={setComentario}
        placeholder="Tu experiencia en pocas líneas…"
      />
      <Text style={styles.helper}>{comentario.length}/300</Text>

      {/* Etiquetas */}
      <Text style={styles.label}>Etiquetas (máx. 3)</Text>
      <View style={styles.tagsWrap}>
        {TAGS.map(tag => {
          const active = etiquetas.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, active && styles.tagActive]}
              onPress={() => toggleEtiqueta(tag)}
            >
              <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
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
        {submitting ? <ActivityIndicator /> : <Text style={styles.buttonText}>Enviar Reseña</Text>}
      </TouchableOpacity>

      {/* Picker Profesor */}
      <Modal visible={openProfPicker} transparent animationType="fade" onRequestClose={() => setOpenProfPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona profesor</Text>
            <FlatList
              data={profesores}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setProfesorId(item.id); setOpenProfPicker(false); }}
                >
                  <Text style={styles.modalItemText}>{item.full_name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Picker Materia */}
      <Modal visible={openCoursePicker} transparent animationType="fade" onRequestClose={() => setOpenCoursePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona materia</Text>
            <FlatList
              data={materias}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setMateriaId(item.id); setOpenCoursePicker(false); }}
                >
                  <Text style={styles.modalItemText}>{item.name} {item.code ? `(${item.code})` : ''}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#F7F9FC' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#003087' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' },
  labelInline: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10,
    backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  helper: { fontSize: 12, color: '#888', alignSelf: 'flex-end', marginTop: -8, marginBottom: 8 },
  select: {
    height: 48, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10,
    backgroundColor: '#FFF', paddingHorizontal: 12, justifyContent: 'center', marginBottom: 12
  },
  selectText: { color: '#333' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#EEF2F7' },
  tagActive: { backgroundColor: '#003087' },
  tagText: { fontSize: 12, color: '#003087', fontWeight: '600' },
  tagTextActive: { color: '#FFF' },
  button: { height: 50, borderRadius: 12, backgroundColor: '#003087', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, maxHeight: '70%', padding: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  modalItem: { paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalItemText: { fontSize: 14 }
});
