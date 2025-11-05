import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../services/AuthContext';
import { ProfessorService } from '../services/professorService';
import { markReviewWritten } from '../services/ReviewAccess';
import { getReviewById, ReviewService, updateReview, ReviewValidators } from '../services/reviewService';
import { EventBus } from '../utils/EventBus';

//importa helpers para cruzar Profesor↔Materia
import {
  getCoursesByProfessor,
  getProfessorsByCourse,
  isValidProfessorCoursePair,
} from '../services/reviewService';

const SCROLL_OFFSET = 120;

const TAGS = [
  'Exigente',
  'Explica claro',
  'Corrige fuerte',
  'Muchos proyectos',
  'Muy teórico',
  'Abre debate',
  'Corrige rápido',
  'Pocos parciales',
  'Muchas evaluaciones',
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

const ACCESSORY_ID = 'commentAccessoryBar';
const ACC_SCORE   = 'acc_score';
const ACC_DIFF    = 'acc_diff';
const ACC_COMMENT = 'acc_comment';

// Chips rápidos 1–5 para marcar calificación/dificultad
function QuickScaleRow({ value, onSelect }) {
  return (
    <View style={styles.quickRow}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = String(value) === String(n);
        return (
          <TouchableOpacity
            key={n}
            onPress={() => {
              onSelect(String(n));
              Keyboard.dismiss();
            }}
            style={[styles.quickChip, active && styles.quickChipActive]}
          >
            <Text style={[styles.quickChipText, active && styles.quickChipTextActive]}>{n}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function NuevaResenaScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const editReview = route.params?.editReview;
  const { user } = useAuth();

  // Origen y params para prellenado
  const source = route.params?.source ?? null; // 'ProfessorProfile' | 'CourseProfile' | null
  const prefillType = route.params?.prefillType ?? null; // 'professor' | 'course' | null
  const prefillProfessorId = route.params?.professorId ?? null;
  const prefillCourseId = route.params?.courseId ?? null;
  const allowPrefill = source === 'ProfessorProfile' || source === 'CourseProfile';

  // catálogos
  const [profesores, setProfesores] = useState([]);
  const [materias, setMaterias] = useState([]);

  const [commentError, setCommentError] = useState(null); // string|null

  // selección
  const [profesorId, setProfesorId] = useState(null);
  const [materiaId, setMateriaId] = useState(null);

  // conjuntos permitidos según la otra selección (null = sin restricción)
  const [allowedCourseIds, setAllowedCourseIds] = useState(null);     // Set<number|string> | null
  const [allowedProfessorIds, setAllowedProfessorIds] = useState(null); // Set<number|string> | null

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

  // Buscadores en modales
  const [profQuery, setProfQuery] = useState('');
  const [courseQuery, setCourseQuery] = useState('');

  // refs para scroll a campos
  const scrollRef = useRef(null);
  const anchors = useRef({}); // {puntuacionY, dificultadY, comentarioY}

  const VERIFY_SAVE = false;
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // cargar catálogos
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [p, c] = await Promise.all([
          ProfessorService.getAllProfessors(),
          ReviewService.getAllCourses(),
        ]);
        if (p.success) {
          const ordenadosP = (p.data || []).sort((a, b) =>
            (a.full_name || '').localeCompare(b.full_name || '', 'es', { sensitivity: 'base' })
          );
          setProfesores(ordenadosP);
        }
        if (c.success) {
          const ordenadosC = (c.data || []).sort((a, b) =>
            (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' })
          );
          setMaterias(ordenadosC);
        }
      } catch (_) {
        Alert.alert('Error', 'No fue posible cargar los catálogos.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // prellenado si venimos de perfil (y no estamos editando)
  useEffect(() => {
    if (editReview) return;
    if (!allowPrefill) return;
    if (prefillType === 'professor' && prefillProfessorId) setProfesorId(prefillProfessorId);
    if (prefillType === 'course' && prefillCourseId) setMateriaId(prefillCourseId);
  }, [allowPrefill, prefillType, prefillProfessorId, prefillCourseId, editReview]);

  // si venimos en modo edición, prefilar campos
  useEffect(() => {
    if (!editReview) return;
    try {
      setProfesorId(editReview.professor_id || editReview.professor_id);
      setMateriaId(editReview.course_id || editReview.course_id);
      setAsistencia(!!editReview.asistencia);
      setUsoTexto(!!editReview.uso_texto || !!editReview.usoTexto);
      setCalidad(String(editReview.calidad ?? editReview.score ?? ''));
      setDificultad(String(editReview.dificultad ?? editReview.difficulty ?? ''));
      setVolveria(!!editReview.volveria || !!editReview.would_take_again);
      setComentario(editReview.comentario ?? editReview.comment ?? '');
      setEtiquetas(Array.isArray(editReview.etiquetas) ? editReview.etiquetas : (editReview.tags || []));
    } catch (_) {}
  }, [editReview]);

  // Cargar borrador guardado (si lo hay) — no si hay edición o prellenado
  useEffect(() => {
    if (editReview || allowPrefill) return;
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
  }, [editReview, allowPrefill]);

  // Autosave borrador (no en edición)
  useEffect(() => {
    if (editReview) return;
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
    editReview,
  ]);

    // helpers para moverse entre modales / limpiar filtro ====
  const closeCoursePicker = () => setOpenCoursePicker(false);

  const goChangeProfessor = () => {
    setOpenCoursePicker(false);
    setOpenProfPicker(true);
  };

  const clearProfessorFilter = () => {
    setProfesorId(null);
    setAllowedCourseIds(null);
    setOpenCoursePicker(false);
    setOpenProfPicker(true);
  };

  // cuando seleccionas PROFESOR → restringe materias válidas
  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!profesorId) {
        setAllowedCourseIds(null); // sin restricción
        return;
      }
      try {
        const list = await getCoursesByProfessor(profesorId);
        if (canceled) return;
        const ids = new Set((list || []).map(c => c.id));
        setAllowedCourseIds(ids);

        // si hay una materia seleccionada que no pertenece, límpiala
        if (materiaId && !ids.has(materiaId)) setMateriaId(null);
      } catch (e) {
        // si falla, no restringimos
        setAllowedCourseIds(null);
      }
    })();
    return () => { canceled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profesorId]);

  //cuando seleccionas MATERIA → restringe profesores válidos
  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!materiaId) {
        setAllowedProfessorIds(null); // sin restricción
        return;
      }
      try {
        const list = await getProfessorsByCourse(materiaId);
        if (canceled) return;
        const ids = new Set((list || []).map(p => p.id));
        setAllowedProfessorIds(ids);

        // si hay un profesor seleccionado que no dicta esa materia, límpialo
        if (profesorId && !ids.has(profesorId)) setProfesorId(null);
      } catch (e) {
        setAllowedProfessorIds(null);
      }
    })();
    return () => { canceled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaId]);

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

    const v = ReviewValidators.validateComment(comentario || '');
    if (!v.ok) return v.hits?.length ? `${v.reason}: ${v.hits[0]}` : v.reason;

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

    // validación servidor de la dupla profesor-curso
    try {
      const validPair = await isValidProfessorCoursePair(profesorId, materiaId);
      if (!validPair) {
        setStatus('error');
        Alert.alert('Combinación inválida', 'Ese profesor no dicta esa materia.');
        return;
      }
    } catch (_) {
      // si no podemos validar, seguimos y dejamos que el backend grite
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
      // duplicate fields usados en otras pantallas/esquemas
      score: parseInt(calidad, 10),
      score_teacher: parseInt(calidad, 10),
      difficulty: parseInt(dificultad, 10),
      comment: comentario,
      would_take_again: volveria,
    };

    const withTimeout = (p, ms = 15000) =>
      Promise.race([
        p,
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
      ]);

    let res;
    try {
      if (editReview?.id) {
        res = await withTimeout(updateReview(editReview.id, payload), 15000);
      } else {
        res = await withTimeout(ReviewService.createReview(payload), 15000);
      }
    } catch (e) {
      res = { success: false, error: e?.message || String(e) };
    } finally {
      setSubmitting(false);
    }

    if (res && res.success) {
      setStatus('exito');
      await AsyncStorage.removeItem('draft_review');
      Alert.alert('¡Listo!', 'Reseña publicada con éxito.');
      if (editReview?.id) EventBus.emit('review:updated', { id: editReview.id });
      else EventBus.emit('review:created');
      try {
        if (user?.id) await markReviewWritten(user.id);
      } catch (e) {
        console.log('markReviewWritten error', e);
      }
      if (editReview?.id) {
        try {
          const check = await getReviewById(editReview.id);
          if (check?.success && check.data) {
            const saved = check.data;
            const message = `Guardado: ${saved.comment ?? saved.comentario ?? '-'} (${saved.score ?? saved.calidad ?? '-'})`;
            if (VERIFY_SAVE) {
              Alert.alert('Verificación', message);
            } else {
              console.log('[verify-save]', message, saved);
            }
          }
        } catch (_) {}
      }
      // go to Home instead of going back
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } else {
      setStatus('error');
      let friendlyMsg = 'No se pudo publicar la reseña. Conservamos tus datos, intenta de nuevo.';
      const errMsg = (res?.error || '').toLowerCase();
      if (
        errMsg.includes('duplicate') ||
        errMsg.includes('unique constraint') ||
        errMsg.includes('already exists')
      ) {
        friendlyMsg = 'Ya has publicado una reseña para este profesor y materia. Solo se permite una reseña por combinación.';
      }
      Alert.alert('⚠️ No se pudo guardar', friendlyMsg);
    }
  };

  // filtros (ordenan también)
  const filteredProfesores = useMemo(() => {
    const q = profQuery.trim().toLowerCase();
    let lista = profesores.filter((p) =>
      (p.full_name || '').toLowerCase().includes(q)
    );

    // si hay restricción por materia seleccionada, filtramos
    if (allowedProfessorIds instanceof Set) {
      lista = lista.filter(p => allowedProfessorIds.has(p.id));
    }

    return lista.sort((a, b) =>
      (a.full_name || '').localeCompare(b.full_name || '', 'es', { sensitivity: 'base' })
    );
  }, [profQuery, profesores, allowedProfessorIds]);

  const filteredMaterias = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    let lista = materias.filter((m) => {
      const name = (m.name || '').toLowerCase();
      const code = (m.code || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    });

    // si hay restricción por profesor seleccionado, filtramos
    if (allowedCourseIds instanceof Set) {
      lista = lista.filter(m => allowedCourseIds.has(m.id));
    }

    return lista.sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' })
    );
  }, [courseQuery, materias, allowedCourseIds]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.text }}>Cargando datos…</Text>
      </View>
    );
  }

  // helpers de scroll a anclas
  const scrollTo = (key, extra = 0) => {
    const y = anchors.current[key] ?? 0;
    const target = Math.max(y - (SCROLL_OFFSET + extra), 0);
    // pequeño defer para asegurar que el teclado terminó de animar
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: target, animated: true });
    });
  };

  // ----- UI con teclado cómodo y botón fijo -----
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            style={styles.screen}
            contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Text style={styles.title}>Publicar Reseña</Text>

            {/* Profesor */}
            <Text style={styles.label}>
              Profesor
              <Text style={styles.asterisk}> *</Text>
            </Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => {
                setProfQuery('');
                setOpenProfPicker(true);
                Keyboard.dismiss();
              }}
            >
              <Text style={styles.selectText}>
                {profesorId
                  ? profesores.find((p) => p.id === profesorId)?.full_name ||
                    'Profesor seleccionado'
                  : 'Selecciona un profesor'}
              </Text>
            </TouchableOpacity>

            {/* Materia */}
            <Text style={styles.label}>
              Materia
              <Text style={styles.asterisk}> *</Text>
            </Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => {
                setCourseQuery('');
                setOpenCoursePicker(true);
                Keyboard.dismiss();
              }}
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
              <Text style={styles.labelInline}>¿Toma asistencia?</Text>
              <Switch
                value={asistencia}
                onValueChange={setAsistencia}
                trackColor={{ true: COLORS.secondary, false: '#C8CCD4' }}
                thumbColor={asistencia ? COLORS.accent : COLORS.white}
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.labelInline}>¿La materia es mayormente teórica?</Text>
              <Switch
                value={usoTexto}
                onValueChange={setUsoTexto}
                trackColor={{ true: COLORS.secondary, false: '#C8CCD4' }}
                thumbColor={usoTexto ? COLORS.accent : COLORS.white}
              />
            </View>

              {/* Puntuación */}
              <View onLayout={(e) => (anchors.current.puntuacionY = e.nativeEvent.layout.y)}>
                <Text style={styles.label}>
                  Puntuación
                  <Text style={styles.asterisk}> *</Text>
                </Text>
                <Text style={styles.helper2}>1: menor puntuación    5: mayor puntuación</Text>

                {/* Solo botones 1–5 */}
                <QuickScaleRow
                  value={calidad}
                  onSelect={(val) => {
                    setCalidad(val);   // '1'..'5' (string)
                    Keyboard.dismiss();
                  }}
                />

                <Text style={styles.helper}>
                  {calidad ? `Seleccionado: ${calidad}` : 'Toca un número para seleccionar'}
                </Text>
              </View>


              {/* Dificultad */}
              <View onLayout={(e) => (anchors.current.dificultadY = e.nativeEvent.layout.y)}>
                <Text style={styles.label}>
                  Dificultad
                  <Text style={styles.asterisk}> *</Text>
                </Text>
                <Text style={styles.helper2}>1: menor dificultad        5: mayor dificultad</Text>

                {/* Solo botones 1–5 */}
                <QuickScaleRow
                  value={dificultad}
                  onSelect={(val) => {
                    setDificultad(val);       // '1'..'5' (string)
                    Keyboard.dismiss();
                  }}
                />

                <Text style={styles.helper}>
                  {dificultad ? `Seleccionado: ${dificultad}` : 'Toca un número para seleccionar'}
                </Text>
              </View>


            {/* Volvería */}
            <View style={styles.row}>
              <Text style={styles.labelInline}>¿Recomendarías este profesor?</Text>
              <Switch
                value={volveria}
                onValueChange={setVolveria}
                trackColor={{ true: COLORS.secondary, false: '#C8CCD4' }}
                thumbColor={volveria ? COLORS.accent : COLORS.white}
              />
            </View>

            {/* Comentario */}
            <View
              onLayout={(e) => (anchors.current.comentarioY = e.nativeEvent.layout.y)}
            >
              <Text style={styles.label}>Comentario</Text>
              <TextInput
                style={[styles.input, { minHeight: 90 }]}
                value={comentario}
                onFocus={() => scrollTo('comentarioY',20)}
                onChangeText={(t) => {
                  setComentario(t);
                  const v = ReviewValidators.validateComment(t);
                  setCommentError(!v.ok ? (v.hits?.length ? `${v.reason}: ${v.hits[0]}` : v.reason) : null);
                }}
                placeholder="Escribe tu experiencia…"
                multiline
                maxLength={300}
                placeholderTextColor={COLORS.muted}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
                inputAccessoryViewID={ACC_COMMENT} 
              />
              <Text style={styles.helper}>{comentario.length}/300 caracteres</Text>
              {commentError ? (
                <Text style={[styles.helper, { color: '#E53935', alignSelf: 'flex-start' }]}>
                  {commentError}
                </Text>
              ) : null}
            </View>

            {/* Etiquetas */}
            <Text style={styles.label}>Etiquetas (máx. 3)</Text>
            <View style={styles.tagsWrap}>
              {TAGS.map((tag) => {
                const active = etiquetas.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tag, active && styles.tagActive]}
                    onPress={() => {
                      toggleEtiqueta(tag);
                      Keyboard.dismiss();
                    }}
                  >
                    <Text style={[styles.tagText, active && styles.tagTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* Botón EN EL CONTENIDO (no fijo) */}
            <TouchableOpacity
              style={[styles.button, (submitting || commentError) && { opacity: 0.6 }]}
              disabled={submitting || !!commentError}
              onPress={() => {
                Keyboard.dismiss();
                handleSubmit();
              }}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Enviar Reseña</Text>
              )}
            </TouchableOpacity>

            {status !== 'idle' && (
              <Text style={styles.footerHelper}>
                {status === 'validando' && 'Validando…'}
                {status === 'enviando' && 'Enviando…'}
                {status === 'exito' && '✅ Enviado correctamente'}
                {status === 'error' && '⚠️ Revisa los datos e inténtalo de nuevo'}
              </Text>
            )}

            {/* Espacio final para que no quede pegado al borde */}
            <View style={{ height: 24 }} />


            {/* Espaciador para que el último campo no quede tapado */}
            <View style={{ height: 40 }} />
          </ScrollView>


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

                {/* Barra de búsqueda */}
                <View style={styles.searchRow}>
                  <TextInput
                    style={styles.searchInput}
                    value={profQuery}
                    onChangeText={setProfQuery}
                    placeholder="Buscar profesor…"
                    placeholderTextColor={COLORS.muted}
                    autoFocus
                    returnKeyType="search"
                    onSubmitEditing={Keyboard.dismiss}   // cerrar teclado al hacer “search”
                    clearButtonMode="while-editing"
                  />
                  {!!profQuery && (
                    <TouchableOpacity
                      style={styles.clearX}
                      onPress={() => {
                        setProfQuery('');
                        Keyboard.dismiss();
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.clearXText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {filteredProfesores.length === 0 ? (
                  <Text style={styles.emptyText}>No hay resultados</Text>
                ) : (
                  <FlatList
                    data={filteredProfesores}
                    keyExtractor={(item) => String(item.id)}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"          // 👈 arrastrando se oculta el teclado
                    onScrollBeginDrag={Keyboard.dismiss}   // 👈 en cuanto scrolleas, se oculta
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => {
                          setProfesorId(item.id);
                          setOpenProfPicker(false);
                          Keyboard.dismiss();
                        }}
                      >
                        <Text style={styles.modalItemText}>{item.full_name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            </View>
          </Modal>


      {/* Picker Materia */}
      <Modal
        visible={openCoursePicker}
        transparent
        animationType="fade"
        onRequestClose={closeCoursePicker}
      >
        <TouchableWithoutFeedback onPress={closeCoursePicker}>
          <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={() => {}}>
                              <View style={styles.modalCard}>
                                {/* ===== Header de acciones ===== */}
                <View style={styles.modalHeaderRow}>
                  <TouchableOpacity onPress={closeCoursePicker} style={styles.headerBtnGhost}>
                    <Text style={styles.headerBtnGhostText}>Cancelar</Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', gap: 8 }}>

                    <TouchableOpacity onPress={goChangeProfessor} style={styles.headerBtnPrimary}>
                      <Text style={styles.headerBtnPrimaryText}>Cambiar profesor</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.modalTitle}>Selecciona materia</Text>

                {/* Barra de búsqueda */}
                <View style={styles.searchRow}>
                  <TextInput
                    style={styles.searchInput}
                    value={courseQuery}
                    onChangeText={setCourseQuery}
                    placeholder="Buscar materia o código…"
                    placeholderTextColor={COLORS.muted}
                    autoFocus
                    returnKeyType="search"
                    onSubmitEditing={Keyboard.dismiss}
                    clearButtonMode="while-editing"
                  />
                  {!!courseQuery && (
                    <TouchableOpacity
                      style={styles.clearX}
                      onPress={() => {
                        setCourseQuery('');
                        Keyboard.dismiss();
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.clearXText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

              {filteredMaterias.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No hay materias disponibles.</Text>
                  <TouchableOpacity onPress={goChangeProfessor} style={styles.emptyBtnPrimary}>
                    <Text style={styles.emptyBtnPrimaryText}>Cambiar profesor</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={filteredMaterias}
                  keyExtractor={(item) => String(item.id)}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  onScrollBeginDrag={Keyboard.dismiss}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        setMateriaId(item.id);
                        setOpenCoursePicker(false);
                        Keyboard.dismiss();
                      }}
                    >
                      <Text style={styles.modalItemText}>
                        {item.name} {item.code ? `(${item.code})` : ''}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              )}

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>


          {Platform.OS === 'ios' && (
            <>
              <InputAccessoryView nativeID={ACC_SCORE}>
                <View style={styles.accessoryBar}>
                  <Text style={styles.accessoryHint}>Listo con el teclado</Text>
                  <TouchableOpacity onPress={Keyboard.dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.accessoryBtn}>
                    <Text style={styles.accessoryBtnText}>Ocultar teclado</Text>
                  </TouchableOpacity>
                </View>
              </InputAccessoryView>

              <InputAccessoryView nativeID={ACC_DIFF}>
                <View style={styles.accessoryBar}>
                  <Text style={styles.accessoryHint}>Listo con el teclado</Text>
                  <TouchableOpacity onPress={Keyboard.dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.accessoryBtn}>
                    <Text style={styles.accessoryBtnText}>Ocultar teclado</Text>
                  </TouchableOpacity>
                </View>
              </InputAccessoryView>

              <InputAccessoryView nativeID={ACC_COMMENT}>
                <View style={styles.accessoryBar}>
                  <Text style={styles.accessoryHint}>Listo con el teclado</Text>
                  <TouchableOpacity onPress={Keyboard.dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.accessoryBtn}>
                    <Text style={styles.accessoryBtnText}>Ocultar teclado</Text>
                  </TouchableOpacity>
                </View>
              </InputAccessoryView>
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20 },
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
  asterisk: {
    color: '#E53935',
    fontWeight: '700',
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
    marginBottom: 10,
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
    marginTop: -4,
    marginBottom: 8,
  },
  helper2: {
    fontSize: 12,
    color: COLORS.muted,
    alignSelf: 'flex-start',
    marginTop: -4,
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

  // Chips 1–5
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  quickChip: {
    minWidth: 40,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  quickChipActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  quickChipText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  quickChipTextActive: {
    color: COLORS.white,
  },

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

  // Footer sticky
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: -2 },
      },
      android: { elevation: 8 },
    }),
  },
  button: {
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: COLORS.white, fontWeight: '700' },

  footerHelper: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },

  // Modales
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    maxHeight: '80%',
    padding: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: COLORS.primary },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  emptyText: { textAlign: 'center', color: COLORS.muted, paddingVertical: 16 },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemText: { fontSize: 14, color: COLORS.text },
  accessoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F2F3F5',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D6DAE1',
  },
  searchRow: {
    position: 'relative',
    marginBottom: 8,
  },
  clearX: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9EEF5',
  },
  clearXText: {
    color: '#334155',
    fontWeight: '700',
  },
  accessoryHint: {
    fontSize: 13,
    color: '#6B7280',
  },
  accessoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
  },
  accessoryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
    // Header acciones modal (nuevo)
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerBtnGhost: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerBtnGhostText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  headerBtnOutline: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerBtnOutlineText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerBtnPrimary: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
  },
  headerBtnPrimaryText: {
    color: COLORS.white,
    fontWeight: '700',
  },
    emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyBtnOutline: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  emptyBtnOutlineText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyBtnPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
  },
  emptyBtnPrimaryText: {
    color: COLORS.white,
    fontWeight: '700',
  },
});
