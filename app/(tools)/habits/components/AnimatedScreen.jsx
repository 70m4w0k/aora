import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * Animated Screen Wrapper
 * Provides slide/fade transitions for tab screens
 */
export default function AnimatedScreen({ 
  children, 
  active, 
  direction = 'horizontal' // 'horizontal' or 'vertical'
}) {
  const [isVisible, setIsVisible] = React.useState(active);
  const slideAnim = useRef(new Animated.Value(active ? 0 : (direction === 'horizontal' ? 1 : 1))).current;
  const fadeAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    if (active) {
      setIsVisible(true);
      // Slide in from right
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out to left
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: direction === 'horizontal' ? -1 : -1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
      });
    }
  }, [active]);

  const translateX = slideAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-100, 0, 100],
  });

  const translateY = slideAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-50, 0, 50],
  });

  if (!isVisible && !active) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: direction === 'horizontal' ? translateX : 0 },
            { translateY: direction === 'vertical' ? translateY : 0 },
          ],
        },
      ]}
      pointerEvents={active ? 'auto' : 'none'}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

