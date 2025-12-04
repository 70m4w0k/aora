import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow } from '../utils/visualEffects';

/**
 * Animated XP Counter Component
 */
function XPCounter({ animatedValue, maxValue, suffix = '', style }) {
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.floor(value));
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [animatedValue]);

  return (
    <Text style={style}>
      {displayValue}{suffix}
    </Text>
  );
}

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
  showMilestones = false,
  style,
}) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;
  const xpCounterAnim = useRef(new Animated.Value(0)).current;

  // Calculate progress percentage
  const xpInCurrentLevel = Math.max(0, currentXP - xpForCurrentLevel);
  const progressPercent = Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100);
  
  // Animated XP counter
  const animatedXP = xpCounterAnim.interpolate({
    inputRange: [0, xpInCurrentLevel],
    outputRange: [0, xpInCurrentLevel],
  });

  useEffect(() => {
    if (animated) {
      // Animate progress bar fill
      Animated.timing(progressAnim, {
        toValue: progressPercent,
        duration: 800,
        useNativeDriver: false,
      }).start();

      // Animate XP counter
      Animated.timing(xpCounterAnim, {
        toValue: xpInCurrentLevel,
        duration: 1000,
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
      xpCounterAnim.setValue(xpInCurrentLevel);
    }
  }, [progressPercent, xpInCurrentLevel, animated]);

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
            ...(animated ? createGlow(COLORS.glows.xp, 0.8) : {}),
          },
        ]}
      >
        <LinearGradient
          colors={COLORS.gradients.xp}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Inner glow effect */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
          }}
        />
      </Animated.View>

      {/* Milestone markers */}
      {showMilestones && (
        <View style={styles.milestonesContainer}>
          {[25, 50, 75].map((milestone) => (
            <View
              key={milestone}
              style={[
                styles.milestoneMarker,
                { left: `${milestone}%` },
              ]}
            />
          ))}
        </View>
      )}

      {/* Text overlay */}
      {showText && (
        <View style={styles.textContainer}>
          <XPCounter
            animatedValue={xpCounterAnim}
            maxValue={xpInCurrentLevel}
            suffix={` / ${xpForNextLevel} XP → Level ${level + 1}`}
            style={styles.text}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  background: {
    position: 'absolute',
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  fillContainer: {
    borderRadius: 8,
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
    fontSize: 11,
    color: COLORS.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  milestonesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    flexDirection: 'row',
  },
  milestoneMarker: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: COLORS.textTertiary,
    opacity: 0.3,
  },
});

