import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow, createBorderGlow, getRarityColor } from '../utils/visualEffects';
import { hapticQuestComplete } from '../utils/haptics';
import GlowView from './GlowView';

/**
 * Quest Card Component
 * RPG-style quest card with visual effects and status indicators
 */
export default function QuestCard({
  quest,
  arc,
  streak = 0,
  isCompleted = false,
  hasPenalty = false,
  penaltyData = null,
  onPress,
  onLongPress,
  onComplete,
  onOverridePenalty,
  showOverrideButton = false,
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  // Determine quest rarity based on XP
  const xpReward = quest.xpPerCompletion || 10;
  const getQuestRarity = () => {
    if (xpReward >= 50) return 'legendary';
    if (xpReward >= 30) return 'epic';
    if (xpReward >= 20) return 'rare';
    return 'common';
  };

  const rarity = getQuestRarity();
  const rarityColor = COLORS.rarity[rarity];
  const arcColor = arc?.color || COLORS.accent.primary;

  // Pulse animation for active quests
  useEffect(() => {
    if (!isCompleted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isCompleted]);

  // Glow animation
  useEffect(() => {
    if (!isCompleted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [isCompleted]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          isCompleted && styles.cardCompleted,
          { borderColor: arcColor },
        ]}
        activeOpacity={0.8}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        {/* Glow overlay for active quests */}
        {!isCompleted && (
          <Animated.View
            style={[
              styles.glowOverlay,
              {
                backgroundColor: arcColor,
                opacity: glowOpacity,
              },
            ]}
          />
        )}

        {/* Quest Content */}
        <View style={styles.content}>
          {/* Quest Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              {arc?.icon ? (
                <Ionicons name={arc.icon} size={24} color={arcColor} />
              ) : (
                <View style={[styles.iconPlaceholder, { backgroundColor: `${arcColor}20` }]}>
                  <Text style={[styles.iconText, { color: arcColor }]}>
                    {arc?.name?.[0]?.toUpperCase() || 'Q'}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.questInfo}>
              <Text style={styles.questName} numberOfLines={2}>
                {quest.name}
              </Text>
              <Text style={styles.arcName}>{arc?.name || 'Unassigned'}</Text>
            </View>

            {/* XP Badge */}
            <View style={[styles.xpBadge, { backgroundColor: `${COLORS.accent.success}20` }]}>
              <Text style={styles.xpBadgeText}>+{xpReward} XP</Text>
            </View>
          </View>

          {/* Quest Stats */}
          <View style={styles.stats}>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={14} color={COLORS.accent.warning} />
                <Text style={styles.streakText}>{streak}</Text>
              </View>
            )}
            
            {/* Rarity Badge */}
            <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}20` }]}>
              <Text style={[styles.rarityText, { color: rarityColor }]}>
                {rarity.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Penalty Warning */}
          {hasPenalty && penaltyData && (
            <View style={styles.penaltyWarning}>
              <Ionicons name="warning" size={14} color={COLORS.accent.danger} />
              <Text style={styles.penaltyText}>
                {penaltyData.missedRecurrences} missed • -{penaltyData.penaltyXP} XP
              </Text>
              {showOverrideButton && (
                <TouchableOpacity
                  style={styles.overrideButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onOverridePenalty?.();
                  }}
                >
                  <Ionicons name="refresh" size={12} color={COLORS.accent.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Complete Button */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            isCompleted && styles.completeButtonActive,
            { backgroundColor: isCompleted ? COLORS.accent.success : COLORS.surface },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            if (!isCompleted) {
              hapticQuestComplete();
            }
            onComplete?.();
          }}
          activeOpacity={0.7}
        >
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={28} color={COLORS.accent.success} />
          ) : (
            <LinearGradient
              colors={[arcColor, COLORS.accent.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.completeButtonGradient}
            >
              <Ionicons name="checkmark-circle-outline" size={28} color={COLORS.textPrimary} />
            </LinearGradient>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    overflow: 'hidden',
    ...createGlow(COLORS.glows.primary, 0.3),
  },
  cardCompleted: {
    opacity: 0.7,
    borderColor: COLORS.accent.success,
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    marginTop: 2,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    ...TYPOGRAPHY.title,
    fontSize: 18,
  },
  questInfo: {
    flex: 1,
  },
  questName: {
    ...TYPOGRAPHY.subtitle,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  arcName: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  xpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  xpBadgeText: {
    ...TYPOGRAPHY.stat,
    fontSize: 12,
    color: COLORS.accent.success,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent.warning}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  streakText: {
    ...TYPOGRAPHY.stat,
    fontSize: 12,
    color: COLORS.accent.warning,
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rarityText: {
    ...TYPOGRAPHY.label,
    fontSize: 9,
  },
  penaltyWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent.danger}15`,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  penaltyText: {
    ...TYPOGRAPHY.body,
    fontSize: 11,
    color: COLORS.accent.danger,
    flex: 1,
  },
  overrideButton: {
    padding: 4,
  },
  completeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    alignSelf: 'center',
  },
  completeButtonActive: {
    borderColor: COLORS.accent.success,
  },
  completeButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

