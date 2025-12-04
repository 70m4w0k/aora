import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants';
import { getXPForNextLevel, getTotalXPForLevel } from '../../../../lib/appwrite';
import { createGlow, getRarityColor } from '../utils/visualEffects';
import { CLASSES, getClassById, getClassIcon, getClassName } from '../constants';
import XPBar from './XPBar';
import Avatar from './Avatar';
import GlowView from './GlowView';
import GradientView from './GradientView';

/**
 * Character Profile Card Component
 * RPG-style character profile display with avatar, stats, and progress
 */
export default function CharacterProfileCard({
  user,
  userProgress,
  unlockedTitles = [],
  unlockedAchievements = [],
  questStreaks = {},
  arcs = [],
  xpBarPulse,
  onPressTitles,
  onPressXpHistory,
  onPressCharacter,
}) {
  if (!userProgress || !user) return null;

  const currentLevel = userProgress.globalLevel || 1;
  const currentXP = userProgress.totalXP || 0;
  const progressionType = userProgress.progressionType || 'progressive';
  const classId = userProgress.classId || 'wanderer';
  const xpForNextLevel = getXPForNextLevel(currentLevel, progressionType);
  const xpForCurrentLevel = getTotalXPForLevel(currentLevel, progressionType);
  
  const rarityColor = getRarityColor(currentLevel);
  const characterClass = getClassById(classId);
  
  // Calculate active streaks
  const activeStreaks = Object.values(questStreaks).filter(s => s > 0).length;
  const bestStreak = Math.max(...Object.values(questStreaks), 0);
  
  // Calculate total quests completed (from arc progress)
  const arcProgress = typeof userProgress.arcProgress === 'string'
    ? JSON.parse(userProgress.arcProgress)
    : userProgress.arcProgress || {};
  const totalQuestsCompleted = Object.values(arcProgress).reduce(
    (sum, arc) => sum + (arc.questsCompleted || 0),
    0
  );
  const totalTiersCompleted = Object.values(arcProgress).reduce(
    (sum, arc) => sum + (arc.tiersCompleted || 0),
    0
  );

  // Get highest title
  const highestTitle = unlockedTitles.length > 0 
    ? unlockedTitles[unlockedTitles.length - 1]
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={onPressCharacter}
    >
      <GradientView
        gradientType="xp"
        style={styles.gradientOverlay}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.avatarSection}>
            <Avatar
              user={user}
              level={currentLevel}
              classId={classId}
              size={80}
              showLevel={true}
              showGlow={true}
            />
          </View>
          
          <View style={styles.infoSection}>
            <View style={styles.levelRow}>
              <GlowView glowColor={rarityColor} intensity={0.6}>
                <Text style={[styles.level, { color: rarityColor }]}>
                  Level {currentLevel}
                </Text>
              </GlowView>
            </View>
            
            <View style={styles.classRow}>
              <Text style={styles.classIcon}>{getClassIcon(classId)}</Text>
              <Text style={styles.className}>{characterClass.name}</Text>
            </View>
            
            {highestTitle && (
              <View style={styles.titleRow}>
                <Text style={styles.titleIcon}>{highestTitle.icon}</Text>
                <Text style={styles.titleName}>{highestTitle.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* XP Bar */}
        <View style={styles.xpBarContainer}>
        <XPBar
          currentXP={currentXP}
          xpForNextLevel={xpForNextLevel}
          xpForCurrentLevel={xpForCurrentLevel}
          level={currentLevel}
          animated={true}
          showText={true}
          showMilestones={true}
          height={16}
        />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Ionicons name="flame" size={20} color={COLORS.accent.warning} />
            <Text style={styles.statValue}>{activeStreaks}</Text>
            <Text style={styles.statLabel}>Active Streaks</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.accent.success} />
            <Text style={styles.statValue}>{totalQuestsCompleted}</Text>
            <Text style={styles.statLabel}>Quests Done</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="trophy" size={20} color={COLORS.accent.primary} />
            <Text style={styles.statValue}>{totalTiersCompleted}</Text>
            <Text style={styles.statLabel}>Tiers</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="star" size={20} color={COLORS.rarity.legendary} />
            <Text style={styles.statValue}>{unlockedTitles.length + unlockedAchievements.length}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerItem}
            activeOpacity={0.7}
            onPress={onPressTitles}
          >
            <Ionicons name="trophy-outline" size={18} color={COLORS.accent.primary} />
            <Text style={styles.footerText}>
              Titles & Achievements
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.footerItem}
            activeOpacity={0.7}
            onPress={onPressXpHistory}
          >
            <Ionicons name="time-outline" size={18} color={COLORS.accent.primary} />
            <Text style={styles.footerText}>
              XP History
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </GradientView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    ...createGlow(COLORS.glows.primary, 0.4),
  },
  gradientOverlay: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  levelRow: {
    marginBottom: 4,
  },
  level: {
    ...TYPOGRAPHY.hero,
    fontSize: 36,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classIcon: {
    fontSize: 20,
  },
  className: {
    ...TYPOGRAPHY.subtitle,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  titleIcon: {
    fontSize: 16,
  },
  titleName: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  xpBarContainer: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    ...TYPOGRAPHY.stat,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  statLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  footer: {
    gap: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  footerText: {
    ...TYPOGRAPHY.body,
    flex: 1,
    marginLeft: 12,
    color: COLORS.textPrimary,
  },
});

