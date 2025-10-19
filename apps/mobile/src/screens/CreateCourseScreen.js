// apps/mobile/src/screens/CreateCourseScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { CourseService } from '../services/courseService';

const Row = ({ label, value, onChangeText }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ color: '#374151', marginBottom: 6 }}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={label}
      placeholderTextColor="#9ca3af"
      autoCapitalize="characters"
      style={{ color: '#111827', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb' }}
    />
  </View>
);

export default function CreateCourseScreen() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [department, setDepartment] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async () => {
    const n = name.trim(), c = code.trim(), d = department.trim();
    if (!n || !c || !d) { Alert.alert('Campos requeridos', 'Nombre, Código y Departamento son obligatorios.'); return; }
    try {
      setSaving(true);
      const res = await CourseService.createCourse({ name: n, code: c, department: d });
      if (!res.success) throw new Error(res.error);
      setName(''); setCode(''); setDepartment('');
      Alert.alert('Listo', 'Materia creada correctamente.');
    } catch (e) { Alert.alert('Error', e.message); } finally { setSaving(false); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ color: '#111827', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Crear Materia</Text>
      <Row label="Nombre" value={name} onChangeText={setName} />
      <Row label="Código" value={code} onChangeText={setCode} />
      <Row label="Departamento" value={department} onChangeText={setDepartment} />
      <TouchableOpacity onPress={onSubmit} disabled={saving} style={{ backgroundColor: '#1f6feb', padding: 14, borderRadius: 12, opacity: saving ? 0.7 : 1 }}>
        <Text style={{ color: '#fff', fontWeight: '800', textAlign: 'center' }}>{saving ? 'Guardando…' : 'Crear Materia'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
