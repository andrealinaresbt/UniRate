import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
  Animated,
  Dimensions
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

const { height: screenHeight } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  // Detectar teclado visible
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
      return <CourseResultItem item={item} onPress={handleResultPress} />;
    }
    return <SearchResultItem item={item} onPress={() => handleResultPress(item)} />;
  };

  const [showErrorPopup, setShowErrorPopup] = useState(false);
  useEffect(() => { if (error) setShowErrorPopup(true); }, [error]);

  // ===== Tooltip =====
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTimerRef = useRef(null);

  const showTooltip = () => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setTooltipVisible(true);
    Animated.timing(tooltipOpacity, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
    tooltipTimerRef.current = setTimeout(hideTooltip, 1600);
  };

  const hideTooltip = () => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setTooltipVisible(false);
    });
  };
  // ==============================

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar
          barStyle="light-content"
          backgroundColor="#003087"
          translucent={false}
      />
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

        {/*Loading centrado */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#003087" />
            </View>
          </View>
        )}

        {showResults ? (
          <View style={styles.resultsContainer}>
            {results.length === 0 && !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se encontraron resultados</Text>
                <Text style={styles.emptySubtext}>Intenta con otro término</Text>
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
                {'Escribe en la barra de búsqueda para encontrar profesores o materias'}
              </Text>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      {/* FAB + Tooltip */}
      {!keyboardVisible && !showResults && (
  <>
      {tooltipVisible && (
        <Animated.View
          style={[
            styles.tooltipContainer,
            {
              opacity: tooltipOpacity,
              transform: [{ translateY: -10 }],
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.tooltipBubble}>
            <Text style={styles.tooltipText}>Crear reseña</Text>
            <View style={styles.tooltipArrow} />
          </View>
        </Animated.View>
      )}

      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.fab}
        onPress={() => navigation.navigate('NuevaResena')}
        onLongPress={showTooltip}
        onPressOut={hideTooltip}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>
    </>
    )}

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#003087', paddingTop: 10,},
  safeAreaTop: { backgroundColor: '#003087' , marginTop: 0,},
  topSafeAreaContent: {
  backgroundColor: '#003087',
  },
  safeAreaContent: { flex: 1, backgroundColor: '#FFFFFF' },
  topSection: { backgroundColor: '#003087', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 25 },
  heroTitle: { fontSize: 30, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8, textAlign: 'center', padding: 20},

  // Buscador
  searchContainer: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
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
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  clearButton: { position: 'absolute', right: 15, width: 30, height: 30, borderRadius: 15, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  clearButtonText: { fontSize: 16, color: '#666', fontWeight: 'bold' },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    paddingBottom:250,
  },
  loadingBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    borderRadius: 26,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  loadingText: { marginTop: 10, color: '#003087', fontSize: 16, fontWeight: '600', textAlign: 'center' },

  resultsContainer: { flex: 1, backgroundColor: '#f1f1f1ff' },
  resultsList: { flex: 1 },
  resultsContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  welcomeScrollView: { flex: 1, backgroundColor: '#ffffffff' },
  welcomeContainer: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: '#003087', marginBottom: 12, textAlign: 'center' },
  welcomeText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center' },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: screenHeight * 0.05, 
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 10,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 34,
  },

  tooltipContainer: {
    position: 'absolute',
    right: 30,
    bottom: screenHeight * 0.13,
    alignItems: 'center',
    zIndex: 15,
  },
  tooltipBubble: {
    backgroundColor: '#FF8C42',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tooltipArrow: {
    width: 12,
    height: 12,
    backgroundColor: '#FF8C42',
    transform: [{ rotate: '45deg' }],
    marginTop: -6,
  },
  tooltipText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
