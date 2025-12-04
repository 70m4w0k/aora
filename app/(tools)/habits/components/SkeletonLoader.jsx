import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants';

/**
 * Skeleton Loader Component
 * RPG-themed skeleton loading placeholders
 */
export default function SkeletonLoader({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  style,
  variant = 'default' // 'default', 'card', 'circle'
}) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const getVariantStyle = () => {
    switch (variant) {
      case 'card':
        return {
          width: width === '100%' ? '100%' : width,
          height: height,
          borderRadius: borderRadius,
        };
      case 'circle':
        return {
          width: width === '100%' ? height : width,
          height: height,
          borderRadius: height / 2,
        };
      default:
        return {
          width: width === '100%' ? '100%' : width,
          height: height,
          borderRadius: borderRadius,
        };
    }
  };

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View style={[styles.container, getVariantStyle(), style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            opacity,
            backgroundColor: COLORS.surface,
          },
        ]}
      />
      <View
        style={[
          styles.base,
          getVariantStyle(),
          {
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
          },
        ]}
      />
    </View>
  );
}

/**
 * Skeleton Card Component
 * Pre-configured skeleton for card layouts
 */
export function SkeletonCard({ style }) {
  return (
    <View style={[styles.cardContainer, style]}>
      <SkeletonLoader variant="circle" height={48} width={48} />
      <View style={styles.cardContent}>
        <SkeletonLoader height={16} width="70%" style={{ marginBottom: 8 }} />
        <SkeletonLoader height={12} width="50%" />
      </View>
    </View>
  );
}

/**
 * Skeleton Quest Card Component
 * Pre-configured skeleton for quest cards
 */
export function SkeletonQuestCard({ style }) {
  return (
    <View style={[styles.questCardContainer, style]}>
      <View style={styles.questCardHeader}>
        <SkeletonLoader variant="circle" height={40} width={40} />
        <View style={styles.questCardInfo}>
          <SkeletonLoader height={16} width="80%" style={{ marginBottom: 6 }} />
          <SkeletonLoader height={12} width="60%" />
        </View>
      </View>
      <SkeletonLoader height={8} width="100%" style={{ marginTop: 12 }} />
      <View style={styles.questCardFooter}>
        <SkeletonLoader height={12} width={60} />
        <SkeletonLoader height={24} width={80} borderRadius={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  base: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  questCardContainer: {
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  questCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
});

