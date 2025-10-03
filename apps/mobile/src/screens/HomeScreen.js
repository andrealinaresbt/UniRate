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
  KeyboardAvoidingView,
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
  
  const {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    showResults,
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

  const handleResultPress = (item) => {
    if (item.type === 'professor') {
      Alert.alert('Profesor', `${item.full_name}\n(la vista de perfil aún no está lista)`);
    } else if (item.type === 'course') {
      Alert.alert('Materia', `${item.name}\n(la vista de materia aún no está lista)`);
    }
  };

  const renderResultItem = ({ item }) => (
    <SearchResultItem 
      item={item}
      onPress={() => handleResultPress(item)} 
    />
  );

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
        
        {/*SECCIÓN SUPERIOR CON BÚSQUEDA  */}
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

        {/* Simbolo loading */}
        {loading && (
          <View style={styles.fixedLoadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Buscando...</Text>
          </View>
        )}

        {/* CONTENIDO DINÁMICO - RESULTADOS O BIENVENIDA */}
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
              
              <View style={styles.examplesContainer}>
                <Text style={styles.examplesTitle}>Ejemplos de búsqueda:</Text>
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
          </ScrollView>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

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
  
  // Sección superior
  topSection: {
    backgroundColor: '#0D2C54',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 25,
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
    marginBottom: 25,
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
  
    fixedLoadingContainer: {
    position: 'absolute',
    top: 250, 
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000, 
  },
  loadingText: {
    marginTop: 8,
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  
  resultsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingPlaceholder: {
    height: 100,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  
  welcomeScrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  welcomeContent: {
    flexGrow: 1,
  },
  
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
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
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
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
});