import React, { useRef } from 'react';
import { View, Animated, PanResponder, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import { hapticAction } from '../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

/**
 * Swipeable Card Component
 * Enables swipe gestures for actions (complete, delete, etc.)
 */
export default function SwipeableCard({
  children,
  onSwipeRight, // Complete action
  onSwipeLeft,  // Delete action
  rightActionColor = COLORS.accent.success || '#10B981',
  leftActionColor = COLORS.accent.danger || '#EF4444',
  rightIcon = 'checkmark-circle',
  leftIcon = 'trash',
  disabled = false,
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 && !disabled;
      },
      onPanResponderGrant: () => {
        hapticAction();
        translateX.setOffset(translateX._value);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
        
        // Update opacity based on swipe distance
        const progress = Math.abs(gestureState.dx) / SWIPE_THRESHOLD;
        opacity.setValue(Math.min(progress, 1));
      },
      onPanResponderRelease: (_, gestureState) => {
        translateX.flattenOffset();
        
        const swipeDistance = gestureState.dx;
        const swipeVelocity = gestureState.vx;

        if (Math.abs(swipeDistance) > SWIPE_THRESHOLD || Math.abs(swipeVelocity) > 0.5) {
          // Swipe right (complete)
          if (swipeDistance > 0 && onSwipeRight) {
            Animated.parallel([
              Animated.timing(translateX, {
                toValue: SCREEN_WIDTH,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => {
              onSwipeRight();
              translateX.setValue(0);
              opacity.setValue(0);
            });
          }
          // Swipe left (delete)
          else if (swipeDistance < 0 && onSwipeLeft) {
            Animated.parallel([
              Animated.timing(translateX, {
                toValue: -SCREEN_WIDTH,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => {
              onSwipeLeft();
              translateX.setValue(0);
              opacity.setValue(0);
            });
          } else {
            // Spring back
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: 0,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
              }),
              Animated.spring(opacity, {
                toValue: 0,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
              }),
            ]).start();
          }
        } else {
          // Spring back
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 0,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const rightActionOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const leftActionOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Right Action (Complete) */}
      {onSwipeRight && (
        <Animated.View
          style={[
            styles.action,
            styles.rightAction,
            {
              opacity: rightActionOpacity,
              backgroundColor: rightActionColor,
            },
          ]}
        >
          <Ionicons name={rightIcon} size={32} color={COLORS.textPrimary} />
        </Animated.View>
      )}

      {/* Left Action (Delete) */}
      {onSwipeLeft && (
        <Animated.View
          style={[
            styles.action,
            styles.leftAction,
            {
              opacity: leftActionOpacity,
              backgroundColor: leftActionColor,
            },
          ]}
        >
          <Ionicons name={leftIcon} size={32} color={COLORS.textPrimary} />
        </Animated.View>
      )}

      {/* Card Content */}
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    backgroundColor: COLORS.card,
  },
  action: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  rightAction: {
    right: 0,
  },
  leftAction: {
    left: 0,
  },
});

