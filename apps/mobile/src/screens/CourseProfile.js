import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useIsFocused } from "@react-navigation/native";
import { useAuth } from "../services/AuthContext";
import { EventBus } from "../utils/EventBus";
import BackHeader from "../components/BackHeader";
import FloatingReviewButton from "../components/FloatingReviewButton";
import SearchResultItem from "../components/SearchResultItem";
// Si tienes un hook real para materia, usa ese:
import { useCourseDetails } from "../hooks/useCourseDetails";

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
  // Ajusta los nombres si tu hook devuelve otras props.
  const {
    course,            // { id, name, ... }
    reviews,           // array de reseñas
    avgRating,         // número
    avgDifficulty,     // número
    wouldTakeAgain,    // porcentaje
    topTags,           // array de strings (opcional)
    professors,        // array de profesores que dictan esta materia (opcional)
    loading,
    error,
    refetch,
  } = useCourseDetails(courseId);

  // Stabilize refetch (misma técnica que en ProfessorProfile)
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  // Suscripción a eventos: una sola vez
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

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ backgroundColor: COLORS.resolutionBlue }} />
      <BackHeader onBack={() => navigation.goBack()} />

      {/* Header de la materia */}
      <View style={{ backgroundColor: COLORS.resolutionBlue }}>
        <View style={styles.header}>
          <Text style={styles.name}>{courseName}</Text>
          {/* Si quieres algún botón extra en el header, colócalo aquí */}
        </View>
      </View>

      {/* Contenido */}
      <View style={{ flex: 1, backgroundColor: COLORS.seasalt }}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* KPIs */}
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

          {/* Etiquetas más frecuentes (opcional) */}
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

          {/* Profesores que dictan la materia (opcional) */}
          {Array.isArray(professors) && professors.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Profesores</Text>
              <FlatList
                data={professors}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 20 }}
                renderItem={({ item }) => (
                  <SearchResultItem
                    item={{
                      full_name: item.full_name,
                      avg_score: item.avg_score,
                      review_count: item.review_count,
                      type: "professor",
                    }}
                    onPress={() =>
                      navigation.navigate("ProfessorProfile", {
                        professorId: item.id,
                        professorName: item.full_name,
                      })
                    }
                  />
                )}
              />
            </>
          )}

          {/* Reseñas */}
          <Text style={styles.sectionTitle}>Reseñas</Text>
          {(!reviews || reviews.length === 0) ? (
            <Text>No hay reseñas todavía.</Text>
          ) : (
            <FlatList
              data={reviews}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.reviewCard}
                  onPress={() =>
                    navigation.navigate("ReviewDetail", { reviewId: item.id })
                  }
                >
                  {/* Si tu review tiene profesor/más datos, muéstralos aquí */}
                  <Text style={styles.reviewDate}>
                    {new Date(item.created_at).toLocaleDateString("es-ES")}
                  </Text>
                  <Text>{item.comment || "Sin comentario"}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </ScrollView>
      </View>

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

  // Header
  header: {
    paddingVertical: 52,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 28, fontWeight: "bold", color: "#FFF", textAlign: "center" },

  // KPIs
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
  sectionTitle: { marginBottom: 8, fontSize: 18, fontWeight: "700", color: COLORS.yinmnBlue },
  tag: {
    backgroundColor: COLORS.utOrange,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { color: "#FFF", fontWeight: "bold" },

  reviewCard: {
    backgroundColor: COLORS.columbiaBlue,
    padding: 14,
    marginVertical: 8,
    borderRadius: 12,
  },
  reviewDate: { fontSize: 12, color: COLORS.resolutionBlue, marginBottom: 6 },
});
