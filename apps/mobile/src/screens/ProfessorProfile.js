import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { useProfessorDetails } from "../hooks/useProfessorDetails";
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

  const filteredReviews = selectedCourse
    ? reviews.filter((r) => r.course_id === selectedCourse)
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
        <Text style={{ color: "red" }}>Error: {error}</Text>
      </View>
    );
  }

  if (!professor) {
    return (
      <View style={styles.center}>
        <Text>Profesor no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* SafeArea azul */}
      <SafeAreaView style={{ backgroundColor: COLORS.resolutionBlue }} />
      <BackHeader onBack={() => navigation.goBack()} />
      {/* Header azul */}
      <View style={{ backgroundColor: COLORS.resolutionBlue }}>
        <View style={styles.header}>
          <Text style={styles.name}>{professor.full_name}</Text>
          <Text style={styles.subtitle}>{professor.department}</Text>
        </View>
      </View>

      {/* Contenedor blanco */}
      <View style={{ flex: 1, backgroundColor: COLORS.seasalt }}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Promedios */}
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

          {/* Top tags */}
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

          {/* Materias */}
          <Text style={styles.sectionTitle}>Materias</Text>
          <FlatList
  data={coursesTaught}
  keyExtractor={(item) => item.id}
  horizontal
  showsHorizontalScrollIndicator={false}
  style={{ marginBottom: 20 }}
  renderItem={({ item }) => {
    // Calculate avg score for this course
    const courseReviews = reviews.filter(r => r.course_id === item.id);
    const avgScore =
      courseReviews.length > 0
        ? (courseReviews.reduce((sum, r) => sum + (r.score || 0), 0) /
           courseReviews.length
          ).toFixed(2)
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


          {/* Reseñas */}
          <Text style={styles.sectionTitle}>Reseñas</Text>
          {filteredReviews.length === 0 ? (
            <Text>No hay reseñas todavía.</Text>
          ) : (
            <FlatList
              data={filteredReviews}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewCourse}>
                    {item.course_name || "Materia desconocida"}
                  </Text>
                  <Text style={styles.reviewDate}>
                    {new Date(item.created_at).toLocaleDateString("es-ES")}
                  </Text>
                  <Text>{item.comment || "Sin comentario"}</Text>
                </View>
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
  header: { paddingVertical: 40, paddingHorizontal: 20, alignItems: "center" },
  name: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
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
  statLabel: {
    color: COLORS.resolutionBlue,
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: { fontSize: 18, color: COLORS.resolutionBlue, fontWeight: "bold" },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.yinmnBlue,
  },
  tag: {
    backgroundColor: COLORS.utOrange,
    padding: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  reviewCard: {
    backgroundColor: COLORS.columbiaBlue,
    padding: 14,
    marginVertical: 8,
    borderRadius: 12,
  },
  tagText: {
    color: "#FFF", // white color
    fontWeight: "bold", // bold text
  },

  reviewCourse: {
    fontWeight: "600",
    fontSize: 15,
    color: COLORS.yinmnBlue,
    marginBottom: 4,
  },
  reviewDate: { fontSize: 12, color: COLORS.resolutionBlue, marginBottom: 6 },
});
