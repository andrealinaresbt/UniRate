import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Platform, KeyboardAvoidingView, 
  Modal, ScrollView
} from 'react-native'
import { registerUser } from '../services/RegisterService'
import { login } from '../services/AuthService'
import { isUnimetCorreoEmail } from '../utils/email'
import { validatePassword } from '../utils/email'

const CARRERAS = [
  'Ingeniería Civil',
  'Ingeniería Eléctrica',
  'Ingeniería Mecánica',
  'Ingeniería de Producción',
  'Ingeniería Química',
  'Ingeniería de Sistemas',
  'Ciencias Administrativas',
  'Economía Empresarial',
  'Contaduría Pública',
  'Psicología',
  'Matemáticas Industriales',
  'Educación',
  'Idiomas Modernos',
  'Comunicación Social y Empresarial',
  'Turismo Sostenible',
  'Derecho',
  'Estudios Liberales',
  'Estudios Internacionales'
]

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [carrera, setCarrera] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showCarreraModal, setShowCarreraModal] = useState(false)

  async function onRegister() {
    const e = email.trim()
    if (!e || !password || !confirmPassword) {
      return Alert.alert('Faltan datos', 'Completa todos los campos obligatorios.')
    }
    if (!isUnimetCorreoEmail(e)) {
      return Alert.alert('Email inválido', 'Usa tu correo @unimet.edu.ve o @correo.unimet.edu.ve.')
    }
    if (password !== confirmPassword) {
      return Alert.alert('Contraseña', 'Las contraseñas no coinciden.')
    }
    if (!validatePassword(password)) {
      return Alert.alert(
        'Contraseña inválida',
        'Debe tener mínimo 8 caracteres, incluir al menos 1 mayúscula, 1 número y 1 carácter especial.'
      )
    }
    try {
      setBusy(true)
      await registerUser({
        email: e,
        password,
        nombre: nombre.trim(),
        carrera: carrera
      })
      
      try {
        await login(e, password)
        navigation.navigate('Home')
      } catch (err) {
        Alert.alert('Registro exitoso', 'Tu cuenta ha sido creada exitosamente, verifica tu correo para iniciar sesión automáticamente.')
        navigation.goBack()
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo registrar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView 
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.c}>
          <Text style={s.title}>Crear cuenta</Text>

          <TextInput
            style={s.input}
            placeholder="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
          />

          <TextInput
            style={s.input}
            placeholder="Nombre (opcional)"
            value={nombre}
            onChangeText={setNombre}
            returnKeyType="next"
          />

          <TouchableOpacity onPress={() => setShowCarreraModal(true)}>
            <TextInput
              style={s.input}
              placeholder="Carrera (opcional)"
              value={carrera}
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>

          <Modal
            visible={showCarreraModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCarreraModal(false)}
          >
            <View style={s.modalOverlay}>
              <View style={s.modalContent}>
                <Text style={s.modalTitle}>Selecciona tu carrera</Text>
                {CARRERAS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={s.carreraOption}
                    onPress={() => {
                      setCarrera(c)
                      setShowCarreraModal(false)
                    }}
                  >
                    <Text style={s.carreraText}>{c}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => setShowCarreraModal(false)}>
                  <Text style={s.carreraCancel}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <TextInput
            style={s.input}
            placeholder="Contraseña"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
            returnKeyType="next"
          />

          <TextInput
            style={s.input}
            placeholder="Confirmar contraseña"
            secureTextEntry={!showPass}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            returnKeyType="done"
          />

          <TouchableOpacity style={s.toggle} onPress={() => setShowPass(v => !v)}>
            <Text style={s.toggleTxt}>{showPass ? 'Ocultar' : 'Ver'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.btn, busy && s.btnDis]} onPress={onRegister} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Registrarse</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>Volver al login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  c: { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'center', 
    gap: 12, 
    backgroundColor: '#F6F7F8',
    minHeight: '100%'
  },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 20, color: '#003087' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#CFE1FB',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#000', marginBottom: 8
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  toggle: {
    marginLeft: 8, paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#CFE1FB', alignSelf: 'flex-end'
  },
  toggleTxt: { color: '#2B529A', fontWeight: '600' },
  btn: {
    height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FF8200', marginTop: 6
  },
  btnDis: { opacity: 0.6 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  back: { textAlign: 'center', color: '#2B529A', marginTop: 12, fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '80%', alignItems: 'center'
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  carreraOption: { paddingVertical: 10, width: '100%' },
  carreraText: { fontSize: 16, color: '#2563EB', textAlign: 'center' },
  carreraCancel: { marginTop: 16, color: '#888', fontWeight: '600', fontSize: 16 }
})