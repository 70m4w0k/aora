import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import { createGlow } from '../utils/visualEffects';
import { hapticAction } from '../utils/haptics';

/**
 * Animated Button Component
 * Enhanced button with scale and glow effects
 */
export default function AnimatedButton({
  children,
  onPress,
  style,
  variant = 'primary', // 'primary', 'secondary', 'danger', 'success'
  disabled = false,
  glowColor = null,
  ...props
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          gradient: COLORS.gradients?.xp || ['#8B5CF6', '#EC4899'],
          glow: COLORS.glows?.primary || '#8B5CF6',
        };
      case 'secondary':
        return {
          gradient: [COLORS.surface, COLORS.card],
          glow: COLORS.border,
        };
      case 'danger':
        return {
          gradient: ['#EF4444', '#DC2626'],
          glow: '#EF4444',
        };
      case 'success':
        return {
          gradient: ['#10B981', '#059669'],
          glow: '#10B981',
        };
      default:
        return {
          gradient: COLORS.gradients?.xp || ['#8B5CF6', '#EC4899'],
          glow: COLORS.glows?.primary || '#8B5CF6',
        };
    }
  };

  const colors = getVariantColors();
  const finalGlowColor = glowColor || colors.glow;

  const handlePressIn = () => {
    if (disabled) return;
    hapticAction();
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        tension: 400,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 400,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...props}
    >
      <Animated.View
        style={[
          styles.button,
          style,
          {
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {/* Glow Effect */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: glowOpacity,
              borderRadius: style?.borderRadius || 12,
              ...createGlow(finalGlowColor, 0.8),
            },
          ]}
          pointerEvents="none"
        />
        
        {/* Gradient Background */}
        {variant === 'primary' || variant === 'danger' || variant === 'success' ? (
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: style?.borderRadius || 12 }]}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: COLORS.surface,
                borderRadius: style?.borderRadius || 12,
                borderWidth: 1,
                borderColor: COLORS.border,
              },
            ]}
          />
        )}
        
        {/* Content */}
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});

