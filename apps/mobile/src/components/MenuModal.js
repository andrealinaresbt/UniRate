import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  Alert 
} from 'react-native';
import { useAuth } from '../services/AuthContext';
import { signOut } from '../services/AuthService';

// Componente interno para items del menú
const MenuItem = ({ text, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuItemText}>{text}</Text>
  </TouchableOpacity>
);

export const MenuModal = ({ visible, onClose, navigation }) => {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo cerrar sesión');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPressOut={onClose}
      >
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Opciones</Text>

          {!user ? (
            <>
              <MenuItem 
                text="Iniciar sesión" 
                onPress={() => { 
                  onClose(); 
                  navigation.navigate('Login'); 
                }} 
              />
              <MenuItem 
                text="Configuración" 
                onPress={onClose} 
              />
            </>
          ) : (
            <>
              <MenuItem 
                text="Mi Perfil" 
                onPress={() => { 
                  onClose(); 
                  // navigation.navigate('Profile') 
                }} 
              />
              <MenuItem 
                text="Ver Materias" 
                onPress={onClose} 
              />
              <MenuItem 
                text="Configuración" 
                onPress={onClose} 
              />
              <MenuItem 
                text="Cerrar Sesión" 
                onPress={handleSignOut} 
              />
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)' 
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
      android: { elevation: 10 },
    }),
  },
  menuTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#0D2C54', 
    marginBottom: 30 
  },
  menuItem: { 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E0E0E0' 
  },
  menuItemText: { 
    fontSize: 18, 
    color: '#333' 
  },
});