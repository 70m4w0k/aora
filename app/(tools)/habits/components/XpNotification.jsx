import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

export default function XpNotification({ xpNotification, onAnimationComplete }) {
  const xpAnim = useRef(new Animated.Value(0)).current;
  const xpScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (xpNotification) {
      // Reset animations
      xpAnim.setValue(0);
      xpScale.setValue(0);
      
      // Animate scale (pop in)
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
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(xpScale, {
            toValue: 0.8,
            duration: 1700,
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
      <View style={[
        styles.xpNotificationContent,
        xpNotification.arcColor && { borderColor: xpNotification.arcColor },
      ]}>
        <Ionicons name="star" size={20} color={xpNotification.arcColor || COLORS.accent.primary} />
        <Text style={[
          styles.xpNotificationText,
          xpNotification.arcColor && { color: xpNotification.arcColor },
        ]}>
          +{xpNotification.xp} XP
        </Text>
      </View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  xpNotificationText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent.primary,
    letterSpacing: 0.5,
  },
});

