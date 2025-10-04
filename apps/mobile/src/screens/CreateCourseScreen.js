import React, { useState } from 'react';
import {
  Text, TextInput, Button, Alert, ActivityIndicator,
  ScrollView, StyleSheet, View
} from 'react-native';
import { CourseService } from '../services/courseService';

const LETTERS_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s'-]+$/; // para name y department
const CODE_REGEX = /^[A-Z0-9_-]{2,20}$/;               // MAYÚSCULAS, números, _ y -, 2–20 chars

export default function CreateCourseScreen({ navigation }) {
  const [form, setForm] = useState({
    code: '',
    name: '',
    department: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (k, v) => {
    const next = k === 'code' ? v.toUpperCase() : v;
    setForm(p => ({ ...p, [k]: next }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    const department = form.department.trim();

    if (!code) e.code = 'El código es obligatorio.';
    if (!name) e.name = 'El nombre es obligatorio.';
    if (!department) e.department = 'El departamento es obligatorio.';

    if (code && !CODE_REGEX.test(code)) {
      e.code = 'Solo MAYÚSCULAS, números, _ o -, 2–20 caracteres.';
    }
    if (name && !LETTERS_REGEX.test(name)) {
      e.name = 'Solo letras y espacios.';
    }
    if (department && !LETTERS_REGEX.test(department)) {
      e.department = 'Solo letras y espacios.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const inputStyle = (field) => [styles.input, errors[field] ? styles.inputError : null];
  const Helper = ({ field }) => errors[field] ? (
    <Text style={styles.helperError}>{errors[field]}</Text>
  ) : null;

  const goBackToAdmin = () => {
    // navega de forma robusta al panel admin
    try {
      navigation.navigate('Admin');
    } catch {
      // fallback
      navigation.reset({ index: 0, routes: [{ name: 'Admin' }] });
    }
  };

  async function handleSave() {
    if (!validate()) return;

    setLoading(true);

    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim().replace(/\s+/g, ' '),
        department: form.department.trim().replace(/\s+/g, ' '),
      };

      const { success, error, data, code } = await CourseService.createCourse(payload);

      // 🔑 apagamos el loading AHORA, antes del Alert / navegación
      setLoading(false);

      if (!success) {
        if (code === 'DUPLICATE') {
          setErrors(prev => ({
            ...prev,
            code: prev.code || 'Código o combinación nombre+departamento ya existe.',
            name: prev.name || 'Código o combinación nombre+departamento ya existe.',
            department: prev.department || 'Código o combinación nombre+departamento ya existe.',
          }));
          Alert.alert('Materia duplicada', 'Revise el código o el nombre/departamento.');
          return;
        }
        Alert.alert('Error', String(error || 'No se pudo crear la materia.'));
        return;
      }

      // éxito
      Alert.alert('Materia creada', `${data.code} — ${data.name}`, [
        { text: 'OK', onPress: goBackToAdmin },
      ]);

      // reset formulario
      setForm({ code: '', name: '', department: '' });
      setErrors({});
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', String(e.message || e));
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Crear Materia</Text>

      <View style={styles.group}>
        <Text>Código</Text>
        <TextInput
          style={inputStyle('code')}
          autoCapitalize="characters"
          value={form.code}
          onChangeText={v => onChange('code', v)}
          placeholder="EJ: BPTM102"
        />
        <Helper field="code" />
      </View>

      <View style={styles.group}>
        <Text>Nombre</Text>
        <TextInput
          style={inputStyle('name')}
          value={form.name}
          onChangeText={v => onChange('name', v)}
          placeholder="Ej: Física I"
        />
        <Helper field="name" />
      </View>

      <View style={styles.group}>
        <Text>Departamento</Text>
        <TextInput
          style={inputStyle('department')}
          value={form.department}
          onChangeText={v => onChange('department', v)}
          placeholder="Ej: Matemáticas"
        />
        <Helper field="department" />
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title="Guardar" onPress={handleSave} disabled={loading} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  group: { marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    padding: 10, marginTop: 4,
  },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  helperError: { marginTop: 6, color: '#DC2626', fontSize: 12 },
});
