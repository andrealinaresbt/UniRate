// apps/mobile/src/screens/FAQScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';

export default function FAQScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Preguntas Frecuentes</Text>

      <View style={styles.block}>
        <Text style={styles.question}>¿Qué es UniRate?</Text>
        <Text style={styles.answer}>
          UniRate es una app donde los estudiantes pueden ver y dejar reseñas sobre profesores y materias.
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.question}>¿Necesito cuenta para ver reseñas?</Text>
        <Text style={styles.answer}>
          Puedes ver algunas reseñas sin iniciar sesión. Para votar o publicar reseñas y acceder a más contenido, necesitas una cuenta.
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.question}>¿Cómo creo una cuenta?</Text>
        <Text style={styles.answer}>
          Ve a la pantalla de inicio de sesión y selecciona "Registrarse". Se recomienda usar el correo institucional indicado por la universidad.
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.question}>¿Cómo publico una reseña?</Text>
        <Text style={styles.answer}>
          Inicia sesión, presiona el botón "+" en la pantalla principal y completa el formulario con la información requerida.
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.question}>¿Puedo editar o borrar mi reseña?</Text>
        <Text style={styles.answer}>
          Sí. En "Mis reseñas" puedes editar o eliminar las reseñas que hayas publicado.
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.question}>¿Qué pasa con reseñas ofensivas?</Text>
        <Text style={styles.answer}>
          Las reseñas que incumplen las normas pueden ser reportadas por usuarios autenticados. Tras varios reportes, son revisadas y pueden ser ocultadas o eliminadas por el equipo administrador.
        </Text>
      </View>

      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F8',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#003087',
  },
  block: {
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 2 },
    }),
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#003087',
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    opacity: 0.95,
  },
});
