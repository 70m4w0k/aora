import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow } from '../utils/visualEffects';

/**
 * XP Bar Style Progress Indicator
 * RPG-themed loading progress bar
 */
export default function XpProgressIndicator({ 
  progress = 0, // 0-1
  indeterminate = false,
  label = 'Loading...',
  showLabel = true,
  style,
}) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (indeterminate) {
      // Animate progress bar back and forth
      const progressLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnim, {
            toValue: 0.8,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(progressAnim, {
            toValue: 0.2,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      );
      progressLoop.start();

      // Shimmer effect
      const shimmerLoop = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      shimmerLoop.start();

      // Pulse effect
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => {
        progressLoop.stop();
        shimmerLoop.stop();
        pulseLoop.stop();
      };
    } else {
      // Animate to specific progress
      Animated.spring(progressAnim, {
        toValue: progress,
        tension: 50,
        friction: 7,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, indeterminate]);

  const width = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View style={[styles.container, style]}>
      {showLabel && label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <Animated.View
        style={[
          styles.progressBarContainer,
          {
            transform: [{ scaleY: pulseAnim }],
          },
        ]}
      >
        {/* Background */}
        <View style={styles.progressBarBackground} />

        {/* Progress Fill */}
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width,
            },
          ]}
        >
          <LinearGradient
            colors={COLORS.gradients?.xp || ['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Shimmer Effect */}
          {indeterminate && (
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX: shimmerTranslateX }],
                },
              ]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}

          {/* Glow Effect */}
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.glow,
              ...createGlow(COLORS.accent.primary, 0.6),
            ]}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: '50%',
  },
  glow: {
    borderRadius: 4,
  },
});

