import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { CourseService } from '../services/courseService';
import useDebouncedValue from '../hooks/useDebouncedValue';
import SearchBarDebounced from '../components/SearchBarDebounced';

const Row = ({ label, value, onChangeText }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ color: '#374151', marginBottom: 6 }}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={label}
      placeholderTextColor="#9ca3af"
      style={{ color: '#111827', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb' }}
    />
  </View>
);

const Item = ({ item, onPress }) => (
  <TouchableOpacity onPress={() => onPress(item)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
    <Text style={{ color: '#111827', fontWeight: '700' }}>{item.name}</Text>
    <Text style={{ color: '#6b7280', fontSize: 12 }}>{item.code || '—'}</Text>
  </TouchableOpacity>
);

export default function EditCourseScreen() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 300);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', department: '' });

  async function loadList(term) {
    setLoading(true);
    const res = await CourseService.listAll(term);
    setList(res.success ? res.data : []);
    setLoading(false);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await CourseService.listAll(debouncedQ);
      if (alive) setList(res.success ? res.data : []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [debouncedQ]);

  const selectCourse = (c) => {
    setSelected(c);
    setForm({ name: c.name || '', code: c.code || '', department: c.department || '' });
  };

  const save = async () => {
    try {
      if (!selected) return;
      const res = await CourseService.updateCourse(selected.id, form);
      if (!res.success) throw new Error(res.error);
      Alert.alert('Listo', 'Materia actualizada correctamente.');
      setSelected(null);
      setQ('');
      await loadList('');
    } catch (e) { Alert.alert('Error', e.message); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {!selected ? (
        <>
          <SearchBarDebounced value={q} onChangeText={setQ} placeholder="Buscar materia por nombre o código…" />
          {loading ? <ActivityIndicator style={{ marginTop: 12 }} /> :
            list.length === 0 ? <Text style={{ color: '#6b7280', padding: 16 }}>No se han encontrado resultados.</Text> :
              <FlatList data={list} keyExtractor={(it) => String(it.id)} renderItem={({ item }) => <Item item={item} onPress={selectCourse} />} />
          }
        </>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={{ color: '#111827', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Editar Materia</Text>
          <Row label="Nombre" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          <Row label="Código" value={form.code} onChangeText={(v) => setForm({ ...form, code: v })} />
          <Row label="Departamento" value={form.department} onChangeText={(v) => setForm({ ...form, department: v })} />

          <TouchableOpacity onPress={save} style={{ backgroundColor: '#f59e0b', padding: 14, borderRadius: 12, marginTop: 6 }}>
            <Text style={{ textAlign: 'center', color: '#111827', fontWeight: '800' }}>Guardar cambios</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelected(null)} style={{ padding: 14, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ color: '#6b7280', textAlign: 'center' }}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}
