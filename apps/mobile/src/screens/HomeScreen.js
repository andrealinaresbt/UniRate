import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfessorService } from '../services/professorService';
import { useAuth } from '../services/AuthContext';
import { signOut } from '../services/AuthService';

const MenuIcon = (props) => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M4 6h16M4 12h16M4 18h16" stroke="#0D2C54" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MenuItem = ({ text, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuItemText}>{text}</Text>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setShowResults(false);
      return;
    }
    setLoading(true);
    setShowResults(true);
    const result = await ProfessorService.searchProfessors(searchTerm);
    if (result.success) setProfessors(result.data || []);
    else {
      console.error('Error buscando:', result.error);
      setProfessors([]);
    }
    setLoading(false);
  };

  const handleProfessorPress = (professor) => {
    navigation.navigate('Professor', { professorId: professor.id });
  };

  const renderProfessorItem = ({ item }) => (
    <TouchableOpacity style={styles.professorItem} onPress={() => handleProfessorPress(item)}>
      <Text style={styles.professorName}>{item.full_name}</Text>
      <Text style={styles.professorDepartment}>{item.department}</Text>
      <Text style={styles.professorScore}>⭐ {item.avg_score || 'N/A'}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar />
      {/* Menú */}
      <Modal
        animationType="slide"
        transparent
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Opciones</Text>

            {!user && (
              <>
                <MenuItem text="Iniciar sesión" onPress={() => { setMenuVisible(false); navigation.navigate('Login'); }} />
                <MenuItem text="Configuración" onPress={() => { setMenuVisible(false); }} />
              </>
            )}

            {user && (
              <>
                <MenuItem text="Mi Perfil" onPress={() => { setMenuVisible(false); /* navigation.navigate('Profile') */ }} />
                <MenuItem text="Ver Materias" onPress={() => { setMenuVisible(false); }} />
                <MenuItem text="Configuración" onPress={() => { setMenuVisible(false); }} />
                <MenuItem
                  text="Cerrar Sesión"
                  onPress={async () => {
                    try {
                      await signOut();
                    } catch (e) {
                      Alert.alert('Error', e.message || 'No se pudo cerrar sesión');
                    } finally {
                      setMenuVisible(false);
                    }
                  }}
                />
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <MenuIcon />
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <View style={styles.container}>
        <Text style={styles.title}>UNIRATE</Text>
        <Text style={styles.subtitle}>
          {user ? `Hola, ${user.email}` : 'Encuentra y califica a tus profesores'}
        </Text>

        {/* Barra de búsqueda */}
        <TextInput
          style={styles.searchBar}
          placeholder="Buscar profesor por nombre o apellido..."
          placeholderTextColor="#888"
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
        />

        {/* Botón Buscar */}
        <TouchableOpacity style={styles.button} onPress={handleSearch} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Buscar</Text>}
        </TouchableOpacity>

        {/* Resultados */}
        {showResults ? (
          <View style={styles.resultsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Buscando profesores...</Text>
              </View>
            ) : professors.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se encontraron profesores</Text>
                <Text style={styles.emptySubtext}>Intenta con otro nombre</Text>
              </View>
            ) : (
              <View style={styles.resultsList}>
                <Text style={styles.resultsTitle}>Resultados de búsqueda:</Text>
                <FlatList
                  data={professors}
                  renderItem={renderProfessorItem}
                  keyExtractor={(item) => String(item.id)}
                  style={styles.professorList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>👆 Busca un profesor para comenzar</Text>
            <Text style={styles.welcomeSubtext}>Escribe el nombre o apellido en la barra de arriba</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 50,
    left: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  menuButton: { padding: 10 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 80 },
  title: { fontSize: 48, fontWeight: 'bold', color: '#0D2C54', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 20, textAlign: 'center' },

  searchBar: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    marginBottom: 15,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  resultsContainer: { flex: 1, marginTop: 10 },
  resultsList: { flex: 1 },
  resultsTitle: { fontSize: 16, fontWeight: '600', color: '#0D2C54', marginBottom: 10 },
  professorList: { flex: 1 },
  professorItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
  },
  professorName: { fontSize: 18, fontWeight: 'bold', color: '#0D2C54' },
  professorDepartment: { fontSize: 14, color: '#666', marginTop: 5 },
  professorScore: { fontSize: 14, color: '#2563EB', marginTop: 5, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666', fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 10 },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center' },
  welcomeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  welcomeText: { fontSize: 18, color: '#2563EB', textAlign: 'center', marginBottom: 10, fontWeight: '600' },
  welcomeSubtext: { fontSize: 14, color: '#666', textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  menuContainer: {
    height: '100%',
    width: '80%',
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 10 },
      android: { elevation: 10 },
    }),
  },
  menuTitle: { fontSize: 24, fontWeight: 'bold', color: '#0D2C54', marginBottom: 30 },
  menuItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  menuItemText: { fontSize: 18, color: '#333' },
});
