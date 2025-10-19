// apps/mobile/src/components/SearchBarDebounced.js
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

export default function SearchBarDebounced({ value, onChangeText, placeholder }) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 12, paddingTop: 8 },
  input: {
    backgroundColor: '#0f172a', // azul oscuro legible en tema claro
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
