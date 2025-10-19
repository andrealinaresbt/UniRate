// components/RangeSlider.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  PanResponder,
  StyleSheet,
  Dimensions
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RangeSlider({ 
  min, 
  max, 
  initialLow = min, 
  initialHigh = max, 
  onValueChange,
  step = 1 
}) {
  const [lowValue, setLowValue] = useState(initialLow);
  const [highValue, setHighValue] = useState(initialHigh);
  const [sliderWidth, setSliderWidth] = useState(0);
  const lowThumbRef = useRef(null); // CORREGIDO
  const highThumbRef = useRef(null); // CORREGIDO
  const [activeThumb, setActiveThumb] = useState(null);

  const calculateValueFromPosition = (xPosition) => {
    if (sliderWidth === 0) return min;
    
    const percentage = Math.min(100, Math.max(0, (xPosition / sliderWidth) * 100));
    const value = min + ((percentage / 100) * (max - min));
    return Math.round(value / step) * step;
  };

  const updateValues = (newLow, newHigh) => {
    const clampedLow = Math.min(Math.max(min, newLow), highValue - step);
    const clampedHigh = Math.max(Math.min(max, newHigh), lowValue + step);
    
    setLowValue(clampedLow);
    setHighValue(clampedHigh);
    
    if (onValueChange) {
      onValueChange(clampedLow, clampedHigh);
    }
  };

  const lowPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => setActiveThumb('low'),
    onPanResponderMove: (_, gestureState) => {
      const newValue = calculateValueFromPosition(gestureState.moveX);
      updateValues(newValue, highValue);
    },
    onPanResponderRelease: () => setActiveThumb(null),
  });

  const highPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => setActiveThumb('high'),
    onPanResponderMove: (_, gestureState) => {
      const newValue = calculateValueFromPosition(gestureState.moveX);
      updateValues(lowValue, newValue);
    },
    onPanResponderRelease: () => setActiveThumb(null),
  });

  const lowPosition = ((lowValue - min) / (max - min)) * 100;
  const highPosition = ((highValue - min) / (max - min)) * 100;

  return (
    <View style={styles.container}>
      {/* Etiquetas de valores */}
      <View style={styles.valueLabels}>
        <Text style={styles.valueLabel}>{lowValue}</Text>
        <Text style={styles.valueLabel}>-</Text>
        <Text style={styles.valueLabel}>{highValue}</Text>
      </View>

      {/* Track del slider */}
      <View 
        style={styles.track}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setSliderWidth(width);
        }}
      >
        {/* Línea completa */}
        <View style={styles.fullTrack} />
        
        {/* Línea activa entre los thumbs */}
        <View 
          style={[
            styles.activeTrack,
            { 
              left: `${lowPosition}%`,
              width: `${highPosition - lowPosition}%`
            }
          ]} 
        />
        
        {/* Thumb izquierdo (mínimo) */}
        <View
          ref={lowThumbRef}
          style={[
            styles.thumb,
            styles.thumbLeft,
            activeThumb === 'low' && styles.thumbActive,
            { left: `${lowPosition}%` }
          ]}
          {...lowPanResponder.panHandlers}
        />
        
        {/* Thumb derecho (máximo) */}
        <View
          ref={highThumbRef}
          style={[
            styles.thumb,
            styles.thumbRight,
            activeThumb === 'high' && styles.thumbActive,
            { left: `${highPosition}%` }
          ]}
          {...highPanResponder.panHandlers}
        />
      </View>

      {/* Marcas */}
      <View style={styles.marks}>
        {[min, min + 1, min + 2, min + 3, max].map((mark) => (
          <Text key={mark} style={styles.mark}>{mark}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  valueLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  valueLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginHorizontal: 4,
  },
  track: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  fullTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#E9ECEF',
    borderRadius: 2,
  },
  activeTrack: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FF6B6B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbLeft: {
    marginLeft: -12,
  },
  thumbRight: {
    marginLeft: -12,
  },
  thumbActive: {
    borderWidth: 4,
    shadowOpacity: 0.3,
    elevation: 5,
  },
  marks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  mark: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});