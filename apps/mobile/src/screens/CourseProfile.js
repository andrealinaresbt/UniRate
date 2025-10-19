import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCourseDetails } from '../hooks/useCourseDetails';
import { EventBus } from '../utils/EventBus';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { favoritesService } from '../services/favoritesService';
import SearchResultItem from '../components/SearchResultItem';
import BackHeader from '../components/BackHeader';

const COLORS = {
  seasalt: '#F6F7F8',
  utOrange: '#FF8200',
  columbiaBlue: '#CFE1FB',
  yinmnBlue: '#4C78C9',
  resolutionBlue: '#003087',
};

export default function CourseScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { courseId } = route.params;
  const { user } = useAuth();

  const {
    course,
    reviews,
    loading,
    error,
    avgSatisfaccion,
    avgDificultad,
    professorsAggregated,
    refetch,
  } = useCourseDetails(courseId);

  const isFocused = useIsFocused();

  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const filteredReviews = selectedProfessor
    ? reviews.filter((r) => r.professor_id === selectedProfessor)
    : reviews;

  useEffect(() => {
    if (user?.id && courseId) {
      checkIfFavorite();
    }
  }, [user?.id, courseId]);

  useEffect(() => {
    const offU = EventBus.on('review:updated', ({ id } = {}) => refetch());
    const offD = EventBus.on('review:deleted', ({ id } = {}) => refetch());
    if (isFocused) refetch();
    return () => { offU(); offD(); };
  }, [courseId, isFocused]);

  const checkIfFavorite = async () => {
    try {
      const favorite = await favoritesService.isFavorite(user.id, 'course', courseId, null);
      setIsFavorite(!!favorite);
      setFavoriteId(favorite);
    } catch (error) {
      console.error('Error verificando favorito:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert('Iniciar sesión', 'Debes iniciar sesión para agregar favoritos');
      navigation.navigate('Login');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        if (favoriteId) {
          await favoritesService.removeFavorite(favoriteId);
        } else {
          await favoritesService.removeFavoriteByReference(user.id, 'course', courseId, null);
        }
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        const newFavorite = await favoritesService.addFavorite(user.id, 'course', courseId, null);
        setIsFavorite(true);
        setFavoriteId(newFavorite.id);
      }
    } catch (error) {
      console.error('Error al modificar favoritos:', error);
      Alert.alert('Error', 'No se pudo actualizar favoritos');
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.utOrange} />
      </View>
    );

  if (error)
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>Error: {error}</Text>
      </View>
    );

  if (!course)
    return (
      <View style={styles.center}>
        <Text>No se encontró la materia</Text>
      </View>
    );

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.utOrange }}>
      <BackHeader onBack={() => navigation.navigate('HomeScreen')} />

      {/* Header con corazón */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.courseTitle}>{course.name}</Text>
        </View>

        <TouchableOpacity
          style={styles.heartButton}
          onPress={toggleFavorite}
          disabled={favoriteLoading}
        >
          <Text style={[styles.heartIcon, isFavorite && styles.heartIconActive]}>
            {favoriteLoading ? '⋯' : isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          backgroundColor: COLORS.seasalt,
        }}
        showsVerticalScrollIndicator={false}
      >
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
                  selectedProfessor === item.professor_id ? null : item.professor_id
                )
              }
            />
          )}
        />

        <Text style={styles.sectionTitle}>Reseñas</Text>
        {filteredReviews.length === 0 ? (
          <Text>No hay reseñas todavía.</Text>
        ) : (
          <FlatList
            data={filteredReviews}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.reviewCard}
                onPress={() => navigation.navigate('ReviewDetail', { reviewId: item.id })}
              >
                <Text style={styles.reviewProfessor}>
                  {item.professor_id
                    ? professorsAggregated.find(
                        (p) => p.professor_id === item.professor_id
                      )?.nombre || 'Profesor desconocido'
                    : 'Profesor desconocido'}
                </Text>
                <Text style={styles.reviewDate}>
                  {new Date(item.created_at).toLocaleDateString('es-ES')}
                </Text>
                <Text>Satisfacción: {item.score}</Text>
                <Text>Dificultad: {item.difficulty}</Text>
                <Text style={styles.reviewComment}>
                  {item.comment || 'Sin comentario'}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingVertical: 50,
    paddingTop: 80,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: { flex: 1 },
  courseTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  heartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  heartIcon: { fontSize: 24 },
  heartIconActive: {},
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#EBEAEA',
    padding: 14,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
  },
  statLabel: { color: COLORS.resolutionBlue, fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 18, color: COLORS.yinmnBlue, fontWeight: 'bold' },
  sectionTitle: { marginBottom: 8, fontSize: 18, fontWeight: '700', color: COLORS.utOrange },
  reviewCard: { backgroundColor: COLORS.columbiaBlue, padding: 14, marginVertical: 8, borderRadius: 12 },
  reviewProfessor: { fontWeight: '600', fontSize: 15, color: COLORS.yinmnBlue, marginBottom: 4 },
  reviewDate: { fontSize: 12, color: COLORS.resolutionBlue, marginBottom: 6 },
  reviewComment: { fontSize: 14, color: '#333', marginTop: 4 },
});
