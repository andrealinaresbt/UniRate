import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  Modal,
  Platform,
  StatusBar
} from 'react-native';
import { Svg, Path } from 'react-native-svg';

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
  // 'useState' para controlar si el menú está visible o no
  const [menuVisible, setMenuVisible] = useState(false);

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
            {/* Placeholders para las opciones del menú */}
            <MenuItem text="Mi Perfil" onPress={() => { /* Lógica futura */ setMenuVisible(false); }} />
            <MenuItem text="Ver Materias" onPress={() => { /* Lógica futura */ setMenuVisible(false); }} />
            <MenuItem text="Configuración" onPress={() => { /* Lógica futura */ setMenuVisible(false); }} />
            <MenuItem text="Cerrar Sesión" onPress={() => { /* Lógica futura */ setMenuVisible(false); }} />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- Contenido Principal de la Pantalla --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <MenuIcon />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>UNIRATE</Text>
        <Text style={styles.subtitle}>Encuentra y califica a tus profesores</Text>

        <TextInput
          style={styles.searchBar}
          placeholder="Buscar profesor por nombre o apellido..."
          placeholderTextColor="#888"
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Results')}
        >
          <Text style={styles.buttonText}>Buscar</Text>
        </TouchableOpacity>
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
    top: Platform.OS === 'android' ? 40 : 50, // Ajuste para status bar
    left: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  menuButton: {
    padding: 10, // Aumenta el área táctil del botón
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#0D2C54',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 40,
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
    marginBottom: 20,
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
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
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
        ios: { shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 10 },
        android: { elevation: 10 },
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

