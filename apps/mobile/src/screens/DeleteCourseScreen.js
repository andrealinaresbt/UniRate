import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CourseService } from '../services/courseService';
import { useAuth } from '../services/AuthContext';
import { fetchIsAdmin } from '../services/AuthService';
import useDebouncedValue from '../hooks/useDebouncedValue';
import SearchBarDebounced from '../components/SearchBarDebounced';

const Row = ({ item, onDelete }) => (
  <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
    <View>
      <Text style={{ color: '#111827', fontWeight: '700' }}>{item.name}</Text>
      <Text style={{ color: '#6b7280', fontSize: 12 }}>{item.code || '—'}</Text>
    </View>
    <TouchableOpacity onPress={() => onDelete(item)} style={{ backgroundColor: '#dc2626', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}>
      <Text style={{ color: '#fff', fontWeight: '800' }}>Eliminar</Text>
    </TouchableOpacity>
  </View>
);

export default function DeleteCourseScreen() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 300);

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadList(term) {
    setLoading(true);
    const res = await CourseService.listAll(term);
    setList(res.success ? res.data : []);
    setLoading(false);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ok = await fetchIsAdmin(user?.email || '');
        if (alive) setIsAdmin(!!ok);
      } finally { if (alive) setChecking(false); }
    })();
    return () => { alive = false; };
  }, [user?.email]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await CourseService.listAll(debouncedQ);
        if (!alive) return;
        setList(res.success ? res.data : []);
      } catch {
        if (alive) setList([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [debouncedQ]);

  const confirmDelete = (course) => {
    Alert.alert(
      'Eliminar Materia',
      `Se borrará la materia y TODOS sus vínculos y reseñas.\n\n${course.name} (${course.code || 's/código'})`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await CourseService.deleteCourseCascade(course.id);
              if (!res.success) throw new Error(res.error);

              // ✅ Optimista: remover de la lista
              setList(prev => prev.filter(c => c.id !== course.id));

              // ✅ Mensaje de éxito
              Alert.alert('Listo', 'Materia eliminada correctamente.');

              // ✅ Refresco inmediato con filtro actual
              await loadList(q);
            } catch (e) {
              Alert.alert('Error', e.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (checking) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#fff' }}><ActivityIndicator /></View>;
  if (!isAdmin) {
    return <View style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: '#fff' }}>
      <Text style={{ color: '#111827', textAlign: 'center' }}>Solo administradores pueden eliminar.</Text>
    </View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <SearchBarDebounced value={q} onChangeText={setQ} placeholder="Buscar materia…" />
      {loading ? <ActivityIndicator style={{ marginTop: 12 }} /> :
        list.length === 0 ? (
          <Text style={{ color: '#6b7280', padding: 16 }}>No se han encontrado resultados.</Text>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(it) => String(it.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => <Row item={item} onDelete={confirmDelete} />}
          />
        )
      }
    </View>
  );
}
