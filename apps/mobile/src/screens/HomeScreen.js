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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/DarkHeader';
import { MenuModal } from '../components/MenuModal';
import SearchResultItem from '../components/SearchResultItem';
import { useSearch } from '../hooks/useSearch';
import { useAuth } from '../services/AuthContext';
import { fetchIsAdmin } from '../services/AuthService';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // ✅ Usando tu custom hook para búsqueda
  const {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    showResults,
    clearSearch
  } = useSearch();

  // ✅ Lógica de admin de tu compañero
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

  const handleResultPress = (item) => {
    if (item.type === 'professor') {
      // ✅ Usando el approach temporal de tu compañero
      Alert.alert('Profesor', `${item.full_name}\n(la vista de perfil aún no está lista)`);
      // Cuando esté lista: navigation.navigate('Professor', { professorId: item.id });
    } else if (item.type === 'course') {
      Alert.alert('Materia', `${item.name}\n(la vista de materia aún no está lista)`);
      // Cuando esté lista: navigation.navigate('Course', { courseId: item.id });
    }
  };

  const renderResultItem = ({ item }) => (
    <SearchResultItem 
      item={item}
      onPress={() => handleResultPress(item)} 
    />
  );

  return (
    <View style={styles.container}>
      {/* Status bar azul - de tu diseño */}
      <StatusBar barStyle="light-content" backgroundColor="#0D2C54" />
      
      {/* SafeAreaView con fondo azul - de tu diseño */}
      <SafeAreaView style={styles.safeAreaTop} edges={['top']}>
        <View style={styles.topSafeAreaContent}>
          {/* Header azul - de tu diseño */}
          <Header onMenuPress={() => setMenuVisible(true)} />
        </View>
      </SafeAreaView>
      
      {/* ✅ MenuModal actualizado con todas las opciones del compañero */}
      <MenuModal 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        navigation={navigation}
        user={user}
        isAdmin={isAdmin} // ✅ Pasamos el estado de admin
      />

      {/* SafeAreaView para el contenido principal - de tu diseño */}
      <SafeAreaView style={styles.safeAreaContent} edges={['left', 'right', 'bottom']}>
        {/* ✅ Contenido corregido sin VirtualizedLists nested */}
        {showResults ? (
          <View style={styles.resultsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Buscando...</Text>
              </View>
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
              />
            )}
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Sección superior con color - de tu diseño */}
            <View style={styles.topSection}>
              <Text style={styles.heroTitle}>Encuentra tu Profesor</Text>
              <Text style={styles.heroSubtitle}>Califica profesores y materias</Text>
              
              {/* Barra de búsqueda integrada - de tu diseño */}
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchBar}
                  placeholder='Ej. "Juan Pérez", "Cálculo I", "BPTMI02"'
                  placeholderTextColor="#888"
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  returnKeyType="search"
                />
                {/* Botón para limpiar búsqueda */}
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

            {/* Sección inferior blanca - de tu diseño */}
            <View style={styles.bottomSection}>
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeTitle}>¡Bienvenido a UNIRATE!</Text>
                <Text style={styles.welcomeText}>
                  {user ? `Hola, ${user.email}` : 'Escribe en la barra de búsqueda para encontrar profesores o materias'}
                </Text>
                
                {/* Ejemplos de búsqueda */}
                <View style={styles.examplesContainer}>
                  <Text style={styles.examplesTitle}>Ejemplos:</Text>
                  <View style={styles.exampleTags}>
                    <TouchableOpacity onPress={() => setSearchTerm('María González')}>
                      <Text style={styles.exampleTag}>"Carla López"</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSearchTerm('Física I')}>
                      <Text style={styles.exampleTag}>"Física I"</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSearchTerm('BPTMI02')}>
                      <Text style={styles.exampleTag}>"BPTMI02"</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

// 🎨 Estilos combinados (principalmente de tu diseño con mejoras)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D2C54',
  },
  safeAreaTop: {
    backgroundColor: '#0D2C54',
  },
  topSafeAreaContent: {
    backgroundColor: '#0D2C54',
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  topSection: {
    backgroundColor: '#0D2C54',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchBar: {
    flex: 1,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    paddingRight: 50,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  resultsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  resultsList: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D2C54',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  examplesContainer: {
    alignItems: 'center',
    padding: 1,
    marginTop: 0,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D2C54',
    marginBottom: 12,
  },
  exampleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  exampleTag: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
});