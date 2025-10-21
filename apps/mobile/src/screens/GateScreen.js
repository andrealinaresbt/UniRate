import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext'; // added
import LoginScreen from './LoginScreen';

const COLORS = {
  bg: '#F6F7F8',
  white: '#FFFFFF',
  text: '#1A1A1A',
  muted: '#6B7280',
  primary: '#003087',
  border: '#E5E7EB'
};

export default function ReviewAccessGateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const reviewId = route.params?.reviewId;
  const { user } = useAuth(); // added

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const goAuth = () => {
    navigation.navigate('AuthModal', { redirectTo: { type: 'review', reviewId } });
  };
  const goWriteReview = () => {
    navigation.navigate('CreateReview', { prefill: {}, fromGate: true });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🔒</Text>
          {user ? (
            <>
              <Text style={styles.title}>Publica una reseña para seguir</Text>
              <Text style={styles.subtitle}>
                Has alcanzado el límite de lectura. Escribe una reseña para reactivar el acceso.
              </Text>
              <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('NuevaResena')}>
                <Text style={styles.primaryBtnText}>Escribir reseña</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={goHome}>
                <Text style={styles.secondaryBtnText}>Volver al inicio</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Sigue leyendo reseñas</Text>
              <Text style={styles.subtitle}>
                Crea una cuenta o inicia sesión para acceder a más reseñas.
              </Text>
              <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.primaryBtnText}>Iniciar sesión</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={goHome}>
                <Text style={styles.secondaryBtnText}>Cancelar y volver al inicio</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: 'center'
  },
  emoji: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.primary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginTop: 6, marginBottom: 18 },
  primaryBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    marginBottom: 10
  },
  primaryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center'
  },
  secondaryBtnText: { color: COLORS.text, fontWeight: '600', fontSize: 15 }
});
