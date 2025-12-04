import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../constants';

const { width, height } = Dimensions.get('window');

/**
 * Particle Burst Animation Component
 * Creates a burst of particles from a center point
 */
export default function ParticleBurst({
  visible,
  x = width / 2,
  y = height / 2,
  color = COLORS.accent.primary,
  particleCount = 30,
  duration = 1000,
}) {
  const particles = useRef(
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      angle: (Math.PI * 2 * i) / particleCount,
      distance: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      particles.forEach((particle) => {
        // Reset
        particle.distance.setValue(0);
        particle.opacity.setValue(1);
        particle.scale.setValue(1);

        // Animate burst
        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Animate distance separately (can't use native driver for position)
        Animated.timing(particle.distance, {
          toValue: 100 + Math.random() * 50,
          duration: duration,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => {
        const translateX = particle.distance.interpolate({
          inputRange: [0, 150],
          outputRange: [0, Math.cos(particle.angle) * 150],
        });
        const translateY = particle.distance.interpolate({
          inputRange: [0, 150],
          outputRange: [0, Math.sin(particle.angle) * 150],
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                backgroundColor: color,
                left: x,
                top: y,
                transform: [
                  { translateX },
                  { translateY },
                  { scale: particle.scale },
                ],
                opacity: particle.opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

