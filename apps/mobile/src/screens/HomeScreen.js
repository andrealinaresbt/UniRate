import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  FlatList,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/DarkHeader';
import { MenuModal } from '../components/MenuModal';
import SearchResultItem from '../components/SearchResultItem';
import CourseResultItem from '../components/CourseResultItem';
import { useSearch } from '../hooks/useSearch';
import { useAuth } from '../services/AuthContext';
import { fetchIsAdmin } from '../services/AuthService';
import { ErrorPopup } from '../components/NetErrorPopup';
import { supabase } from '../services/supabaseClient';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    showResults,
    error,
    retrySearch,
    clearSearch
  } = useSearch();

  useEffect(() => {
    let alive = true;
    if (user?.id) {
      fetchIsAdmin(user.id)
        .then(f => { if (alive) setIsAdmin(!!f); })
        .catch(() => setIsAdmin(false));
    } else {
      setIsAdmin(false);
    }
    return () => { alive = false; };
  }, [user?.id]);

  // Helper to fetch course reviews
  const fetchCourseReviews = async (courseId) => {
    const { data: reviewsData, error } = await supabase
      .from('reviews')
      .select('score')
      .eq('course_id', courseId);

    if (error) {
      console.log('Error fetching course reviews:', error);
      return [];
    }

    return reviewsData || [];
  };

  const handleResultPress = (item) => {
    if (item.type === 'professor') {
      navigation.navigate('ProfessorProfile', { 
        professorId: item.id,
        professorName: item.full_name 
      });
    } else if (item.type === 'course') {
      navigation.navigate('CourseProfile', { 
        courseId: item.id,
        courseName: item.name 
      });
    }
  };

  const renderResultItem = ({ item }) => {
    if (item.type === 'course') {
      return (
        <CourseResultItem item={item} onPress={handleResultPress} />
      );
    }
    return (
      <SearchResultItem item={item} onPress={() => handleResultPress(item)} />
    );
  };

  const [showErrorPopup, setShowErrorPopup] = useState(false);

  useEffect(() => {
    if (error) setShowErrorPopup(true);
  }, [error]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D2C54" />
      <SafeAreaView style={styles.safeAreaTop} edges={['top']}>
        <View style={styles.topSafeAreaContent}>
          <Header onMenuPress={() => setMenuVisible(true)} />
        </View>
      </SafeAreaView>

      <MenuModal 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        navigation={navigation}
        user={user}
        isAdmin={isAdmin}
      />

      <SafeAreaView style={styles.safeAreaContent} edges={['left', 'right', 'bottom']}>
        <View style={styles.topSection}>
          <Text style={styles.heroTitle}>Encuentra tu Profesor</Text>
          <Text style={styles.heroSubtitle}>Califica profesores y materias</Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchBar}
              placeholder='Ej. "Juan Pérez", "Cálculo I", "BPTMI02"'
              placeholderTextColor="#888"
              value={searchTerm}
              onChangeText={setSearchTerm}
              returnKeyType="search"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={clearSearch}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading && (
          <View style={styles.fixedLoadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Buscando...</Text>
          </View>
        )}

        {showResults ? (
          <View style={styles.resultsContainer}>
            {loading ? (
              <View style={styles.loadingPlaceholder} />
            ) : results.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se encontraron resultados</Text>
                <Text style={styles.emptySubtext}>Intenta con otro término de búsqueda</Text>
              </View>
            ) : (
              <FlatList
                data={results}
                renderItem={renderResultItem}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                style={styles.resultsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.resultsContent}
              />
            )}
          </View>
        ) : (
          <ScrollView 
            style={styles.welcomeScrollView} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.welcomeContent}
          >
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>¡Bienvenido a UNIRATE!</Text>
              <Text style={styles.welcomeText}>
                {user ? ` ${user.email}` : 'Escribe en la barra de búsqueda para encontrar profesores o materias'}
              </Text>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      <ErrorPopup
        visible={showErrorPopup}
        error={error}
        onRetry={() => {
          setShowErrorPopup(false);
          retrySearch();
        }}
        onClose={() => setShowErrorPopup(false)}
      />
    </KeyboardAvoidingView>
  );
}

// Keep your styles unchanged
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#003087' },
  safeAreaTop: { backgroundColor: '#003087' },
  topSafeAreaContent: { backgroundColor: '#003087' },
  safeAreaContent: { flex: 1, backgroundColor: '#FFFFFF' },
  topSection: { backgroundColor: '#003087', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 25 },
  heroTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  heroSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', marginBottom: 25 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  searchBar: { flex: 1, height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 20, fontSize: 16, borderColor: '#E0E0E0', borderWidth: 1, paddingRight: 50,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }, android: { elevation: 4 }}) },
  clearButton: { position: 'absolute', right: 15, width: 30, height: 30, borderRadius: 15, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  clearButtonText: { fontSize: 16, color: '#666', fontWeight: 'bold' },
  fixedLoadingContainer: { position: 'absolute', top: 250, left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
  loadingText: { marginTop: 8, color: '#2563EB', fontSize: 16, fontWeight: '600' },
  resultsContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingPlaceholder: { height: 100 },
  resultsList: { flex: 1 },
  resultsContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  welcomeScrollView: { flex: 1, backgroundColor: '#FFFFFF' },
  welcomeContent: { flexGrow: 1 },
  welcomeContainer: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: '#003087', marginBottom: 12, textAlign: 'center' },
  welcomeText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#F8F9FA', borderRadius: 16, marginHorizontal: 20, marginTop: 20 },
  emptyText: { fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center' },
});
