// components/MenuModal.js 
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
// Asegúrate de que deleteUserAccountAndData esté disponible en este archivo
import { signOut, deleteUserAccountAndData } from '../services/AuthService'; 

// Componente helper para los ítems del menú.
const MenuItem = ({ text, onPress, isDestructive }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
   <Text style={[styles.menuItemText, isDestructive && styles.destructiveText]}>{text}</Text>
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

  // FUNCIÓN PARA MANEJAR LA ELIMINACIÓN DE LA CUENTA
  const handleDeleteAccount = () => {
    onClose(); // Cerrar el menú modal primero

    Alert.alert(
      '⚠️ Eliminar Cuenta',
      'Estás a punto de eliminar tu cuenta de forma PERMANENTE. Esto borrará todas tus reseñas y tu historial. Esta acción NO se puede deshacer. ¿Deseas continuar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: '❌ Eliminar permanentemente',
          style: 'destructive',
          onPress: async () => {
            try {
              // LLAMADA AL SERVICIO: Esto activa el RPC en Supabase
              await deleteUserAccountAndData(); 
              Alert.alert('Éxito', 'Tu cuenta ha sido eliminada permanentemente.');
              navigation.navigate('Home'); // Navega a la pantalla de inicio o login
            } catch (e) {
              console.error(e);
              Alert.alert('Error al eliminar', e.message || 'Ocurrió un error al intentar eliminar la cuenta.');
            }
          },
        },
      ]
    );
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
         <Text style={styles.menuTitle}>UniRate</Text>

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
             <MenuItem text="Mis reseñas" onPress={() => {
                 onClose();
                 navigation.navigate('myReviews');
                }} />
             <MenuItem text="Favoritos" onPress={() => {
                 onClose();
                 navigation.navigate('Favorites');
                }} />
              
              <MenuItem
               text="Publicar Reseña"
               onPress={() => {
                  onClose();
                  navigation.navigate('NuevaResena');
                }}
              />

              {isAdmin && (
                <>
                 <View style={{ height: 12 }} />
                  <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Admin</Text>
                  <MenuItem
                    text="Panel admin"
                    onPress={() => { onClose(); navigation.navigate('Admin'); }}
                  />
                </>
              )}

              <View style={{ height: 20 }} />

              {/* OPCIÓN DE BORRAR CUENTA (DESTRUCTIVA) */}
              <MenuItem
                text="🗑️ Borrar Cuenta"
                isDestructive
                onPress={handleDeleteAccount}
              />

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
  // ESTILO DESTRUCTIVO para "Borrar Cuenta"
  destructiveText: {
    color: '#ef4444', // Color rojo
    fontWeight: 'bold',
  }
});