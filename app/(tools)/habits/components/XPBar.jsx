import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow } from '../utils/visualEffects';

/**
 * Enhanced XP Bar Component
 * Displays XP progress with gradient fill and glow effects
 */
export default function XPBar({
  currentXP = 0,
  xpForNextLevel = 100,
  xpForCurrentLevel = 0,
  level = 1,
  animated = true,
  showText = true,
  height = 8,
  style,
}) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  // Calculate progress percentage
  const xpInCurrentLevel = Math.max(0, currentXP - xpForCurrentLevel);
  const progressPercent = Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100);

  useEffect(() => {
    if (animated) {
      // Animate progress bar fill
      Animated.timing(progressAnim, {
        toValue: progressPercent,
        duration: 800,
        useNativeDriver: false,
      }).start();

      // Animate glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1.2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      progressAnim.setValue(progressPercent);
    }
  }, [progressPercent, animated]);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { height }, style]}>
      {/* Background bar */}
      <View style={[styles.background, { height }]} />
      
      {/* Gradient fill */}
      <Animated.View
        style={[
          styles.fillContainer,
          {
            width: animatedWidth,
            height,
            ...(animated ? createGlow(COLORS.glows.xp, 0.6) : {}),
          },
        ]}
      >
        <LinearGradient
          colors={COLORS.gradients.xp}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Text overlay */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={styles.text}>
            {Math.floor(xpInCurrentLevel)} / {xpForNextLevel} XP → Level {level + 1}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    width: '100%',
    backgroundColor: COLORS.elevated,
    borderRadius: 4,
  },
  fillContainer: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  textContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

