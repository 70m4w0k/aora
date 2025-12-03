import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const COLORS = {
  bg: '#0A0A0C',
  skeleton: '#18181B',
  shimmer: '#27272A',
};

/**
 * Shimmer animation component
 */
const Shimmer = ({ style }) => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
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
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          backgroundColor: COLORS.shimmer,
        },
      ]}
    />
  );
};

/**
 * Skeleton line component
 */
export const SkeletonLine = ({ width = '100%', height = 16, style }) => {
  return (
    <View style={[styles.skeletonLine, { width, height }, style]}>
      <Shimmer style={StyleSheet.absoluteFill} />
    </View>
  );
};

/**
 * Skeleton card component
 */
export const SkeletonCard = ({ style }) => {
  return (
    <View style={[styles.skeletonCard, style]}>
      <Shimmer style={StyleSheet.absoluteFill} />
      <View style={styles.cardContent}>
        <SkeletonLine width="60%" height={20} style={styles.cardTitle} />
        <SkeletonLine width="40%" height={14} style={styles.cardSubtitle} />
        <SkeletonLine width="80%" height={14} />
      </View>
    </View>
  );
};

/**
 * Skeleton list component
 */
export const SkeletonList = ({ count = 3, itemHeight = 80 }) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} style={{ height: itemHeight, marginBottom: 12 }} />
      ))}
    </View>
  );
};

/**
 * Calendar skeleton for monthly view
 */
export const CalendarSkeleton = () => {
  return (
    <View style={styles.calendarContainer}>
      {/* Header skeleton */}
      <View style={styles.calendarHeader}>
        <SkeletonLine width={100} height={24} />
        <SkeletonLine width={80} height={20} />
      </View>
      
      {/* Week days skeleton */}
      <View style={styles.weekDays}>
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonLine key={i} width={40} height={16} />
        ))}
      </View>
      
      {/* Calendar grid skeleton */}
      <View style={styles.calendarGrid}>
        {Array.from({ length: 35 }).map((_, i) => (
          <View key={i} style={styles.dayCellSkeleton}>
            <Shimmer style={StyleSheet.absoluteFill} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonLine: {
    backgroundColor: COLORS.skeleton,
    borderRadius: 4,
    overflow: 'hidden',
  },
  skeletonCard: {
    backgroundColor: COLORS.skeleton,
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
  cardContent: {
    gap: 8,
  },
  cardTitle: {
    marginBottom: 4,
  },
  cardSubtitle: {
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
  },
  calendarContainer: {
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCellSkeleton: {
    width: '13%',
    aspectRatio: 1,
    backgroundColor: COLORS.skeleton,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
});

export default {
  SkeletonLine,
  SkeletonCard,
  SkeletonList,
  CalendarSkeleton,
};

