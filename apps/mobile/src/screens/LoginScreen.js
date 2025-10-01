import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Platform, 
  KeyboardAvoidingView 
} from 'react-native';
import { login } from '../services/AuthService';
import { isUnimetEmail } from '../utils/email';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function onLogin() {
  const e = email.trim();
  if (!e || !password) {
    Alert.alert('Faltan datos', 'Ingresa email y contraseña.');
    return;
  }
  if (!isUnimetEmail(e)) {
    Alert.alert('Email inválido', 'Usa tu correo @unimet.edu.ve o @correo.unimet.edu.ve.');
    return;
  }
  try {
    setBusy(true);
    await login(e, password);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  } catch (err) {
    Alert.alert('Error', err.message || 'No se pudo iniciar sesión.');
  } finally {
    setBusy(false);
  }
}

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <View style={s.c}>
        
        {/* Título centrado */}
        <Text style={s.title}>Iniciar sesión</Text>

        <TextInput
          style={s.input}
          placeholder="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={s.row}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="Contraseña"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={onLogin}
          />
          <TouchableOpacity style={s.toggle} onPress={() => setShowPass(v => !v)}>
            <Text style={s.toggleTxt}>{showPass ? 'Ocultar' : 'Ver'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[s.btn, busy && s.btnDis]} onPress={onLogin} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={s.link}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>Volver</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, padding: 24, justifyContent: 'center', gap: 12, backgroundColor: '#F5F5F7' },
  title: { 
    fontSize: 26, 
    fontWeight: '700', 
    textAlign: 'center', 
    alignSelf: 'center', 
    marginBottom: 20, 
    color: '#0D2C54' 
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggle: { paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  toggleTxt: { color: '#2563EB', fontWeight: '600' },
  btn: { height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB' },
  btnDis: { opacity: 0.6 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: '#0D2C54', marginTop: 6, fontWeight: '600' },
  back: { textAlign: 'center', color: '#2563EB', marginTop: 6, fontWeight: '600' },
});
