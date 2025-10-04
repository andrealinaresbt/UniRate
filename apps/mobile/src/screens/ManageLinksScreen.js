import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { ProfessorService } from '../services/professorService';
import { CourseService } from '../services/courseService';
import { CourseProfessorService } from '../services/courseProfessorService';

const SearchBox = ({ label, placeholder, value, onChangeText, error }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, error && styles.inputErr]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
    />
    {error ? <Text style={styles.errText}>{error}</Text> : null}
  </View>
);

const ResultItem = ({ title, subtitle, right, onPress, selected }) => (
  <Pressable onPress={onPress} style={[styles.item, selected && styles.itemSelected]}>
    <View style={{ flex: 1 }}>
      <Text style={styles.itemTitle}>{title}</Text>
      {subtitle ? <Text style={styles.itemSub}>{subtitle}</Text> : null}
    </View>
    {right ?? <Text style={styles.itemCheck}>{selected ? '✓' : '＋'}</Text>}
  </Pressable>
);

export default function ManageLinksScreen() {
  const [mode, setMode] = useState('connect'); // 'connect' | 'disconnect'

  // ====== CONNECT ======
  const [qProf, setQProf] = useState('');
  const [qCourse, setQCourse] = useState('');
  const [profResults, setProfResults] = useState([]);
  const [courseResults, setCourseResults] = useState([]);
  const [loadingProf, setLoadingProf] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [selectedProf, setSelectedProf] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // ====== DISCONNECT (buscador único de VÍNCULOS) ======
  const [qLink, setQLink] = useState('');
  const [linkResults, setLinkResults] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // --- Búsqueda de profesores (debounce)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (mode !== 'connect') return;
      const term = qProf.trim();
      if (!term) { setProfResults([]); return; }
      setLoadingProf(true);
      const { success, data } = await ProfessorService.searchProfessors(term);
      setLoadingProf(false);
      if (success) setProfResults(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [qProf, mode]);

  // --- Búsqueda de cursos (debounce)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (mode !== 'connect') return;
      const term = qCourse.trim();
      if (!term) { setCourseResults([]); return; }
      setLoadingCourse(true);
      const { success, data } = await CourseService.searchCourses(term);
      setLoadingCourse(false);
      if (success) setCourseResults(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [qCourse, mode]);

  // --- Búsqueda de VÍNCULOS (debounce)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (mode !== 'disconnect') return;
      const term = qLink.trim();
      if (!term) { setLinkResults([]); return; }
      setLoadingLinks(true);
      const { success, data, error } = await CourseProfessorService.searchLinks(term);
      setLoadingLinks(false);
      if (!success) {
        Alert.alert('Error', error || 'No se pudieron cargar los vínculos');
        return;
      }
      setLinkResults(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [qLink, mode]);

  // Conectar
  const canConnect = selectedProf && selectedCourse;
  const handleConnect = async () => {
    if (!canConnect) return;
    const { success, error, code } = await CourseProfessorService.link({
      professor_id: selectedProf.id,
      course_id: selectedCourse.id,
    });
    if (!success) {
      if (code === 'DUPLICATE') {
        Alert.alert('Ya estaba vinculado', 'Ese profesor ya está asociado a esa materia.');
      } else {
        Alert.alert('Error', String(error || 'No se pudo vincular.'));
      }
      return;
    }
    Alert.alert('Vinculado', 'Profesor y materia conectados correctamente.');
    // reset conect
    setSelectedProf(null); setSelectedCourse(null);
    setQProf(''); setQCourse('');
    setProfResults([]); setCourseResults([]);
  };

  // Desvincular
  const handleUnlink = async (professor_id, course_id) => {
    const { success, error } = await CourseProfessorService.unlink({ professor_id, course_id });
    if (!success) {
      Alert.alert('Error', String(error || 'No se pudo desconectar.'));
      return;
    }
    // quitar del resultado
    setLinkResults(prev => prev.filter(r => !(r.professor?.id === professor_id && r.course?.id === course_id)));
    Alert.alert('Desvinculado', 'Se eliminó la relación correctamente.');
  };

  // UI
  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Vincular Materias ↔ Profesores</Text>
        <Text style={styles.heroSub}>Busca y selecciona para conectar o desconectar relaciones.</Text>
        <View style={styles.modeWrap}>
          <Pressable onPress={() => setMode('connect')} style={[styles.modeBtn, mode==='connect' && styles.modeActive]}>
            <Text style={[styles.modeTxt, mode==='connect' && styles.modeTxtActive]}>Conectar</Text>
          </Pressable>
          <Pressable onPress={() => setMode('disconnect')} style={[styles.modeBtn, mode==='disconnect' && styles.modeActive]}>
            <Text style={[styles.modeTxt, mode==='disconnect' && styles.modeTxtActive]}>Desconectar</Text>
          </Pressable>
        </View>
      </View>

      {/* ====== MODO CONECTAR ====== */}
      {mode === 'connect' && (
        <>
          {/* Buscador Profesores */}
          <SearchBox
            label="Buscar profesor"
            placeholder='Ej: "Carla", "Pérez"'
            value={qProf}
            onChangeText={t => { setQProf(t); setSelectedProf(null); }}
          />
          {loadingProf ? <ActivityIndicator /> : (
            <View>
              {qProf && profResults.length === 0 ? <Text style={styles.empty}>Sin resultados</Text> : null}
              {profResults.map(item => (
                <ResultItem
                  key={item.id}
                  title={item.full_name}
                  subtitle={item.university || item.department}
                  selected={selectedProf?.id === item.id}
                  onPress={() => { setSelectedProf(item); }}
                />
              ))}
            </View>
          )}

          <View style={{ height: 8 }} />

          {/* Buscador Materias */}
          <SearchBox
            label="Buscar materia"
            placeholder='Ej: "BPTM102", "Física I"'
            value={qCourse}
            onChangeText={t => { setQCourse(t); setSelectedCourse(null); }}
          />
          {loadingCourse ? <ActivityIndicator /> : (
            <View>
              {qCourse && courseResults.length === 0 ? <Text style={styles.empty}>Sin resultados</Text> : null}
              {courseResults.map(item => (
                <ResultItem
                  key={item.id}
                  title={`${item.code} — ${item.name}`}
                  subtitle={item.department}
                  selected={selectedCourse?.id === item.id}
                  onPress={() => { setSelectedCourse(item); }}
                />
              ))}
            </View>
          )}

          {/* Acciones */}
          <Pressable
            disabled={!canConnect}
            onPress={handleConnect}
            style={[styles.cta, !canConnect && { opacity: 0.5 }]}
          >
            <Text style={styles.ctaTxt}>Conectar</Text>
          </Pressable>
        </>
      )}

      {/* ====== MODO DESCONECTAR ====== */}
      {mode === 'disconnect' && (
        <>
          <SearchBox
            label="Buscar por materia o profesor"
            placeholder='Ej: "BPTM102", "Carla Pérez"'
            value={qLink}
            onChangeText={setQLink}
          />

          {loadingLinks ? <ActivityIndicator /> : (
            <View>
              {qLink && linkResults.length === 0 ? (
                <Text style={styles.empty}>Sin vínculos que coincidan</Text>
              ) : null}

              {linkResults.map(row => (
                <ResultItem
                  key={`${row.professor?.id}-${row.course?.id}`}
                  title={`${row.course?.code ?? ''} — ${row.course?.name ?? ''}`}
                  subtitle={row.professor?.full_name ?? ''}
                  onPress={() => handleUnlink(row.professor.id, row.course.id)}
                  right={
                    <Pressable style={styles.unlinkPill} onPress={() => handleUnlink(row.professor.id, row.course.id)}>
                      <Text style={styles.unlinkPillTxt}>Desvincular</Text>
                    </Pressable>
                  }
                />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 28 },
  hero: { backgroundColor: '#0F172A', borderRadius: 16, padding: 18, marginBottom: 16 },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  heroSub: { color: '#CBD5E1', marginTop: 6 },
  modeWrap: { flexDirection: 'row', marginTop: 12, gap: 8 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#334155', alignItems: 'center' },
  modeActive: { backgroundColor: '#22C55E' },
  modeTxt: { color: '#E2E8F0', fontWeight: '600' },
  modeTxtActive: { color: '#0F172A' },

  label: { fontWeight: '600', color: '#334155' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, marginTop: 6, backgroundColor: '#fff' },
  inputErr: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  errText: { color: '#DC2626', fontSize: 12, marginTop: 6 },

  item: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { height: 4, width: 0 },
    elevation: 2,
  },
  itemSelected: { borderWidth: 1, borderColor: '#22C55E' },
  itemTitle: { fontWeight: '700', color: '#0F172A' },
  itemSub: { color: '#64748B', fontSize: 12, marginTop: 2 },
  itemCheck: { fontSize: 22, color: '#94A3B8', marginLeft: 8 },

  cta: { backgroundColor: '#0EA5E9', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  ctaTxt: { color: '#fff', fontWeight: '700' },

  empty: { color: '#64748B' },

  unlinkPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  unlinkPillTxt: { color: '#DC2626', fontWeight: '700' },
});
