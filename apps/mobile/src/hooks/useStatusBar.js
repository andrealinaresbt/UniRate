// hooks/useStatusBar.js
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { useCallback } from 'react';

export function useStatusBar(style = 'dark') {
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(style === 'light' ? 'light-content' : 'dark-content');
    }, [style])
  );
}