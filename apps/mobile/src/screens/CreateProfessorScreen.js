// apps/mobile/src/screens/CreateProfessorScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../services/AuthContext';
import { fetchIsAdmin } from '../services/AuthService';
import { ProfessorService } from '../services/professorService';

// --- Componente Row fuera del principal (para evitar que se cierre el teclado)
function Row({ label, value, onChangeText, returnKeyType = 'next', onSubmitEditing }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: '#374151', marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor="#9ca3af"
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={false}
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
}

export default function CreateProfessorScreen() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ok = await fetchIsAdmin(user?.email || '');
        if (alive) setIsAdmin(!!ok);
      } finally {
        if (alive) setChecking(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.email]);

  const onSubmit = async () => {
    try {
      const f = firstName.trim();
      const l = lastName.trim();
      const d = department.trim();

      if (!f || !l || !d) {
        Alert.alert(
          'Campos requeridos',
          'Nombre, Apellido y Departamento son obligatorios.'
        );
        return;
      }

      setSaving(true);
      const full_name = `${f} ${l}`;
      const universidad = 'UNIMET'; // Valor fijo

      const res = await ProfessorService.createProfessor({
        full_name,
        department: d,
        university: universidad,
      });

      if (!res?.success) throw new Error(res?.error || 'No se pudo crear el profesor');

      setFirstName('');
      setLastName('');
      setDepartment('');
      Alert.alert('Listo', 'Profesor creado correctamente.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Ocurrió un error inesperado');
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 16,
          backgroundColor: '#fff',
        }}
      >
        <Text style={{ color: '#111827', textAlign: 'center' }}>
          Solo administradores pueden crear profesores.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        style={{
          color: '#111827',
          fontSize: 18,
          fontWeight: '800',
          marginBottom: 8,
        }}
      >
        Crear Profesor
      </Text>

      <Row label="Nombre" value={firstName} onChangeText={setFirstName} />
      <Row label="Apellido" value={lastName} onChangeText={setLastName} />
      <Row
        label="Departamento"
        value={department}
        onChangeText={setDepartment}
        returnKeyType="done"
      />

      <TouchableOpacity
        disabled={saving}
        onPress={onSubmit}
        style={{
          backgroundColor: '#1f6feb',
          padding: 14,
          borderRadius: 12,
          opacity: saving ? 0.7 : 1,
        }}
      >
        <Text
          style={{
            color: '#fff',
            fontWeight: '800',
            textAlign: 'center',
          }}
        >
          {saving ? 'Guardando…' : 'Crear Profesor'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
