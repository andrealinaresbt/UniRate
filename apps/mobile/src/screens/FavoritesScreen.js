import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useAuth } from '../services/AuthContext';
import { favoritesService } from '../services/favoritesService';
import SearchResultItem from '../components/SearchResultItem';
import { useIsFocused } from '@react-navigation/native';
import { EventBus } from '../utils/EventBus';

export default function FavoritesScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const isFocused = useIsFocused();

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    if (!user?.id) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    
    try {
      const favoritesData = await favoritesService.getUserFavorites(user.id);
      setFavorites(favoritesData || []);
    } catch (error) {
      console.error('Error cargando favoritos:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    if (isFocused && mounted) loadFavorites();
    
    const off1 = EventBus.on('favorite:added', () => { if (mounted) loadFavorites(); });
    const off2 = EventBus.on('favorite:removed', () => { if (mounted) loadFavorites(); });

    return () => { 
      mounted = false; 
      off1(); 
      off2(); 
    };
  }, [isFocused, loadFavorites]);

  const handleItemPress = (item) => {
    if (item.type === 'professor' && item.professor_id) {
      navigation.navigate('ProfessorProfile', { 
        professorId: item.professor_id,
        professorName: item.professors?.full_name 
      });
    } else if (item.type === 'course' && item.course_id) {
      navigation.navigate('CourseProfile', { 
        courseId: item.course_id,
        courseName: item.courses?.name 
      });
    }
  };

  const formatFavoriteItem = (favorite) => {
    if (favorite.type === 'course' && favorite.courses) {
        return {
        id: favorite.id,
        full_name: favorite.courses.name,
        name: favorite.courses.name,
        code: favorite.courses.code,
        type: 'course',
        avg_score: null, // Los cursos no tienen avg_score
        review_count: null, // 
        department: favorite.courses.department
        };
    } else if (favorite.type === 'professor' && favorite.professors) {
        return {
        id: favorite.id,
        full_name: favorite.professors.full_name,
        department: favorite.professors.department,
        type: 'professor',
        avg_score: favorite.professors.avg_score,
        review_count: null, // Los profesores no tienen review_count en tabla
        avg_difficulty: favorite.professors.avg_difficulty,
        would_take_again_percentage: favorite.professors.would_take_again_percentage
        };
    }
    return null;
    };

  const validFavorites = favorites
    .map(formatFavoriteItem)
    .filter(item => item !== null);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Mis favoritos</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#003087" />
        </View>
      ) : (
        <FlatList
          data={validFavorites}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={({ item }) => (
            <SearchResultItem 
              item={item} 
              onPress={() => handleItemPress(
                favorites.find(f => f.id === item.id)
              )} 
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No tienes favoritos todavía.{'\n'}
              Agrega cursos o profesores tocando el corazón ❤️
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#F6F7F8' },
  title: { fontSize: 22, fontWeight: '800', color: '#003087', marginBottom: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { 
    textAlign: 'center', 
    color: '#8A93A2', 
    marginTop: 24,
    lineHeight: 22 
  },
});