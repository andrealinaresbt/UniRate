// components/MenuModal.js - ACTUALIZA con esto:
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Alert
} from 'react-native';
import { signOut } from '../services/AuthService';

const MenuItem = ({ text, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuItemText}>{text}</Text>
  </TouchableOpacity>
);

export const MenuModal = ({ visible, onClose, navigation, user, isAdmin }) => {
  const handleLogout = async () => {
    try {
      await signOut();
      onClose();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo cerrar sesión');
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Opciones</Text>

          {!user ? (
            <>
              <MenuItem
                text="Iniciar sesión"
                onPress={() => { onClose(); navigation.navigate('Login'); }}
              />
              <MenuItem text="Configuración" onPress={onClose} />
            </>
          ) : (
            <>
              <MenuItem text="Mi Perfil" onPress={onClose} />
              <MenuItem text="Ver Materias" onPress={onClose} />

              {/* ✅ NUEVO: Publicar Reseña */}
              <MenuItem
                text="Publicar Reseña"
                onPress={() => {
                  onClose();
                  navigation.navigate('NuevaResena');
                }}
              />

              <MenuItem text="Configuración" onPress={onClose} />

              {isAdmin && (
                <>
                  <View style={{ height: 12 }} />
                  <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Admin</Text>
                  <MenuItem
                    text="Panel admin"
                    onPress={() => { onClose(); navigation.navigate('Admin'); }}
                  />
                  <MenuItem
                    text="Gestión de profesores"
                    onPress={() => { onClose(); navigation.navigate('AdminProfessors'); }}
                  />
                </>
              )}

              <MenuItem
                text="Cerrar Sesión"
                onPress={handleLogout}
              />
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuContainer: {
    width: '78%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  menuTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#003087', 
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