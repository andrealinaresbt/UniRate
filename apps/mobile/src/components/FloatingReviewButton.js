import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TIP_KEY = 'didShowReviewFabHint';
const ORANGE = '#FF7A00';

export default function FloatingReviewButton({
  onPress,
  bottom = 28,
  right = 24,
  label = 'Crear reseña',
  showHintOnFirstTime = true,
}) {
  const [showTip, setShowTip] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const hideTimer = useRef(null);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
    ]).start();
  };

  const animateOut = (cb) => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 8, duration: 140, useNativeDriver: true }),
    ]).start(() => cb?.());
  };

  // Hint automático la primera vez
  useEffect(() => {
    (async () => {
      if (!showHintOnFirstTime) return;
      try {
        const seen = await AsyncStorage.getItem(TIP_KEY);
        if (!seen) {
          setShowTip(true);
          animateIn();
          hideTimer.current = setTimeout(() => animateOut(() => setShowTip(false)), 1800);
          await AsyncStorage.setItem(TIP_KEY, '1');
        }
      } catch {}
    })();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  // Mostrar en press-in y ocultar en press-out
  const handlePressIn = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowTip(true);
    animateIn();
  };

  const handlePressOut = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    animateOut(() => setShowTip(false));
  };

  // === Forzar 2 líneas sin cortar palabras ===
  // Si el label ya trae '\n', lo respetamos; si no, reemplazamos el primer espacio.
  const formattedLabel = label.includes('\n') ? label : label.replace(/\s+/, '\n');

  return (
    <View pointerEvents="box-none" style={[styles.container, { bottom, right }]}>
      {showTip && (
        <Animated.View
          pointerEvents="none"
          style={[styles.tooltipWrap, { opacity, transform: [{ translateY }] }]}
        >
          <View style={styles.tooltipBubble}>
            <Text style={styles.tooltipText} numberOfLines={2}>
              {formattedLabel}
            </Text>
            {/* Flecha rombo del mismo color */}
            <View style={styles.tooltipArrow} />
          </View>
        </Animated.View>
      )}

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  // Tooltip arriba del botón
  tooltipWrap: {
    position: 'absolute',
    bottom: 64,
    right: 0,
    alignItems: 'flex-end',
    zIndex: 1000,
    elevation: 12,
  },
  tooltipBubble: {
    backgroundColor: ORANGE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 110,         // evita que “apriete” y rompa letras
    maxWidth: 260,
    alignItems: 'center',  // centra el texto
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 12,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
  },
  // Flecha como rombo (más estable que bordes)
  tooltipArrow: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: ORANGE,
    transform: [{ rotate: '45deg' }],
    bottom: -6,
    right: 16,
    elevation: 12,
  },
});
