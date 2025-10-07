// apps/mobile/src/screens/ViewReviewScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Modal,
  FlatList as RNFlatList,
} from 'react-native';

import { useAuth } from '../services/AuthContext';
import ReviewCard from '../components/ReviewCard';
import { getReviews } from '../services/reviewService';
import { ProfessorService } from '../services/professorService';
import { ReviewService } from '../services/reviewService'; // getAllCourses()

const COLORS = {
  bg: '#F6F7F8',
  primary: '#003087',
  accent: '#FF8200',
  text: '#1A1A1A',
  border: '#E0E3E7',
  muted: '#8A93A2',
  white: '#FFFFFF',
  chipBg: '#FFFFFF',
};

export default function ViewReviewScreen() {
  const { user } = useAuth();

  // catálogos
  const [profesores, setProfesores] = useState([]);
  const [materias, setMaterias] = useState([]);

  // filtros
  const [professorId, setProfessorId] = useState(null);
  const [courseId, setCourseId] = useState(null);

  // UI pickers
  const [openProfPicker, setOpenProfPicker] = useState(false);
  const [openCoursePicker, setOpenCoursePicker] = useState(false);

  // orden/paginación
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // data
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // vista limitada si no hay sesión
  const limited = useMemo(() => !user?.id, [user]);

  // cargar catálogos
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, c] = await Promise.all([
          ProfessorService.getAllProfessors(),
          ReviewService.getAllCourses(),
        ]);
        if (mounted) {
          if (p.success) setProfesores(p.data || []);
          if (c.success) setMaterias(c.data || []);
        }
      } catch (_) {
        // silencioso
      }
    })();
    return () => { mounted = false; };
  }, []);

  // cargar reseñas
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getReviews({
      professor_id: professorId || undefined,
      course_id: courseId || undefined,
      orderBy,
      order,
      limit: pageSize,
      offset: page * pageSize,
    }).then(res => {
      if (!mounted) return;
      if (res.success) {
        const data = res.data || [];
        if (limited) {
          const top3 = data.slice(0, 3);
          setItems(top3);
          setTotal(Math.min(res.total ?? top3.length, 3));
        } else {
          // concat si page>0, para efecto "cargar más"
          setItems(prev => page === 0 ? data : [...prev, ...data]);
          setTotal(res.total ?? (items.length + data.length));
        }
      } else {
        if (page === 0) setItems([]);
        setTotal(0);
      }
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professorId, courseId, orderBy, order, page, limited]);

  const resetFilters = () => {
    setProfessorId(null);
    setCourseId(null);
    setPage(0);
  };

  const applyProfessor = (id) => {
    setProfessorId(id);
    setPage(0);
    setOpenProfPicker(false);
  };
  const applyCourse = (id) => {
    setCourseId(id);
    setPage(0);
    setOpenCoursePicker(false);
  };

  const toggleOrder = () => {
    setOrder(o => (o === 'desc' ? 'asc' : 'desc'));
    setPage(0);
  };

  const onEndReached = () => {
    if (limited) return;                 // no infinite scroll en modo limitado
    if (items.length < total) setPage(p => p + 1);
  };

  const renderItem = ({ item }) => (
    <ReviewCard review={item} limited={limited} />
  );

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Reseñas</Text>

      {/* FILTROS: Profesor / Materia */}
      <View style={styles.filters}>
        <TouchableOpacity style={styles.select} onPress={() => setOpenProfPicker(true)}>
          <Text style={styles.selectText}>
            {professorId
              ? (profesores.find(p => p.id === professorId)?.full_name || 'Profesor seleccionado')
              : 'Profesor'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.select} onPress={() => setOpenCoursePicker(true)}>
          <Text style={styles.selectText}>
            {courseId
              ? (materias.find(m => m.id === courseId)?.name || 'Materia seleccionada')
              : 'Materia'}
          </Text>
        </TouchableOpacity>

        {(professorId || courseId) && (
          <TouchableOpacity style={[styles.clearChip]} onPress={resetFilters}>
            <Text style={styles.clearChipTxt}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ORDEN: recientes / calidad / dificultad + asc/desc */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.chip, orderBy === 'created_at' && styles.chipActive]}
          onPress={() => { setOrderBy('created_at'); setPage(0); }}
        >
          <Text style={[styles.chipTxt, orderBy === 'created_at' && styles.chipTxtActive]}>
            Recientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, orderBy === 'calidad' && styles.chipActive]}
          onPress={() => { setOrderBy('calidad'); setPage(0); }}
        >
          <Text style={[styles.chipTxt, orderBy === 'calidad' && styles.chipTxtActive]}>
            Mejor calidad
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, orderBy === 'dificultad' && styles.chipActive]}
          onPress={() => { setOrderBy('dificultad'); setPage(0); }}
        >
          <Text style={[styles.chipTxt, orderBy === 'dificultad' && styles.chipTxtActive]}>
            Mayor dificultad
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.chip} onPress={toggleOrder}>
          <Text style={styles.chipTxt}>{order === 'desc' ? '↓' : '↑'}</Text>
        </TouchableOpacity>
      </View>

      {limited && (
        <Text style={styles.notice}>
          Estás viendo una vista limitada. Inicia sesión para ver todas las reseñas.
        </Text>
      )}

      {loading && page === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <Text style={{ color: COLORS.muted, textAlign: 'center' }}>
              {professorId || courseId ? 'Sin reseñas para los filtros.' : 'Sin reseñas.'}
            </Text>
          }
          onEndReachedThreshold={0.3}
          onEndReached={onEndReached}
          ListFooterComponent={
            !limited && items.length < total && (
              <View style={{ paddingVertical: 10 }}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            )
          }
        />
      )}

      {/* Picker de Profesor */}
      <Modal
        visible={openProfPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenProfPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona profesor</Text>
            <RNFlatList
              data={profesores}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => applyProfessor(item.id)}
                >
                  <Text style={styles.modalItemText}>{item.full_name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Picker de Materia */}
      <Modal
        visible={openCoursePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenCoursePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona materia</Text>
            <RNFlatList
              data={materias}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => applyCourse(item.id)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.primary, marginBottom: 12 },

  filters: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  select: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.chipBg,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  selectText: { color: COLORS.text },

  clearChip: {
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#FFF4E6', borderWidth: 1, borderColor: COLORS.accent,
  },
  clearChipTxt: { color: COLORS.accent, fontWeight: '700' },

  controls: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.chipBg, borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: { borderColor: COLORS.accent },
  chipTxt: { color: COLORS.text, fontWeight: '600' },
  chipTxtActive: { color: COLORS.accent },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notice: { color: COLORS.muted, marginBottom: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: COLORS.white, borderRadius: 16, maxHeight: '70%', padding: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: COLORS.primary },
  modalItem: { paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalItemText: { fontSize: 14, color: COLORS.text },
});
