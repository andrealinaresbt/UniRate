import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/Header';

export default function CourseProfile({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <Header onMenuPress={() => navigation.goBack()} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Perfil de materia</Text>
        <Text style={styles.message}>Pantalla en desarrollo</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D2C54',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
  },
});



