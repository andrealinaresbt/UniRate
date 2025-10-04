// components/BackButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function BackButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.navigate('Home')} // o tu pantalla principal
    >
      <Text style={styles.arrow}>←</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 40, // ajusta según tu SafeArea
    left: 20,
    zIndex: 10,
  },
  arrow: {
    fontSize: 28,
    color: '#FFF', // o el color que quieras
  },
});
