import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Keyboard,
  TouchableOpacity,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useIsFocused } from "@react-navigation/native";
import { useCourseDetails } from "../hooks/useCourseDetails";
import { EventBus } from '../utils/EventBus';
import { useAuth } from '../services/AuthContext';
import { favoritesService } from '../services/favoritesService';
import { filterService } from '../services/filterService';
import SearchResultItem from "../components/SearchResultItem";
import BackHeader from "../components/BackHeader";
import FilterModal from "../components/FilterModal";
import FloatingReviewButton from "../components/FloatingReviewButton";

const COLORS = {
  seasalt: "#F6F7F8",
  utOrange: "#FF8200",
  columbiaBlue: "#CFE1FB",
  yinmnBlue: "#4C78C9",
  resolutionBlue: "#003087",
};

export default function CourseProfile({ navigation }) {
  const route = useRoute();
  const isFocused = useIsFocused();
  const { user } = useAuth();

  // Params desde navegación (Home → CourseProfile)
  const { courseId, courseName: courseNameParam } = route.params ?? {};
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const s1 = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const s2 = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  // ========= Hook de datos de la materia =========
  const {
    course,
    reviews,
    professorsAggregated, 
    avgSatisfaccion,      
    avgDificultad,        
    loading,
    error,
    refetch,
  } = useCourseDetails(courseId);

  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  // Estados para filtros
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({});
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({});

  // Stabilize refetch
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  // Verificar si el curso es favorito al cargar
  useEffect(() => {
    if (user && courseId) {
      checkIfFavorite();
    }
  }, [user, courseId]);

  // Refresh details when a review is updated/deleted or when screen focus changes
  useEffect(() => {
    const onUpdated = () => refetchRef.current?.();
    const onDeleted = () => refetchRef.current?.();
    const offU = EventBus.on("review:updated", onUpdated);
    const offD = EventBus.on("review:deleted", onDeleted);
    return () => {
      offU();
      offD();
    };
  }, []);

  // Refetch cuando la pantalla entra en foco
  useEffect(() => {
    if (isFocused) {
      refetchRef.current?.();
    }
  }, [isFocused]);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    applyFilters();
  }, [reviews, filters, selectedProfessor]);

  const checkIfFavorite = async () => {
    try {
      const favorite = await favoritesService.isFavorite(
        user.id,
        'course',
        courseId,
        null
      );
      setIsFavorite(!!favorite);
      setFavoriteId(favorite);
    } catch (error) {
      console.error('Error verificando favorito:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) return;
    
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        // Eliminar de favoritos
        if (favoriteId) {
          await favoritesService.removeFavorite(favoriteId);
        } else {
          await favoritesService.removeFavoriteByReference(
            user.id,
            'course',
            courseId,
            null
          );
        }
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        // Agregar a favoritos
        const newFavorite = await favoritesService.addFavorite(
          user.id,
          'course',
          courseId,
          null
        );
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

  const applyFilters = async () => {
    
    // Si filters está vacío, limpiar todo
    if (!filters || Object.keys(filters).length === 0) {
      
      const finalReviews = selectedProfessor
        ? reviews.filter((r) => r.professor_id === selectedProfessor)
        : reviews;
      setFilteredReviews(finalReviews);
      setAppliedFilters({});
      return;
    }
    
    // Limpiar filtros - eliminar propiedades con valores null/undefined o por defecto
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      
      // Solo incluir filtros que tienen valores válidos y no son los valores por defecto
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'minRating' && value === 1) {
          return;
        }
        if (key === 'maxRating' && value === 5) {
          return;
        }
        if (key === 'minDifficulty' && value === 1) {
          return;
        }
        if (key === 'maxDifficulty' && value === 5) {
          return;
        }
        if (key === 'sortBy' && value === 'newest') {
          return;
        }
        cleanFilters[key] = value;
      }
    });


    // Si no hay filtros activos después de limpiar
    if (Object.keys(cleanFilters).length === 0) {
      const finalReviews = selectedProfessor
        ? reviews.filter((r) => r.professor_id === selectedProfessor)
        : reviews;
      setFilteredReviews(finalReviews);
      setAppliedFilters({});
      return;
    }

    try {
      const filtered = await filterService.getFilteredReviews(cleanFilters, {
        courseId: courseId
      });
      
      setFilteredReviews(filtered);
      setAppliedFilters(cleanFilters);
    } catch (error) {
      console.error('Error applying filters en CourseProfile:', error);
      // En caso de error, mostrar reseñas base
      const finalReviews = selectedProfessor
        ? reviews.filter((r) => r.professor_id === selectedProfessor)
        : reviews;
      setFilteredReviews(finalReviews);
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  };

  const handleClearFilters = () => {
    // Resetear a valores por defecto explícitamente
    const defaultFilters = {
      courseId: null,
      professorId: null,
      minRating: 1,
      maxRating: 5,
      minDifficulty: 1,
      maxDifficulty: 5,
      startDate: null,
      endDate: null,
      sortBy: 'newest'
    };
    
    setFilters(defaultFilters);
    setAppliedFilters({});
    setFilterModalVisible(false);
    
    // Forzar mostrar todas las reseñas
    const finalReviews = selectedProfessor
      ? reviews.filter((r) => r.professor_id === selectedProfessor)
      : reviews;
    setFilteredReviews(finalReviews);
  };

  const getActiveFiltersCount = () => {
    // Verificación segura - si appliedFilters es null/undefined o vacío
    if (!appliedFilters || Object.keys(appliedFilters).length === 0) {
      return 0;
    }
    
    let count = 0;
    if (appliedFilters.courseId) count++;
    if (appliedFilters.professorId) count++;
    if (appliedFilters.minRating > 1 || appliedFilters.maxRating < 5) count++;
    if (appliedFilters.minDifficulty > 1 || appliedFilters.maxDifficulty < 5) count++;
    if (appliedFilters.startDate || appliedFilters.endDate) count++;
    if (appliedFilters.sortBy && appliedFilters.sortBy !== 'newest') count++;
    return count;
  };

  const getDisplayReviews = () => {
    // Si hay appliedFilters activos, usar filteredReviews
    if (appliedFilters && Object.keys(appliedFilters).length > 0) {
      return filteredReviews;
    }
    
    // Si no hay filtros, mostrar según selección de profesor
    return selectedProfessor
      ? reviews.filter((r) => r.professor_id === selectedProfessor)
      : reviews;
  };

  // Helper seguro para nombre
  const courseName = course?.name ?? courseNameParam ?? "Materia";

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
        <Text style={{ color: "red" }}>Error: {error}</Text>
      </View>
    );
  }
  if (!course && !courseNameParam) {
    return (
      <View style={styles.center}>
        <Text>Materia no encontrada</Text>
      </View>
    );
  }

  const displayReviews = getDisplayReviews();

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ backgroundColor: COLORS.utOrange }} />
      
      {/* Header con corazón */}
      <View style={{ backgroundColor: COLORS.utOrange }}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.courseTitle}>{courseName}</Text>
            {course?.code && <Text style={styles.subtitle}>{course.code}</Text>}
          </View>
          {user && (
            <TouchableOpacity 
              style={styles.heartButton}
              onPress={toggleFavorite}
              disabled={favoriteLoading}
            >
              <Text style={[styles.heartIcon, isFavorite && styles.heartIconActive]}>
                {favoriteLoading ? '⋯' : (isFavorite ? '❤️' : '🤍')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contenido */}
      <View style={{ flex: 1, backgroundColor: COLORS.seasalt }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>⭐ Calificación</Text>
              <Text style={styles.statValue}>{avgSatisfaccion ?? "N/A"}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>📉 Dificultad</Text>
              <Text style={styles.statValue}>{avgDificultad ?? "N/A"}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>📊 Total reseñas</Text>
              <Text style={styles.statValue}>{reviews.length}</Text>
            </View>
          </View>

          {/* SECCIÓN DE PROFESORES - CORREGIDA */}
          {Array.isArray(professorsAggregated) && professorsAggregated.length > 0 && (
            <>
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
                      setSelectedProfessor(selectedProfessor === item.professor_id ? null : item.professor_id)
                    }
                  />
                )}
              />
            </>
          )}

          {/* Sección de Reseñas con Botón de Filtros */}
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reseñas</Text>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setFilterModalVisible(true)}
            >
              <Text style={styles.filterButtonText}>
                Filtros{getActiveFiltersCount() > 0 ? `(${getActiveFiltersCount()})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mostrar filtros activos */}
          {getActiveFiltersCount() > 0 && (
            <View style={styles.activeFilters}>
              <Text style={styles.activeFiltersText}>
                Filtros aplicados: {getActiveFiltersCount()}
              </Text>
              <TouchableOpacity onPress={handleClearFilters}>
                <Text style={styles.clearFiltersText}>Limpiar</Text>
              </TouchableOpacity>
            </View>
          )}

          {displayReviews.length === 0 ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No se encontraron reseñas</Text>
              {getActiveFiltersCount() > 0 && (
                <Text style={styles.noResultsSubtext}>
                  Intenta con otros filtros
                </Text>
              )}
            </View>
          ) : (
            <FlatList
              data={displayReviews}
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
                  <Text style={styles.reviewStats}>
                    ⭐ {item.score} | 📉 {item.difficulty}/5
                  </Text>
                  <Text style={styles.reviewComment}>{item.comment || "Sin comentario"}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </ScrollView>
      </View>

      {/* Modal de Filtros */}
      <FilterModal
        key={`filter-modal-${JSON.stringify(filters)}`}
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
        context={{ courseId }}
        currentFilters={filters}
      />

      {/* FAB: crear reseña para ESTA materia (con tooltip + prellenado) */}
      {user && !keyboardVisible && (course || courseId) && (
        <FloatingReviewButton
          label="Crear reseña"
          onPress={() =>
            navigation.navigate('NuevaResena', {
              source: 'CourseProfile',
              prefillType: 'course',
              courseId: course?.id ?? courseId,
              courseName: course?.name ?? courseNameParam,
            })
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingVertical: 52,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  courseTitle: { 
    fontSize: 28, 
    fontWeight: "bold", 
    color: "#FFF", 
    textAlign: "center" 
  },
  subtitle: { 
    fontSize: 16, 
    color: "rgba(255,255,255,0.8)", 
    textAlign: "center",
    marginTop: 8
  },
  heartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    position: 'absolute',
    right: 20,
  },
  heartIcon: { fontSize: 24 },
  heartIconActive: {},
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 16 
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.columbiaBlue,
    padding: 14,
    borderRadius: 12,
    marginRight: 12,
    alignItems: "center",
  },
  statLabel: { 
    color: COLORS.resolutionBlue, 
    fontWeight: "600", 
    marginBottom: 4,
    fontSize: 12 
  },
  statValue: { 
    fontSize: 18, 
    color: COLORS.yinmnBlue, 
    fontWeight: "bold" 
  },
  sectionTitle: { 
    marginBottom: 8, 
    fontSize: 18, 
    fontWeight: "700", 
    color: COLORS.utOrange 
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.yinmnBlue,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.yinmnBlue,
  },
  activeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.columbiaBlue,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  activeFiltersText: {
    fontSize: 14,
    color: COLORS.resolutionBlue,
    fontWeight: '500',
  },
  clearFiltersText: {
    fontSize: 14,
    color: COLORS.utOrange,
    fontWeight: '600',
  },
  reviewCard: { 
    backgroundColor: COLORS.columbiaBlue, 
    padding: 14, 
    marginVertical: 8, 
    borderRadius: 12 
  },
  reviewProfessor: { 
    fontWeight: '600', 
    fontSize: 15, 
    color: COLORS.yinmnBlue, 
    marginBottom: 4 
  },
  reviewDate: { 
    fontSize: 12, 
    color: COLORS.resolutionBlue, 
    marginBottom: 6 
  },
  reviewStats: {
    fontSize: 12,
    color: COLORS.resolutionBlue,
    marginBottom: 8,
    fontWeight: '500',
  },
  reviewComment: { 
    fontSize: 14, 
    color: '#333', 
    marginTop: 4 
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#888',
  },
});