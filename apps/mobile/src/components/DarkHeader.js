import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Svg, Path } from 'react-native-svg';

const MenuIcon = (props) => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M4 6h16M4 12h16M4 18h16" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Header = ({ onMenuPress }) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
      <MenuIcon />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: '#003087', 
    paddingTop: Platform.OS === 'android' ? 20 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  menuButton: { 
    padding: 8,
    borderRadius: 8,
  },
});