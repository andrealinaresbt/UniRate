import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
  const [viewMode, setViewMode] = useState('courses'); // 'courses' | 'professors'

  // ====== VISTA POR MATERIAS ======
  const [qCourseSearch, setQCourseSearch] = useState('');
  const [courseSearchResults, setCourseSearchResults] = useState([]);
  const [loadingCourseSearch, setLoadingCourseSearch] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseLinks, setCourseLinks] = useState([]);
  const [loadingCourseLinks, setLoadingCourseLinks] = useState(false);

  const [showConnectProf, setShowConnectProf] = useState(false);
  const [qProfForCourse, setQProfForCourse] = useState('');
  const [profForCourseResults, setProfForCourseResults] = useState([]);
  const [loadingProfForCourse, setLoadingProfForCourse] = useState(false);

  // ====== VISTA POR PROFESORES ======
  const [qProfSearch, setQProfSearch] = useState('');
  const [profSearchResults, setProfSearchResults] = useState([]);
  const [loadingProfSearch, setLoadingProfSearch] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [professorLinks, setProfessorLinks] = useState([]);
  const [loadingProfessorLinks, setLoadingProfessorLinks] = useState(false);

  const [showConnectCourse, setShowConnectCourse] = useState(false);
  const [qCourseForProf, setQCourseForProf] = useState('');
  const [courseForProfResults, setCourseForProfResults] = useState([]);
  const [loadingCourseForProf, setLoadingCourseForProf] = useState(false);

  // Reset parcial al cambiar de vista
  useEffect(() => {
    if (viewMode === 'courses') {
      setSelectedProfessor(null);
      setProfessorLinks([]);
      setShowConnectCourse(false);
      setQProfSearch('');
      setProfSearchResults([]);
      setQCourseForProf('');
      setCourseForProfResults([]);
    } else {
      setSelectedCourse(null);
      setCourseLinks([]);
      setShowConnectProf(false);
      setQCourseSearch('');
      setCourseSearchResults([]);
      setQProfForCourse('');
      setProfForCourseResults([]);
    }
  }, [viewMode]);

  // --- Búsqueda principal de materias (debounce)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (viewMode !== 'courses') return;
      const term = qCourseSearch.trim();
      if (!term) {
        setCourseSearchResults([]);
        return;
      }
      setLoadingCourseSearch(true);
      const { success, data } = await CourseService.searchCourses(term);
      setLoadingCourseSearch(false);
      if (success) setCourseSearchResults(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [qCourseSearch, viewMode]);

  // --- Cargar vínculos de una materia seleccionada
  useEffect(() => {
    const loadLinks = async () => {
      if (viewMode !== 'courses' || !selectedCourse) return;
      setLoadingCourseLinks(true);
      const searchTerm = selectedCourse.code || selectedCourse.name || '';
      const { success, data, error } = await CourseProfessorService.searchLinks(searchTerm);
      setLoadingCourseLinks(false);
      if (!success) {
        Alert.alert('Error', error || 'No se pudieron cargar los vínculos de la materia.');
        setCourseLinks([]);
        return;
      }
      const filtered = (data || []).filter(row => row.course?.id === selectedCourse.id);
      setCourseLinks(filtered);
    };
    loadLinks();
  }, [selectedCourse, viewMode]);

  // --- Búsqueda de profesores para conectar a una materia (debounce)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (viewMode !== 'courses' || !showConnectProf) return;
      const term = qProfForCourse.trim();
      if (!term) {
        setProfForCourseResults([]);
        return;
      }
      setLoadingProfForCourse(true);
      const { success, data } = await ProfessorService.searchProfessors(term);
      setLoadingProfForCourse(false);
      if (success) setProfForCourseResults(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [qProfForCourse, viewMode, showConnectProf]);

  // --- Búsqueda principal de profesores (debounce)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (viewMode !== 'professors') return;
      const term = qProfSearch.trim();
      if (!term) {
        setProfSearchResults([]);
        return;
      }
      setLoadingProfSearch(true);
      const { success, data } = await ProfessorService.searchProfessors(term);
      setLoadingProfSearch(false);
      if (success) setProfSearchResults(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [qProfSearch, viewMode]);

  // --- Cargar vínculos de un profesor seleccionado
  useEffect(() => {
    const loadLinks = async () => {
      if (viewMode !== 'professors' || !selectedProfessor) return;
      setLoadingProfessorLinks(true);
      const searchTerm = selectedProfessor.full_name || '';
      const { success, data, error } = await CourseProfessorService.searchLinks(searchTerm);
      setLoadingProfessorLinks(false);
      if (!success) {
        Alert.alert('Error', error || 'No se pudieron cargar las materias del profesor.');
        setProfessorLinks([]);
        return;
      }
      const filtered = (data || []).filter(row => row.professor?.id === selectedProfessor.id);
      setProfessorLinks(filtered);
    };
    loadLinks();
  }, [selectedProfessor, viewMode]);

  // --- Búsqueda de materias para conectar a un profesor (debounce)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (viewMode !== 'professors' || !showConnectCourse) return;
      const term = qCourseForProf.trim();
      if (!term) {
        setCourseForProfResults([]);
        return;
      }
      setLoadingCourseForProf(true);
      const { success, data } = await CourseService.searchCourses(term);
      setLoadingCourseForProf(false);
      if (success) setCourseForProfResults(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [qCourseForProf, viewMode, showConnectCourse]);

  // Conectar (misma lógica)
  const handleLink = async (professor, course) => {
    if (!professor || !course) return;
    const { success, error, code } = await CourseProfessorService.link({
      professor_id: professor.id,
      course_id: course.id,
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

    if (selectedCourse && course.id === selectedCourse.id) {
      setSelectedCourse(prev => (prev ? { ...prev } : prev));
    }
    if (selectedProfessor && professor.id === selectedProfessor.id) {
      setSelectedProfessor(prev => (prev ? { ...prev } : prev));
    }

    setQProfForCourse('');
    setProfForCourseResults([]);
    setShowConnectProf(false);

    setQCourseForProf('');
    setCourseForProfResults([]);
    setShowConnectCourse(false);
  };

  // Desvincular (misma lógica)
  const handleUnlink = async (professor_id, course_id) => {
    const { success, error } = await CourseProfessorService.unlink({ professor_id, course_id });
    if (!success) {
      Alert.alert('Error', String(error || 'No se pudo desconectar.'));
      return;
    }
    setCourseLinks(prev =>
      prev.filter(r => !(r.professor?.id === professor_id && r.course?.id === course_id)),
    );
    setProfessorLinks(prev =>
      prev.filter(r => !(r.professor?.id === professor_id && r.course?.id === course_id)),
    );
    Alert.alert('Desvinculado', 'Se eliminó la relación correctamente.');
  };

  // UI
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.wrap}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Vincular Materias ↔ Profesores</Text>
          <Text style={styles.heroSub}>
            Elige si quieres gestionar vínculos desde la vista de materias o de profesores.
          </Text>

          {/* Toggle tipo pastilla */}
          <View style={styles.toggleContainer}>
            <Pressable
              style={[
                styles.toggleOption,
                viewMode === 'courses' && styles.toggleOptionActive,
              ]}
              onPress={() => setViewMode('courses')}
            >
              <Text
                style={[
                  styles.toggleText,
                  viewMode === 'courses' && styles.toggleTextActive,
                ]}
              >
                Materias
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.toggleOption,
                viewMode === 'professors' && styles.toggleOptionActive,
              ]}
              onPress={() => setViewMode('professors')}
            >
              <Text
                style={[
                  styles.toggleText,
                  viewMode === 'professors' && styles.toggleTextActive,
                ]}
              >
                Profesores
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ====== VISTA MATERIAS ====== */}
        {viewMode === 'courses' && (
          <>
            <SearchBox
              label="Buscar materia"
              placeholder='Ej: "BPTM102", "Física I"'
              value={qCourseSearch}
              onChangeText={t => {
                setQCourseSearch(t);
                setSelectedCourse(null);
                setCourseLinks([]);
                setShowConnectProf(false);
              }}
            />
            {loadingCourseSearch ? (
              <ActivityIndicator />
            ) : (
              <View>
                {qCourseSearch && courseSearchResults.length === 0 ? (
                  <Text style={styles.empty}>Sin resultados</Text>
                ) : null}
                {courseSearchResults.map(item => (
                  <ResultItem
                    key={item.id}
                    title={`${item.code} — ${item.name}`}
                    subtitle={item.department}
                    selected={selectedCourse?.id === item.id}
                    onPress={() => {
                      setSelectedCourse(item);
                      setShowConnectProf(false);
                      setQProfForCourse('');
                      setProfForCourseResults([]);
                    }}
                  />
                ))}
              </View>
            )}

            {selectedCourse && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Materia seleccionada</Text>
                <Text style={styles.sectionHighlight}>
                  {selectedCourse.code} — {selectedCourse.name}
                </Text>

                <Pressable
                  style={styles.connectNewBtn}
                  onPress={() => setShowConnectProf(prev => !prev)}
                >
                  <Text style={styles.connectNewBtnTxt}>
                    {showConnectProf
                      ? 'Cancelar conexión con nuevo profesor'
                      : 'Conectar con un nuevo profesor'}
                  </Text>
                </Pressable>

                {showConnectProf && (
                  <View style={{ marginTop: 10 }}>
                    <SearchBox
                      label="Buscar profesor para vincular"
                      placeholder='Ej: "Carla", "Pérez"'
                      value={qProfForCourse}
                      onChangeText={setQProfForCourse}
                    />
                    {loadingProfForCourse ? (
                      <ActivityIndicator />
                    ) : (
                      <View>
                        {qProfForCourse && profForCourseResults.length === 0 ? (
                          <Text style={styles.empty}>Sin resultados</Text>
                        ) : null}
                        {profForCourseResults.map(prof => (
                          <ResultItem
                            key={prof.id}
                            title={prof.full_name}
                            subtitle={prof.university || prof.department}
                            onPress={() => handleLink(prof, selectedCourse)}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                )}

                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                  Profesores vinculados
                </Text>
                {loadingCourseLinks ? (
                  <ActivityIndicator />
                ) : (
                  <View style={{ marginTop: 8 }}>
                    {courseLinks.length === 0 ? (
                      <Text style={styles.empty}>
                        Esta materia aún no tiene profesores vinculados.
                      </Text>
                    ) : (
                      courseLinks.map(row => (
                        <ResultItem
                          key={`${row.professor?.id}-${row.course?.id}`}
                          title={row.professor?.full_name ?? ''}
                          subtitle={
                            row.professor?.university || row.professor?.department
                          }
                          right={
                            <Pressable
                              style={styles.unlinkPill}
                              onPress={() =>
                                handleUnlink(row.professor.id, row.course.id)
                              }
                            >
                              <Text style={styles.unlinkPillTxt}>Desvincular</Text>
                            </Pressable>
                          }
                        />
                      ))
                    )}
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* ====== VISTA PROFESORES ====== */}
        {viewMode === 'professors' && (
          <>
            <SearchBox
              label="Buscar profesor"
              placeholder='Ej: "Carla", "Pérez"'
              value={qProfSearch}
              onChangeText={t => {
                setQProfSearch(t);
                setSelectedProfessor(null);
                setProfessorLinks([]);
                setShowConnectCourse(false);
              }}
            />
            {loadingProfSearch ? (
              <ActivityIndicator />
            ) : (
              <View>
                {qProfSearch && profSearchResults.length === 0 ? (
                  <Text style={styles.empty}>Sin resultados</Text>
                ) : null}
                {profSearchResults.map(item => (
                  <ResultItem
                    key={item.id}
                    title={item.full_name}
                    subtitle={item.university || item.department}
                    selected={selectedProfessor?.id === item.id}
                    onPress={() => {
                      setSelectedProfessor(item);
                      setShowConnectCourse(false);
                      setQCourseForProf('');
                      setCourseForProfResults([]);
                    }}
                  />
                ))}
              </View>
            )}

            {selectedProfessor && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profesor seleccionado</Text>
                <Text style={styles.sectionHighlight}>
                  {selectedProfessor.full_name}
                </Text>

                <Pressable
                  style={styles.connectNewBtn}
                  onPress={() => setShowConnectCourse(prev => !prev)}
                >
                  <Text style={styles.connectNewBtnTxt}>
                    {showConnectCourse
                      ? 'Cancelar conexión con nueva materia'
                      : 'Conectar a una nueva materia'}
                  </Text>
                </Pressable>

                {showConnectCourse && (
                  <View style={{ marginTop: 10 }}>
                    <SearchBox
                      label="Buscar materia para vincular"
                      placeholder='Ej: "BPTM102", "Física I"'
                      value={qCourseForProf}
                      onChangeText={setQCourseForProf}
                    />
                    {loadingCourseForProf ? (
                      <ActivityIndicator />
                    ) : (
                      <View>
                        {qCourseForProf && courseForProfResults.length === 0 ? (
                          <Text style={styles.empty}>Sin resultados</Text>
                        ) : null}
                        {courseForProfResults.map(course => (
                          <ResultItem
                            key={course.id}
                            title={`${course.code} — ${course.name}`}
                            subtitle={course.department}
                            onPress={() => handleLink(selectedProfessor, course)}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                )}

                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                  Materias vinculadas
                </Text>
                {loadingProfessorLinks ? (
                  <ActivityIndicator />
                ) : (
                  <View style={{ marginTop: 8 }}>
                    {professorLinks.length === 0 ? (
                      <Text style={styles.empty}>
                        Este profesor aún no tiene materias vinculadas.
                      </Text>
                    ) : (
                      professorLinks.map(row => (
                        <ResultItem
                          key={`${row.professor?.id}-${row.course?.id}`}
                          title={`${row.course?.code ?? ''} — ${row.course?.name ?? ''}`}
                          subtitle={row.course?.department}
                          right={
                            <Pressable
                              style={styles.unlinkPill}
                              onPress={() =>
                                handleUnlink(row.professor.id, row.course.id)
                              }
                            >
                              <Text style={styles.unlinkPillTxt}>Desvincular</Text>
                            </Pressable>
                          }
                        />
                      ))
                    )}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 16,
    paddingBottom: 80, // más espacio para scrollear con teclado
    flexGrow: 1,
  },
  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  heroSub: { color: '#CBD5E1', marginTop: 6 },

  // TOGGLE TIPO PASTILLA
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 999,
    padding: 4,
    marginTop: 12,
  },
  toggleOption: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  toggleOptionActive: {
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  toggleText: {
    color: '#E2E8F0',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#0F172A',
  },

  label: { fontWeight: '600', color: '#334155' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    backgroundColor: '#fff',
  },
  inputErr: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  errText: { color: '#DC2626', fontSize: 12, marginTop: 6 },

  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { height: 4, width: 0 },
    elevation: 2,
  },
  itemSelected: { borderWidth: 1, borderColor: '#22C55E' },
  itemTitle: { fontWeight: '700', color: '#0F172A' },
  itemSub: { color: '#64748B', fontSize: 12, marginTop: 2 },
  itemCheck: { fontSize: 22, color: '#94A3B8', marginLeft: 8 },

  cta: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaTxt: { color: '#fff', fontWeight: '700' },

  empty: { color: '#64748B' },

  unlinkPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  unlinkPillTxt: { color: '#DC2626', fontWeight: '700' },

  section: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionHighlight: {
    color: '#0F172A',
    fontWeight: '600',
    marginBottom: 8,
  },
  connectNewBtn: {
    marginTop: 4,
    backgroundColor: '#0EA5E9',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectNewBtnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
