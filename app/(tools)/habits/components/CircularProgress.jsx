import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '../constants';

/**
 * Percentage Counter Component
 */
function PercentageCounter({ animatedValue, style }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [animatedValue]);

  return <Text style={style}>{displayValue}%</Text>;
}

/**
 * Circular Progress Indicator Component
 * Simplified View-based circular progress (no SVG)
 */
export default function CircularProgress({
  progress = 0, // 0-100
  size = 80,
  strokeWidth = 8,
  color = COLORS.accent.primary,
  gradient = null,
  showPercentage = true,
  label = '',
  animated = true,
  style,
}) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      progressAnim.setValue(progress);
      scaleAnim.setValue(1);
    }
  }, [progress, animated]);

  const colors = gradient || [color, color];
  const radius = (size - strokeWidth) / 2;
  const progressAngle = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {/* Background circle */}
      <View
        style={[
          styles.circleBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
          },
        ]}
      />

      {/* Progress indicator using conic gradient simulation */}
      <View
        style={[
          styles.progressMask,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
              borderWidth: strokeWidth,
              transform: [{ rotate: progressAngle }],
            },
          ]}
        >
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* Center content */}
      <View style={styles.centerContent}>
        {showPercentage && (
          <PercentageCounter
            animatedValue={progressAnim}
            style={[styles.percentage, { fontSize: size * 0.2 }]}
          />
        )}
        {label && (
          <Text style={[styles.label, { fontSize: size * 0.12 }]} numberOfLines={1}>
            {label}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleBackground: {
    position: 'absolute',
    borderColor: COLORS.elevated,
  },
  progressMask: {
    position: 'absolute',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    borderColor: COLORS.accent.primary,
    overflow: 'hidden',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  percentage: {
    ...TYPOGRAPHY.stat,
    color: COLORS.textPrimary,
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
});
