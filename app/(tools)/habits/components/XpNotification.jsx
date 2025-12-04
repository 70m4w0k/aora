import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow } from '../utils/visualEffects';
import { hapticQuestComplete } from '../utils/haptics';

export default function XpNotification({ xpNotification, onAnimationComplete }) {
  const xpAnim = useRef(new Animated.Value(0)).current;
  const xpScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (xpNotification) {
      // Haptic feedback
      hapticQuestComplete();
      
      // Reset animations
      xpAnim.setValue(0);
      xpScale.setValue(0);
      
      // Animate scale (pop in with bounce)
      Animated.spring(xpScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
      
      // Animate upward and fade out
      Animated.parallel([
        Animated.timing(xpAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(xpScale, {
            toValue: 0.7,
            duration: 2100,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Reset after animation
        if (onAnimationComplete) {
          onAnimationComplete();
        }
        xpAnim.setValue(0);
        xpScale.setValue(0);
      });
    }
  }, [xpNotification]);

  if (!xpNotification) return null;

  return (
    <Animated.View
      style={[
        styles.xpNotification,
        {
          opacity: xpAnim.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0, 1, 0],
          }),
          transform: [
            {
              translateY: xpAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -100],
              }),
            },
            {
              scale: xpScale.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1.2, 1],
              }),
            },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={xpNotification.arcColor 
          ? [xpNotification.arcColor, COLORS.accent.primary]
          : COLORS.gradients.xp
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.xpNotificationContent,
          xpNotification.arcColor && { borderColor: xpNotification.arcColor },
        ]}
      >
        <Ionicons name="star" size={24} color={COLORS.textPrimary} />
        <Text style={styles.xpNotificationText}>
          +{xpNotification.xp} XP
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  xpNotification: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  xpNotificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
    ...createGlow(COLORS.glows.xp, 0.8),
    gap: 10,
  },
  xpNotificationText: {
    ...TYPOGRAPHY.title,
    fontSize: 20,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
});

