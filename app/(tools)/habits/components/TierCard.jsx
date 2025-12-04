import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants';
import { TargetTypes } from '../../../../lib/appwrite';
import { createGlow, getRarityColor } from '../utils/visualEffects';
import GlowView from './GlowView';

/**
 * Achievement-Style Tier Card Component
 * RPG-style tier/milestone card with achievement aesthetics
 */
export default function TierCard({
  tier,
  arc,
  progress,
  isCompleted = false,
  onPress,
  onLongPress,
  onComplete,
}) {
  const arcColor = arc?.color || COLORS.accent.primary;
  const xpReward = tier.xpReward || 100;
  const rarityColor = getRarityColor(Math.floor(xpReward / 10)); // Base rarity on XP reward
  
  const progressPercent = isCompleted ? 100 : (progress?.percentage || 0);
  const current = progress?.current || 0;
  const target = progress?.target || tier.targetValue || 100;
  
  const targetTypeLabel = tier.targetType === TargetTypes.DAYS 
    ? 'days' 
    : tier.targetType === TargetTypes.COUNT 
    ? 'completions' 
    : 'items';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCompleted && styles.cardCompleted,
        { borderColor: isCompleted ? COLORS.accent.success : arcColor },
      ]}
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {/* Achievement Badge */}
      <View style={styles.badgeSection}>
        <GlowView
          glowColor={isCompleted ? COLORS.accent.success : rarityColor}
          intensity={isCompleted ? 0.8 : 0.4}
          style={styles.badgeContainer}
        >
          <LinearGradient
            colors={isCompleted 
              ? [COLORS.accent.success, COLORS.gradients.success[1]]
              : [arcColor, rarityColor]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badgeGradient}
          >
            {isCompleted ? (
              <Ionicons name="trophy" size={40} color={COLORS.textPrimary} />
            ) : (
              <Ionicons name="flag-outline" size={40} color={COLORS.textPrimary} />
            )}
          </LinearGradient>
        </GlowView>
        
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.accent.success} />
          </View>
        )}
      </View>

      {/* Tier Info */}
      <View style={styles.infoSection}>
        <View style={styles.header}>
          <Text style={styles.tierName} numberOfLines={2}>
            {tier.name}
          </Text>
          {tier.titleReward && (
            <View style={styles.titleRewardBadge}>
              <Ionicons name="star" size={14} color={COLORS.rarity.legendary} />
              <Text style={styles.titleRewardText}>Title</Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="layers" size={14} color={arcColor} />
            <Text style={styles.metaText}>{arc?.name || 'Unassigned'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={14} color={COLORS.accent.primary} />
            <Text style={styles.metaText}>+{xpReward} XP</Text>
          </View>
        </View>

        {/* Progress Ring/Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <LinearGradient
                colors={[arcColor, rarityColor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
          </View>
          <Text style={styles.progressText}>
            {isCompleted 
              ? '✓ Completed!' 
              : `${Math.floor(current)} / ${target} ${targetTypeLabel}`
            }
          </Text>
        </View>
      </View>

      {/* Complete Button */}
      {!isCompleted && (
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: `${arcColor}20` }]}
          onPress={(e) => {
            e.stopPropagation();
            onComplete?.();
          }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[arcColor, COLORS.accent.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.completeButtonGradient}
          >
            <Ionicons name="checkmark-circle" size={24} color={COLORS.textPrimary} />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    overflow: 'hidden',
    ...createGlow(COLORS.glows.primary, 0.2),
  },
  cardCompleted: {
    borderColor: COLORS.accent.success,
    ...createGlow(COLORS.glows.success, 0.4),
  },
  badgeSection: {
    marginRight: 16,
    position: 'relative',
  },
  badgeContainer: {
    width: 70,
    height: 70,
    borderRadius: 18,
    overflow: 'hidden',
  },
  badgeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 2,
  },
  infoSection: {
    flex: 1,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  tierName: {
    ...TYPOGRAPHY.subtitle,
    fontSize: 18,
    color: COLORS.textPrimary,
    flex: 1,
  },
  titleRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.rarity.legendary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  titleRewardText: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    color: COLORS.rarity.legendary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...TYPOGRAPHY.body,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressSection: {
    marginTop: 8,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: COLORS.elevated,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  completeButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  completeButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

