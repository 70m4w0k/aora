import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow } from '../utils/visualEffects';

/**
 * Custom RPG-themed Refresh Control
 * Replaces default pull-to-refresh with RPG-style animation
 */
export default function CustomRefreshControl({ refreshing, onRefresh, progress = 0 }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshing) {
      // Continuous rotation
      rotateAnim.setValue(0);
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();

      // Pulsing scale
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      rotateAnim.stopAnimation();
      scaleAnim.setValue(0.8);
      glowAnim.setValue(0);
    }
  }, [refreshing]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const pullProgress = Math.min(progress, 1);
  const shouldShow = pullProgress > 0 || refreshing;

  if (!shouldShow) return null;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { rotate: rotation },
              { scale: refreshing ? scaleAnim : pullProgress },
            ],
            opacity: refreshing ? 1 : pullProgress,
          },
        ]}
      >
        {/* Glow Effect */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: glowOpacity,
              borderRadius: 20,
              ...createGlow(COLORS.accent.primary, 0.8),
            },
          ]}
        />

        {/* Gradient Background */}
        <LinearGradient
          colors={COLORS.gradients?.xp || ['#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Ionicons name="refresh" size={24} color={COLORS.textPrimary} />
        </LinearGradient>
      </Animated.View>

      {refreshing && (
        <Text style={styles.text}>Refreshing...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});

