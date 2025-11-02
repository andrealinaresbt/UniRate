import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { ProfessorService } from '../services/professorService';
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
      autoCapitalize="words"
      style={{
        color: '#111827',
        backgroundColor: '#f3f4f6',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
      }}
    />
  </View>
);

const Item = ({ item, onPress }) => (
  <TouchableOpacity
    onPress={() => onPress(item)}
    style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}
  >
    <Text style={{ color: '#111827', fontWeight: '700' }}>{item.full_name}</Text>
    <Text style={{ color: '#6b7280', fontSize: 12 }}>{item.university || '—'}</Text>
  </TouchableOpacity>
);

export default function EditProfessorScreen() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 300);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  // dejo university en el form para no romper el update
  const [form, setForm] = useState({ full_name: '', department: '', university: '' });

  async function loadList(term) {
    setLoading(true);
    const res = await ProfessorService.listAll(term);
    setList(res.success ? res.data : []);
    setLoading(false);
  }

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      const res = await ProfessorService.listAll(debouncedQ);
      if (live) setList(res.success ? res.data : []);
      setLoading(false);
    })();
    return () => {
      live = false;
    };
  }, [debouncedQ]);

  const selectItem = (p) => {
    setSelected(p);
    // sigo guardando university pero NO lo muestro
    setForm({
      full_name: p.full_name || '',
      department: p.department || '',
      university: p.university || '',
    });
  };

  const save = async () => {
    try {
      if (!selected) return;
      const res = await ProfessorService.updateProfessor(selected.id, form);
      if (!res.success) throw new Error(res.error);
      Alert.alert('Listo', 'Profesor actualizado correctamente.');
      setSelected(null);
      setQ(''); // limpia el filtro
      await loadList(''); // refresco inmediato
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {!selected ? (
        <>
          <SearchBarDebounced value={q} onChangeText={setQ} placeholder="Buscar profesor por nombre…" />
          {loading ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : list.length === 0 ? (
            <Text style={{ color: '#6b7280', padding: 16 }}>No se han encontrado resultados.</Text>
          ) : (
            <FlatList
              data={list}
              keyExtractor={(it) => String(it.id)}
              renderItem={({ item }) => <Item item={item} onPress={selectItem} />}
            />
          )}
        </>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={{ color: '#111827', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>
            Editar Profesor
          </Text>


          <Row
            label="Nombre completo"
            value={form.full_name}
            onChangeText={(v) => setForm({ ...form, full_name: v })}
          />
          <Row
            label="Departamento"
            value={form.department}
            onChangeText={(v) => setForm({ ...form, department: v })}
          />


          <TouchableOpacity
            onPress={save}
            style={{ backgroundColor: '#f59e0b', padding: 14, borderRadius: 12, marginTop: 6 }}
          >
            <Text style={{ textAlign: 'center', color: '#111827', fontWeight: '800' }}>Guardar cambios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelected(null)}
            style={{
              padding: 14,
              borderRadius: 12,
              marginTop: 10,
              borderWidth: 1,
              borderColor: '#e5e7eb',
            }}
          >
            <Text style={{ color: '#6b7280', textAlign: 'center' }}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}
