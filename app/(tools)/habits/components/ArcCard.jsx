import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants';
import { getXPForNextLevel, getTotalXPForLevel } from '../../../../lib/appwrite';
import { createGlow, getArcGradient } from '../utils/visualEffects';
import XPBar from './XPBar';

/**
 * Enhanced Arc Card Component
 * RPG-style arc card with visual effects and progress visualization
 */
export default function ArcCard({
  arc,
  progress,
  userProgress,
  onPress,
  onLongPress,
}) {
  const arcColor = arc.color || COLORS.accent.primary;
  const gradientColors = getArcGradient(arc.name);
  
  const progressionType = userProgress?.progressionType || 'progressive';
  const arcLevel = progress.level || 1;
  const arcXP = progress.totalXP || 0;
  const xpForNextLevel = getXPForNextLevel(arcLevel, progressionType);
  const xpForCurrentLevel = getTotalXPForLevel(arcLevel, progressionType);
  const xpInCurrentLevel = Math.max(0, arcXP - xpForCurrentLevel);
  
  // Calculate completion rate (simplified)
  const questsCompleted = progress.questsCompleted || 0;
  const tiersCompleted = progress.tiersCompleted || 0;

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: arcColor }]}
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {/* Gradient Background Overlay */}
      <LinearGradient
        colors={[`${arcColor}10`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientOverlay}
      />

      {/* Arc Emblem Section */}
      <View style={styles.emblemSection}>
        <View style={[styles.emblemContainer, { backgroundColor: `${arcColor}20` }]}>
          {arc.icon ? (
            <Ionicons name={arc.icon} size={32} color={arcColor} />
          ) : (
            <Text style={[styles.emblemText, { color: arcColor }]}>
              {arc.name?.[0]?.toUpperCase() || 'A'}
            </Text>
          )}
        </View>
        
        {/* Level Badge */}
        <View style={[styles.levelBadge, { backgroundColor: arcColor }]}>
          <Text style={styles.levelText}>Lv.{arcLevel}</Text>
        </View>
      </View>

      {/* Arc Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.header}>
          <Text style={styles.arcName}>{arc.name}</Text>
        </View>

        {/* XP Display */}
        <View style={styles.xpDisplay}>
          <Text style={styles.xpValue}>{arcXP.toLocaleString()} XP</Text>
          <Text style={styles.xpLabel}>Level {arcLevel}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <XPBar
            currentXP={arcXP}
            xpForNextLevel={xpForNextLevel}
            xpForCurrentLevel={xpForCurrentLevel}
            level={arcLevel}
            animated={true}
            showText={false}
            height={8}
          />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.accent.success} />
            <Text style={styles.statValue}>{questsCompleted}</Text>
            <Text style={styles.statLabel}>Quests</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Ionicons name="trophy" size={16} color={COLORS.accent.primary} />
            <Text style={styles.statValue}>{tiersCompleted}</Text>
            <Text style={styles.statLabel}>Tiers</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    overflow: 'hidden',
    ...createGlow(COLORS.glows.primary, 0.2),
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  emblemSection: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  emblemContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...createGlow(COLORS.glows.primary, 0.4),
  },
  emblemText: {
    ...TYPOGRAPHY.hero,
    fontSize: 36,
  },
  levelBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.card,
    ...createGlow(COLORS.glows.primary, 0.5),
  },
  levelText: {
    ...TYPOGRAPHY.stat,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  infoSection: {
    gap: 12,
  },
  header: {
    alignItems: 'center',
  },
  arcName: {
    ...TYPOGRAPHY.title,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  xpDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  xpValue: {
    ...TYPOGRAPHY.stat,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  xpLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  progressSection: {
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    ...TYPOGRAPHY.stat,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  statLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
});

