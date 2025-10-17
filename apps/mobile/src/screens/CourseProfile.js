import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCourseDetails } from '../hooks/useCourseDetails';
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
  const { courseId, courseName } = route.params;
  const { user } = useAuth();

  const {
    course,
    reviews,
    loading,
    error,
    avgSatisfaccion,
    avgDificultad,
    professorsAggregated,
  } = useCourseDetails(courseId);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Verificar si el curso es favorito AL CARGAR
  useEffect(() => {
    if (user?.id && courseId) {
      checkIfFavorite();
    }
  }, [user?.id, courseId]);

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
        // Eliminar de favoritos
        if (favoriteId) {
          await favoritesService.removeFavorite(favoriteId);
        } else {
          await favoritesService.removeFavoriteByReference(user.id, 'course', courseId, null);
        }
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        // Agregar a favoritos
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.utOrange} />
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={styles.center}>
        <Text>Error al cargar el curso</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.utOrange }}>
      <BackHeader onBack={() => navigation.goBack()} />
      
      {/* Header con título y corazón */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.courseTitle}>
            {course.name}
          </Text>
          <Text style={styles.courseCode}>
            {course.code}
          </Text>
        </View>
        
        {/* BOTÓN CORAZÓN MINIMALISTA */}
        <TouchableOpacity 
          style={styles.heartButton}
          onPress={toggleFavorite}
          disabled={favoriteLoading}
        >
          <Text style={[
            styles.heartIcon,
            isFavorite && styles.heartIconActive
          ]}>
            {favoriteLoading ? '⋯' : (isFavorite ? '❤️' : '🤍')}
          </Text>
        </TouchableOpacity>
      </View>

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

        {/* Resto de tu contenido... */}
        <Text style={styles.sectionTitle}>Profesores</Text>
        {/* ... tu código de profesores */}

        <Text style={styles.sectionTitle}>Reseñas</Text>
        {/* ... tu código de reseñas */}
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
  // Header con título y corazón
  header: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'left',
  },
  courseCode: {
    fontSize: 16,
    color: '#FFF',
    marginTop: 8,
  },
  // Botón corazón minimalista
  heartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  heartIcon: {
    fontSize: 24,
  },
  heartIconActive: {
    // El corazón rojo ya se muestra con el emoji '❤️'
  },
  // Estilos existentes
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
});
