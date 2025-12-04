import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow } from '../utils/visualEffects';
import CircularProgress from './CircularProgress';

/**
 * Stat Card Component
 * RPG-style dashboard widget for displaying statistics
 */
export default function StatCard({
  title,
  value,
  label,
  icon,
  iconColor = COLORS.accent.primary,
  progress = null, // 0-100 for circular progress
  trend = null, // { value: number, isPositive: boolean }
  onPress,
  gradient = null,
  style,
}) {
  const CardContent = (
    <View style={[styles.card, style]}>
      {/* Header */}
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {progress !== null ? (
          <View style={styles.progressContainer}>
            <CircularProgress
              progress={progress}
              size={100}
              strokeWidth={10}
              color={iconColor}
              gradient={gradient}
              showPercentage={true}
            />
          </View>
        ) : (
          <>
            <Text style={[styles.value, { color: iconColor }]}>{value}</Text>
            {label && <Text style={styles.label}>{label}</Text>}
          </>
        )}
      </View>

      {/* Trend */}
      {trend && (
        <View style={styles.trend}>
          <Ionicons
            name={trend.isPositive ? 'trending-up' : 'trending-down'}
            size={14}
            color={trend.isPositive ? COLORS.accent.success : COLORS.accent.danger}
          />
          <Text
            style={[
              styles.trendText,
              { color: trend.isPositive ? COLORS.accent.success : COLORS.accent.danger },
            ]}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...createGlow(COLORS.glows.primary, 0.2),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    color: COLORS.textTertiary,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  value: {
    ...TYPOGRAPHY.hero,
    fontSize: 32,
    marginBottom: 4,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  trendText: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
  },
});

