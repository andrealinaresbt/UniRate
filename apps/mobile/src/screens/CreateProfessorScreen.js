// src/screens/CreateProfessorScreen.js
import React, { useState } from 'react';
import {
  Text, TextInput, Button, Alert, ActivityIndicator,
  ScrollView, StyleSheet, View
} from 'react-native';
import { ProfessorService } from '../services/professorService';
import { isUnimetCorreoEmail, validateEmailFormat } from '../utils/email';

const LETTERS_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s'-]+$/; // letras, espacios, apóstrofe y guion

export default function CreateProfessorScreen({ navigation }) {
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    escuela: '',
    departamento: '',
    correo: '',
    descripcion: '',
    foto: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    // limpiar error en cuanto el usuario escribe
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const canNavigateToDetails = () => {
    try {
      const names = navigation.getState()?.routeNames || [];
      return Array.isArray(names) && names.includes('ProfessorDetails');
    } catch { return false; }
  };

  function validate() {
    const e = {};
    const nombres = form.nombres.trim();
    const apellidos = form.apellidos.trim();
    const escuela = form.escuela.trim();
    const correo = form.correo.trim();

    // Requeridos
    if (!nombres) e.nombres = 'El nombre es obligatorio.';
    if (!apellidos) e.apellidos = 'El apellido es obligatorio.';
    if (!escuela) e.escuela = 'La escuela es obligatoria.';

    // Solo letras (con acentos) para nombres y apellidos
    if (nombres && !LETTERS_REGEX.test(nombres)) {
      e.nombres = 'Solo letras y espacios.';
    }
    if (apellidos && !LETTERS_REGEX.test(apellidos)) {
      e.apellidos = 'Solo letras y espacios.';
    }

    // Correo (opcional) -> formato + dominio único
    if (correo) {
      if (!validateEmailFormat(correo)) {
        e.correo = 'Formato de correo inválido.';
      } else if (!isUnimetCorreoEmail(correo)) {
        e.correo = 'Debe ser @correo.unimet.edu.ve';
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    try {
      if (!validate()) return;

      setLoading(true);

      const full_name = `${form.nombres.trim()} ${form.apellidos.trim()}`
        .replace(/\s+/g, ' ')
        .trim();

      const payload = {
        full_name,
        department: form.departamento.trim() || null,
        university: form.escuela.trim(),
      };

      const { success, error, data, code } = await ProfessorService.createProfessor(payload);

      if (!success) {
        if (code === 'DUPLICATE') {
          // marcar en rojo los 3 campos que definen duplicado
          setErrors(prev => ({
            ...prev,
            nombres: prev.nombres || 'Ya existe un profesor con ese Nombre + Apellido + Escuela.',
            apellidos: prev.apellidos || 'Ya existe un profesor con ese Nombre + Apellido + Escuela.',
            escuela: prev.escuela || 'Ya existe un profesor con ese Nombre + Apellido + Escuela.',
          }));
          Alert.alert('Profesor ya registrado', 'Nombre + Apellido + Escuela ya existe.');
          return;
        }
        throw new Error(error || 'No se pudo crear el profesor');
      }

      Alert.alert('Profesor creado', `Se creó: ${data.full_name}`);

      // reset del form
      setForm({
        nombres: '',
        apellidos: '',
        escuela: '',
        departamento: '',
        correo: '',
        descripcion: '',
        foto: '',
      });
      setErrors({});

      // Redirección (si existe pantalla de detalle)
      if (canNavigateToDetails()) {
        navigation.navigate('ProfessorDetails', { id: data.id });
      } else {
        navigation.navigate('Admin');
      }
    } catch (e) {
      Alert.alert('Error', String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (field) => [
    s.input,
    errors[field] ? s.inputError : null,
  ];

  const Helper = ({ field }) =>
    errors[field] ? <Text style={s.helperError}>{errors[field]}</Text> : null;

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Crear Profesor</Text>

      <View style={s.group}>
        <Text>Nombre(s)</Text>
        <TextInput
          style={inputStyle('nombres')}
          value={form.nombres}
          onChangeText={v => onChange('nombres', v)}
          placeholder="Ej. Juan Carlos"
        />
        <Helper field="nombres" />
      </View>

      <View style={s.group}>
        <Text>Apellido(s)</Text>
        <TextInput
          style={inputStyle('apellidos')}
          value={form.apellidos}
          onChangeText={v => onChange('apellidos', v)}
          placeholder="Ej. Pérez"
        />
        <Helper field="apellidos" />
      </View>

      <View style={s.group}>
        <Text>Escuela (se guarda en "university")</Text>
        <TextInput
          style={inputStyle('escuela')}
          value={form.escuela}
          onChangeText={v => onChange('escuela', v)}
          placeholder="Ej. UNIMET"
        />
        <Helper field="escuela" />
      </View>

      <View style={s.group}>
        <Text>Departamento (opcional)</Text>
        <TextInput
          style={inputStyle('departamento')}
          value={form.departamento}
          onChangeText={v => onChange('departamento', v)}
          placeholder="Ej. Matemáticas"
        />
        <Helper field="departamento" />
      </View>

      <View style={s.group}>
        <Text>Correo (opcional, solo @correo.unimet.edu.ve)</Text>
        <TextInput
          style={inputStyle('correo')}
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.correo}
          onChangeText={v => onChange('correo', v)}
          placeholder="nombre.apellido@correo.unimet.edu.ve"
        />
        <Helper field="correo" />
      </View>

      <View style={s.group}>
        <Text>Descripción (opcional)</Text>
        <TextInput
          style={[inputStyle('descripcion'), { minHeight: 80 }]}
          multiline
          value={form.descripcion}
          onChangeText={v => onChange('descripcion', v)}
          placeholder="Breve reseña del profesor"
        />
        <Helper field="descripcion" />
      </View>

      <View style={s.group}>
        <Text>Foto (URL, opcional)</Text>
        <TextInput
          style={inputStyle('foto')}
          autoCapitalize="none"
          value={form.foto}
          onChangeText={v => onChange('foto', v)}
          placeholder="https://..."
        />
        <Helper field="foto" />
      </View>

      {loading ? <ActivityIndicator /> : <Button title="Guardar" onPress={handleSave} />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  group: { marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  inputError: {
    borderColor: '#DC2626', // rojo 600
    backgroundColor: '#FEF2F2', // rojo 50
  },
  helperError: {
    marginTop: 6,
    color: '#DC2626',
    fontSize: 12,
  },
});
