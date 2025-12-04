import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow, getRarityColor } from '../utils/visualEffects';

/**
 * Badge Component System
 * Supports: level, streak, rarity, status badges
 */
export default function Badge({
  type = 'default', // 'level', 'streak', 'rarity', 'status', 'default'
  value,
  label,
  size = 'medium', // 'small', 'medium', 'large'
  color = null,
  icon = null,
  style,
}) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 4,
          paddingHorizontal: 8,
          fontSize: 10,
          iconSize: 12,
          borderRadius: 8,
        };
      case 'large':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 14,
          iconSize: 18,
          borderRadius: 16,
        };
      default:
        return {
          paddingVertical: 6,
          paddingHorizontal: 12,
          fontSize: 12,
          iconSize: 14,
          borderRadius: 12,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const renderBadgeContent = () => {
    switch (type) {
      case 'level':
        const levelColor = color || getRarityColor(value || 1);
        return (
          <LinearGradient
            colors={[levelColor, `${levelColor}80`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.badge,
              {
                paddingVertical: sizeStyles.paddingVertical,
                paddingHorizontal: sizeStyles.paddingHorizontal,
                borderRadius: sizeStyles.borderRadius,
                ...createGlow(levelColor, 0.4),
              },
              style,
            ]}
          >
            <Ionicons name="star" size={sizeStyles.iconSize} color={COLORS.textPrimary} />
            <Text style={[styles.badgeText, { fontSize: sizeStyles.fontSize }]}>Lv {value}</Text>
          </LinearGradient>
        );

      case 'streak':
        return (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: `${COLORS.accent.warning}20`,
                paddingVertical: sizeStyles.paddingVertical,
                paddingHorizontal: sizeStyles.paddingHorizontal,
                borderRadius: sizeStyles.borderRadius,
                borderWidth: 1,
                borderColor: COLORS.accent.warning,
                ...createGlow(COLORS.glows.warning, 0.3),
              },
              style,
            ]}
          >
            <Ionicons name="flame" size={sizeStyles.iconSize} color={COLORS.accent.warning} />
            <Text style={[styles.badgeText, { fontSize: sizeStyles.fontSize, color: COLORS.accent.warning }]}>
              {value}
            </Text>
          </View>
        );

      case 'rarity':
        const rarityColor = color || getRarityColor(value || 1);
        return (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: `${rarityColor}20`,
                paddingVertical: sizeStyles.paddingVertical,
                paddingHorizontal: sizeStyles.paddingHorizontal,
                borderRadius: sizeStyles.borderRadius,
                borderWidth: 1,
                borderColor: rarityColor,
                ...createGlow(rarityColor, 0.3),
              },
              style,
            ]}
          >
            {icon && <Ionicons name={icon} size={sizeStyles.iconSize} color={rarityColor} style={styles.iconLeft} />}
            <Text style={[styles.badgeText, { fontSize: sizeStyles.fontSize, color: rarityColor }]}>
              {label || value}
            </Text>
          </View>
        );

      case 'status':
        const statusColor =
          value === 'completed' || value === 'active'
            ? COLORS.accent.success
            : value === 'pending'
            ? COLORS.accent.warning
            : COLORS.textTertiary;
        return (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: `${statusColor}20`,
                paddingVertical: sizeStyles.paddingVertical,
                paddingHorizontal: sizeStyles.paddingHorizontal,
                borderRadius: sizeStyles.borderRadius,
                borderWidth: 1,
                borderColor: statusColor,
              },
              style,
            ]}
          >
            {icon && <Ionicons name={icon} size={sizeStyles.iconSize} color={statusColor} style={styles.iconLeft} />}
            <Text style={[styles.badgeText, { fontSize: sizeStyles.fontSize, color: statusColor }]}>
              {label || value}
            </Text>
          </View>
        );

      default:
        return (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: color ? `${color}20` : COLORS.elevated,
                paddingVertical: sizeStyles.paddingVertical,
                paddingHorizontal: sizeStyles.paddingHorizontal,
                borderRadius: sizeStyles.borderRadius,
                borderWidth: color ? 1 : 0,
                borderColor: color || 'transparent',
              },
              style,
            ]}
          >
            {icon && (
              <Ionicons
                name={icon}
                size={sizeStyles.iconSize}
                color={color || COLORS.textSecondary}
                style={styles.iconLeft}
              />
            )}
            {value && (
              <Text style={[styles.badgeText, { fontSize: sizeStyles.fontSize, color: color || COLORS.textSecondary }]}>
                {value}
              </Text>
            )}
            {label && (
              <Text style={[styles.badgeText, { fontSize: sizeStyles.fontSize, color: color || COLORS.textSecondary }]}>
                {label}
              </Text>
            )}
          </View>
        );
    }
  };

  return renderBadgeContent();
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 4,
  },
});

