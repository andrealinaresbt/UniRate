import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useIsFocused } from "@react-navigation/native";
import { useProfessorDetails } from "../hooks/useProfessorDetails";
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

export default function ProfessorProfile({ navigation }) {
  const route = useRoute();
  const { professorId } = route.params;
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const s1 = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const s2 = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );
    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  const {
    professor,
    reviews,
    avgRating,
    avgDifficulty,
    wouldTakeAgain,
    topTags,
    coursesTaught,
    loading,
    error,
    refetch,
  } = useProfessorDetails(professorId);

  //estabilizar refetch para usarlo en efectos/handlers sin re-suscribir
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  // Estados para filtros
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({});
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({});

  // Verificar si el profesor es favorito al cargar
  useEffect(() => {
    if (user?.id && professorId) {
      checkIfFavorite();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, professorId]);

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

  useEffect(() => {
    if (isFocused) {
      refetchRef.current?.();
    }
  }, [isFocused]);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    applyFilters();
  }, [reviews, filters, selectedCourse]);

  const checkIfFavorite = async () => {
    try {
      const favorite = await favoritesService.isFavorite(
        user.id,
        "professor",
        null,
        professorId
      );
      if (!isMounted.current) return;
      setIsFavorite(!!favorite);
      setFavoriteId(favorite);
    } catch (error) {
      console.error("Error verificando favorito:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert("Iniciar sesión", "Debes iniciar sesión para agregar favoritos");
      navigation.navigate("Login");
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        // Eliminar de favoritos
        if (favoriteId) {
          await favoritesService.removeFavorite(favoriteId);
        } else {
          await favoritesService.removeFavoriteByReference(
            user.id,
            "professor",
            null,
            professorId
          );
        }
        if (!isMounted.current) return;
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        // Agregar a favoritos
        const newFavorite = await favoritesService.addFavorite(
          user.id,
          "professor",
          null,
          professorId
        );
        if (!isMounted.current) return;
        setIsFavorite(true);
        setFavoriteId(newFavorite.id);
      }
    } catch (error) {
      console.error("Error al modificar favoritos:", error);
      Alert.alert("Error", "No se pudo actualizar favoritos");
    } finally {
      if (isMounted.current) setFavoriteLoading(false);
    }
  };

  const applyFilters = async () => {
    
    // Si filters está vacío, limpiar todo
    if (!filters || Object.keys(filters).length === 0) {
      const finalReviews = selectedCourse
        ? reviews.filter((r) => r.course_id === selectedCourse)
        : reviews;
      setFilteredReviews(finalReviews);
      setAppliedFilters({});
      return;
    }
    
    // Limpiar filtros
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      
      // Solo incluir filtros que tienen valores válidos y no son los valores por defecto
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'minRating' && value === 1) {
          // No incluir minRating si es 1 (valor por defecto)
          return;
        }
        if (key === 'maxRating' && value === 5) {
          // No incluir maxRating si es 5 (valor por defecto)
          return;
        }
        if (key === 'minDifficulty' && value === 1) {
          // No incluir minDifficulty si es 1 (valor por defecto)
          return;
        }
        if (key === 'maxDifficulty' && value === 5) {
          // No incluir maxDifficulty si es 5 (valor por defecto)
          return;
        }
        if (key === 'sortBy' && value === 'newest') {
          // No incluir sortBy si es el valor por defecto
          return;
        }
        cleanFilters[key] = value;
      }
    });

    

    // Si no hay filtros activos después de limpiar
    if (Object.keys(cleanFilters).length === 0) {
      const finalReviews = selectedCourse
        ? reviews.filter((r) => r.course_id === selectedCourse)
        : reviews;
      setFilteredReviews(finalReviews);
      setAppliedFilters({});
      return;
    }

    try {
      const filtered = await filterService.getFilteredReviews(cleanFilters, {
        professorId: professorId
      });
      
      setFilteredReviews(filtered);
      setAppliedFilters(cleanFilters);
    } catch (error) {
      console.error('Error applying filters:', error);
      // En caso de error, mostrar reseñas base
      const finalReviews = selectedCourse
        ? reviews.filter((r) => r.course_id === selectedCourse)
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
    setFilterModalVisible(false)
    
    // Forzar mostrar todas las reseñas
    const finalReviews = selectedCourse
      ? reviews.filter((r) => r.course_id === selectedCourse)
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
    if (appliedFilters.startDate || appliedFilters.endDate) count++; // AÑADIDO: filtro por fechas
    if (appliedFilters.sortBy && appliedFilters.sortBy !== 'newest') count++;
    return count;
  };

  const getDisplayReviews = () => {
    // Si hay appliedFilters activos, usar filteredReviews
    if (appliedFilters && Object.keys(appliedFilters).length > 0) {
      return filteredReviews;
    }
    
    // Si no hay filtros, mostrar según selección de curso
    return selectedCourse
      ? reviews.filter((r) => r.course_id === selectedCourse)
      : reviews;
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
        <Text style={{ color: "red" }}>Error: {error}</Text>
      </View>
    );
  if (!professor)
    return (
      <View style={styles.center}>
        <Text>Profesor no encontrado</Text>
      </View>
    );

  const displayReviews = getDisplayReviews();

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ backgroundColor: COLORS.resolutionBlue }} />

      {/* Header azul con corazón */}
      <View style={{ backgroundColor: COLORS.resolutionBlue }}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.name}>{professor.full_name}</Text>
            <Text style={styles.subtitle}>{professor.department}</Text>
          </View>
          <TouchableOpacity
            style={styles.heartButton}
            onPress={toggleFavorite}
            disabled={favoriteLoading}
          >
            <Text style={[styles.heartIcon, isFavorite && styles.heartIconActive]}>
              {favoriteLoading ? "⋯" : isFavorite ? "❤️" : "🤍"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido */}
      <View style={{ flex: 1, backgroundColor: COLORS.seasalt }}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>⭐ Calificación</Text>
              <Text style={styles.statValue}>{avgRating ?? "N/A"}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>📉 Dificultad</Text>
              <Text style={styles.statValue}>{avgDifficulty ?? "N/A"}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>🔁 Volverían</Text>
              <Text style={styles.statValue}>{wouldTakeAgain ?? "N/A"}%</Text>
            </View>
          </View>

          {topTags && topTags.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Etiquetas más frecuentes</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 20 }}>
                {topTags.map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Materias</Text>
          <FlatList
            data={coursesTaught}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
            renderItem={({ item }) => {
              const courseReviews = reviews.filter((r) => r.course_id === item.id);
              const avgScore =
                courseReviews.length > 0
                  ? (
                      courseReviews.reduce((sum, r) => sum + (r.score || 0), 0) /
                      courseReviews.length
                    ).toFixed(2)
                  : null;

              return (
                <SearchResultItem
                  item={{
                    full_name: item.name,
                    avg_score: avgScore,
                    review_count: courseReviews.length,
                    type: "course",
                    code: item.code,
                  }}
                  onPress={() =>
                    setSelectedCourse(selectedCourse === item.id ? null : item.id)
                  }
                />
              );
            }}
          />

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
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.reviewCard}
                  onPress={() => navigation.navigate('ReviewDetail', { reviewId: item.id })}
                >
                  <Text style={styles.reviewCourse}>
                    {item.courses?.name || item.course_name || "Materia desconocida"}
                  </Text>
                  <Text style={styles.reviewDate}>
                    {new Date(item.created_at).toLocaleDateString("es-ES")}
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
        context={{ professorId }}
        currentFilters={filters}
      />

      {/* FAB: crear reseña para ESTE profesor (con tooltip + prellenado) */}
      {user && !keyboardVisible && professor && (
        <FloatingReviewButton
          label="Crear reseña"
          onPress={() =>
            navigation.navigate('NuevaResena', {
              source: 'ProfessorProfile',
              prefillType: 'professor',
              professorId: professor.id,
              professorName: professor.full_name,
            })
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleContainer: { flex: 1 },
  name: { fontSize: 32, fontWeight: "bold", color: "#FFF", textAlign: "center" },
  subtitle: { fontSize: 16, color: "rgba(255,255,255,0.8)", textAlign: "center" },

  // Favoritos
  heartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  heartIcon: { fontSize: 24 },
  heartIconActive: {},

  // Stats
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.columbiaBlue,
    padding: 14,
    borderRadius: 12,
    marginRight: 12,
    alignItems: "center",
  },
  statLabel: { color: COLORS.resolutionBlue, fontWeight: "600", marginBottom: 4 },
  statValue: { fontSize: 18, color: COLORS.resolutionBlue, fontWeight: "bold" },

  // Secciones
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: COLORS.yinmnBlue,
    marginBottom: 8 
  },
  tag: { 
    backgroundColor: COLORS.utOrange, 
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12, 
    marginRight: 8,
    marginBottom: 8 
  },
  tagText: { color: "#FFF", fontWeight: "bold" },

  // Header de Reseñas con Filtros
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

  // Filtros activos
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

  // Cards de reseña
  reviewCard: { 
    backgroundColor: COLORS.columbiaBlue, 
    padding: 14, 
    marginVertical: 8, 
    borderRadius: 12 
  },
  reviewCourse: { 
    fontWeight: "600", 
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
    lineHeight: 18,
  },

  // Sin resultados
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