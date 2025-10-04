// screens/LoginScreen.jsx
import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Platform, KeyboardAvoidingView
} from 'react-native'
import { login, resetPassword } from '../services/AuthService'
import { isUnimetEmail } from '../utils/email'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function onLogin() {
    const e = email.trim()
    if (!e || !password) return Alert.alert('Faltan datos', 'Ingresa email y contraseña.')
    if (!isUnimetEmail(e)) return Alert.alert('Email inválido', 'Usa tu correo @unimet.edu.ve o @correo.unimet.edu.ve.')

    try {
      setBusy(true)
      const session = await login(e, password)
      if (!session?.user?.id) throw new Error('Sesión inválida')

      // Navega al Home y limpia la pila
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }

  function onForgotPassword() {
    if (!email.trim()) {
      Alert.alert('Recuperar contraseña', 'Por favor ingresa tu correo en el campo de email.');
      return;
    }
    resetPassword(email.trim())
      .then(() => {
        Alert.alert('Recuperar contraseña', 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.');
      })
      .catch(err => {
        Alert.alert('Error', err.message || 'No se pudo enviar el correo de recuperación.');
      });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <View style={s.c}>
        <Text style={s.title}>Iniciar sesión</Text>

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

        <View style={s.row}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="Contraseña"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={onLogin}
            returnKeyType="done"
          />
          <TouchableOpacity style={s.toggle} onPress={() => setShowPass(v => !v)}>
            <Text style={s.toggleTxt}>{showPass ? 'Ocultar' : 'Ver'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[s.btn, busy && s.btnDis]} onPress={onLogin} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('RegisterScreen')}>
          <Text style={s.link}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onForgotPassword}>
          <Text style={s.link}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  c: { flex: 1, padding: 24, justifyContent: 'center', gap: 12, backgroundColor: '#F6F7F8' },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#003087'
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#CFE1FB',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#000'
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  toggle: {
    marginLeft: 8, paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#CFE1FB'
  },
  toggleTxt: { color: '#2B529A', fontWeight: '600' },
  btn: {
    height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FF8200', marginTop: 6
  },
  btnDis: { opacity: 0.6 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: '#003087', marginTop: 6, fontWeight: '600' },
  back: { textAlign: 'center', color: '#2B529A', marginTop: 6, fontWeight: '600' },
})

