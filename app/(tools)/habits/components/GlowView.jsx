import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createGlow, createBorderGlow } from '../utils/visualEffects';
import { COLORS } from '../constants';

/**
 * GlowView Component
 * A wrapper component that adds glow effects to its children
 */
export default function GlowView({ 
  children, 
  glowColor = COLORS.glows.primary, 
  intensity = 1,
  borderGlow = false,
  borderColor = COLORS.accent.primary,
  borderWidth = 2,
  style,
  ...props 
}) {
  const glowStyle = borderGlow 
    ? createBorderGlow(borderColor, borderWidth)
    : createGlow(glowColor, intensity);

  return (
    <View style={[styles.container, glowStyle, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Container styles can be customized
  },
});

