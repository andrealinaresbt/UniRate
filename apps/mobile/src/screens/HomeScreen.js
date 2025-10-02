import React, { useState, useEffect } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfessorService } from '../services/professorService';

// Un componente SVG simple para el ícono del menú (hamburguesa)
const MenuIcon = (props) => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M4 6h16M4 12h16M4 18h16" stroke="#0D2C54" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Componente para cada opción del menú
const MenuItem = ({ text, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuItemText}>{text}</Text>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false); // ← NUEVO ESTADO

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setShowResults(false); // ← Ocultar resultados si búsqueda vacía
      return;
    }

    setLoading(true);
    setShowResults(true); // ← Mostrar resultados solo después de buscar
    const result = await ProfessorService.searchProfessors(searchTerm);
    if (result.success) {
      setProfessors(result.data || []);
    } else {
      console.error('Error buscando:', result.error);
      setProfessors([]);
    }
    setLoading(false);
  };

  const handleProfessorPress = (professor) => {
    // Navegar a pantalla de perfil del profesor
    navigation.navigate('Professor', { professorId: professor.id });
  };
  

  const renderProfessorItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.professorItem} 
      onPress={() => handleProfessorPress(item)}
    >
      <Text style={styles.professorName}>{item.full_name}</Text>
      <Text style={styles.professorDepartment}>{item.department}</Text>
      <Text style={styles.professorScore}>⭐ {item.avg_score || 'N/A'}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />

      {/* --- Menú Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Opciones</Text>
            <MenuItem text="Mi Perfil" onPress={() => { setMenuVisible(false); }} />
            {/* Navegador para ver materias */}
            <MenuItem text="Ver Materias" onPress={() => { setMenuVisible(false); }} />
              <MenuItem
              text="Publicar Reseña"
              onPress={() => {
              setMenuVisible(false);
              navigation.navigate('NuevaResena');
            }}
            />
            <MenuItem text="Configuración" onPress={() => { setMenuVisible(false); }} />
            <MenuItem text="Cerrar Sesión" onPress={() => { setMenuVisible(false); }} />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <MenuIcon />
        </TouchableOpacity>
      </View>

      {/* --- Contenido Principal --- */}
      <View style={styles.container}>
        <Text style={styles.title}>UNIRATE</Text>
        <Text style={styles.subtitle}>Encuentra y califica a tus profesores</Text>

        {/* Barra de búsqueda */}
        <TextInput
          style={styles.searchBar}
          placeholder="Buscar profesor por nombre o apellido..."
          placeholderTextColor="#888"
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
        />

        {/* Botón de búsqueda */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Buscar</Text>
          )}
        </TouchableOpacity>

        {/* MOSTRAR RESULTADOS SOLO DESPUÉS DE BUSCAR */}
        {showResults && (
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
                  keyExtractor={(item) => item.id}
                  style={styles.professorList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </View>
        )}

        {/* Mensaje de bienvenida cuando no hay búsqueda */}
        {!showResults && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              👆 Busca un profesor para comenzar
            </Text>
            <Text style={styles.welcomeSubtext}>
              Escribe el nombre o apellido en la barra de arriba
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 50,
    left: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  menuButton: {
    padding: 10,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#0D2C54',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 30,
    textAlign: 'center',
  },
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
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4 
      },
      android: { 
        elevation: 3 
      },
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
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 4 
      },
      android: { 
        elevation: 4 
      },
    }),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // --- Estilos para resultados de búsqueda ---
  resultsContainer: {
    flex: 1,
    marginTop: 10,
  },
  resultsList: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D2C54',
    marginBottom: 10,
  },
  professorList: {
    flex: 1,
  },
  professorItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    ...Platform.select({
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 2 
      },
      android: { 
        elevation: 2 
      },
    }),
  },
  professorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D2C54',
  },
  professorDepartment: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  professorScore: {
    fontSize: 14,
    color: '#2563EB',
    marginTop: 5,
    fontWeight: '600',
  },
  // --- Estilos para estados ---
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  // --- Estilos para pantalla de bienvenida ---
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  welcomeText: {
    fontSize: 18,
    color: '#2563EB',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // --- Estilos del Menú Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    height: '100%',
    width: '80%',
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 2, height: 0 }, 
        shadowOpacity: 0.25, 
        shadowRadius: 10 
      },
      android: { 
        elevation: 10 
      },
    }),
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D2C54',
    marginBottom: 30,
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuItemText: {
    fontSize: 18,
    color: '#333',
  },
});