import React, { useState } from 'react';
import { Header } from '../components/DarkHeader';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCourseDetails } from '../hooks/useCourseDetails';
import SearchResultItem from '../components/SearchResultItem';
import BackHeader from '../components/BackHeader';


// 🎨 Colores
const COLORS = {
  seasalt: '#F6F7F8',
  utOrange: '#FF8200',
  columbiaBlue: '#CFE1FB',
  yinmnBlue: '#4C78C9',
  resolutionBlue: '#003087',
};

export default function CourseScreen() {
  const route = useRoute();
  const { courseId } = route.params;

  const {
    course,
    reviews,
    loading,
    error,
    avgSatisfaccion,
    avgDificultad,
    professorsAggregated,
  } = useCourseDetails(courseId);

  const [selectedProfessor, setSelectedProfessor] = useState(null);

  const filteredReviews = selectedProfessor
    ? reviews.filter((r) => r.professor_id === selectedProfessor)
    : reviews;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.utOrange} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>Error: {error}</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.center}>
        <Text>No se encontró la materia</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.utOrange }}>
  <BackHeader
    onBack={() => navigation.navigate('HomeScreen')}
  />
      {/* Header naranja */}
      <View
        style={{
          paddingVertical: 40,
          paddingHorizontal: 20,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: '#FFF',
            textAlign: 'center',
          }}
        >
          {course.name}
        </Text>
        
      </View>

      {/* ScrollView con resto del contenido */}
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          backgroundColor: COLORS.seasalt,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Promedios */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>⭐ Calificación</Text>
            <Text style={styles.statValue}>{avgSatisfaccion ?? 'N/A'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>📉 Dificultad</Text>
            <Text style={styles.statValue}>{avgDificultad ?? 'N/A'}</Text>
          </View>
        </View>

        {/* Profesores */}
        <Text style={styles.sectionTitle}>Profesores</Text>
        <FlatList
          data={professorsAggregated}
          keyExtractor={(item, index) => String(item.professor_id || index)}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
          renderItem={({ item }) => (
            <SearchResultItem
              item={{
                full_name: item.nombre,
                avg_score: item.avgRating,
                review_count: item.reviewsCount,
                type: 'professor',
              }}
              onPress={() =>
                setSelectedProfessor(
                  selectedProfessor === item.professor_id
                    ? null
                    : item.professor_id
                )
              }
            />
          )}
        />

        {/* Reseñas */}
        <Text style={styles.sectionTitle}>Reseñas</Text>
        {filteredReviews.length === 0 ? (
          <Text>No hay reseñas todavía.</Text>
        ) : (
          <FlatList
            data={filteredReviews}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false} // evita conflictos con ScrollView
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewProfessor}>
                  {item.professor_id ? professorsAggregated.find(p => p.professor_id === item.professor_id)?.nombre || 'Profesor desconocido' : 'Profesor desconocido'}
                </Text>
                <Text style={styles.reviewDate}>
                  {new Date(item.created_at).toLocaleDateString('es-ES')}
                </Text>
                <Text>Satisfacción: {item.score}</Text>
                <Text>Dificultad: {item.difficulty}</Text>
                <Text style={styles.reviewComment}>
                  {item.comment || 'Sin comentario'}
                </Text>
              </View>
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#EBEAEA',
    padding: 14,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.resolutionBlue,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    color: COLORS.yinmnBlue,
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.utOrange,
  },
  reviewCard: {
    backgroundColor: COLORS.columbiaBlue,
    padding: 14,
    marginVertical: 8,
    borderRadius: 12,
  },
  reviewProfessor: {
    fontWeight: '600',
    fontSize: 15,
    color: COLORS.yinmnBlue,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.resolutionBlue,
    marginBottom: 6,
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
});
