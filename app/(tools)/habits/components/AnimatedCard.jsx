import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import { createGlow } from '../utils/visualEffects';
import { hapticAction } from '../utils/haptics';

/**
 * Animated Card Component
 * Provides scale and glow effects on press
 */
export default function AnimatedCard({
  children,
  onPress,
  onLongPress,
  style,
  glowColor = null,
  disabled = false,
  ...props
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    hapticAction();
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
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
    outputRange: [0, 0.3],
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...props}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {glowColor && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: glowOpacity,
                borderRadius: style?.borderRadius || 12,
                ...createGlow(glowColor, 0.5),
              },
            ]}
            pointerEvents="none"
          />
        )}
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

