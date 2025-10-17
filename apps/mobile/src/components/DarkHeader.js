import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Svg, Path } from 'react-native-svg';

const MenuIcon = (props) => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M4 6h16M4 12h16M4 18h16" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Header = ({ onMenuPress, user, onLoginPress, isLoading = false }) => (
  <View style={styles.header}>
    {/* Botón menú izquierda - siempre visible */}
    <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
      <MenuIcon />
    </TouchableOpacity>

    {/* Espacio central */}
    <View style={styles.center} />

    {/* Estados del lado derecho */}
    {isLoading ? (
      // Durante carga - mostrar spinner
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    ) : (
      // Cuando la carga ha terminado, decidir qué mostrar
      !user ? (
        // No hay usuario - mostrar botón login
        <TouchableOpacity style={styles.loginButton} onPress={onLoginPress}>
          <Text style={styles.loginText}>Iniciar sesión</Text>
        </TouchableOpacity>
      ) : (
        // Hay usuario - mostrar placeholder
        <View style={styles.placeholder} />
      )
    )}
  </View>
);

const styles = StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: '#003087', 
    paddingTop: Platform.OS === 'android' ? 20 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 70, 
  },
  menuButton: { 
    padding: 8,
    borderRadius: 8,
  },
  center: {
    flex: 1,
  },
  loadingContainer: {
    width: 100,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  loginText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#003087',
  },
  placeholder: {
    width: 100, 
    height: 36,
  },
});