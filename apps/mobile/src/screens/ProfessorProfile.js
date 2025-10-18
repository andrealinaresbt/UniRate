import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { useProfessorDetails } from "../hooks/useProfessorDetails";
import { useAuth } from '../services/AuthContext';
import { favoritesService } from '../services/favoritesService';
import SearchResultItem from "../components/SearchResultItem";
import BackHeader from "../components/BackHeader";

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
  } = useProfessorDetails(professorId);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const filteredReviews = selectedCourse
    ? reviews.filter((r) => r.course_id === selectedCourse)
    : reviews;

  useEffect(() => {
    if (user?.id && professorId) {
      checkIfFavorite();
    }
  }, [user?.id, professorId]);

  const checkIfFavorite = async () => {
    try {
      const favorite = await favoritesService.isFavorite(user.id, 'professor', null, professorId);
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
          await favoritesService.removeFavoriteByReference(user.id, 'professor', null, professorId);
        }
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        const newFavorite = await favoritesService.addFavorite(user.id, 'professor', null, professorId);
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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.utOrange} /></View>;
  if (error) return <View style={styles.center}><Text style={{ color: "red" }}>Error: {error}</Text></View>;
  if (!professor) return <View style={styles.center}><Text>Profesor no encontrado</Text></View>;

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ backgroundColor: COLORS.resolutionBlue }} />
      <BackHeader onBack={() => navigation.goBack()} />
      
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
              {favoriteLoading ? '⋯' : (isFavorite ? '❤️' : '🤍')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: COLORS.seasalt }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
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
              <View style={{ flexDirection: "row", marginBottom: 20 }}>
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
              const courseReviews = reviews.filter(r => r.course_id === item.id);
              const avgScore = courseReviews.length > 0
                ? (courseReviews.reduce((sum, r) => sum + (r.score || 0), 0) / courseReviews.length).toFixed(2)
                : null;

              return (
                <SearchResultItem
                  item={{
                    full_name: item.name,
                    avg_score: avgScore,
                    review_count: courseReviews.length,
                    type: 'course',
                    code: item.code,
                  }}
                  onPress={() =>
                    setSelectedCourse(selectedCourse === item.id ? null : item.id)
                  }
                />
              );
            }}
          />

          <Text style={styles.sectionTitle}>Reseñas</Text>
          {filteredReviews.length === 0 ? (
            <Text>No hay reseñas todavía.</Text>
          ) : (
            <FlatList
              data={filteredReviews}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.reviewCard}
                  onPress={() => navigation.navigate('ReviewDetail', { reviewId: item.id })}
                >
                  <Text style={styles.reviewCourse}>{item.course_name || "Materia desconocida"}</Text>
                  <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString("es-ES")}</Text>
                  <Text>{item.comment || "Sin comentario"}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingVertical: 60, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleContainer: { flex: 1 },
  name: { fontSize: 32, fontWeight: "bold", color: "#FFF", textAlign: "center" },
  subtitle: { fontSize: 16, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  heartButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
  heartIcon: { fontSize: 24 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: COLORS.columbiaBlue, padding: 14, borderRadius: 12, marginRight: 12, alignItems: "center" },
  statLabel: { color: COLORS.resolutionBlue, fontWeight: "600", marginBottom: 4 },
  statValue: { fontSize: 18, color: COLORS.resolutionBlue, fontWeight: "bold" },
  sectionTitle: { marginBottom: 8, fontSize: 18, fontWeight: "700", color: COLORS.yinmnBlue },
  tag: { backgroundColor: COLORS.utOrange, padding: 8, borderRadius: 12, marginRight: 8 },
  tagText: { color: "#FFF", fontWeight: "bold" },
  reviewCard: { backgroundColor: COLORS.columbiaBlue, padding: 14, marginVertical: 8, borderRadius: 12 },
  reviewCourse: { fontWeight: "600", fontSize: 15, color: COLORS.yinmnBlue, marginBottom: 4 },
  reviewDate: { fontSize: 12, color: COLORS.resolutionBlue, marginBottom: 6 },
});
