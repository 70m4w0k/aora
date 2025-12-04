import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../constants';

const { width, height } = Dimensions.get('window');

/**
 * Confetti Animation Component
 * Creates a confetti effect for celebrations
 */
export default function Confetti({ visible, color = COLORS.accent.primary, duration = 2000 }) {
  const confettiPieces = useRef(
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-20),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      confettiPieces.forEach((piece) => {
        // Reset position
        piece.x.setValue(Math.random() * width);
        piece.y.setValue(-20);
        piece.opacity.setValue(1);
        piece.rotation.setValue(0);

        // Animate falling
        Animated.parallel([
          Animated.timing(piece.y, {
            toValue: height + 50,
            duration: duration + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(piece.rotation, {
            toValue: Math.random() * 720,
            duration: duration + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(duration * 0.7),
            Animated.timing(piece.opacity, {
              toValue: 0,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map((piece) => (
        <Animated.View
          key={piece.id}
          style={[
            styles.confettiPiece,
            {
              backgroundColor: color,
              left: piece.x,
              transform: [
                { translateY: piece.y },
                {
                  rotate: piece.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: piece.opacity,
            },
          ]}
        />
      ))}
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
    zIndex: 9999,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});

