import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { getXPForNextLevel, getTotalXPForLevel } from '../../../../lib/appwrite';

export default function GlobalProgressCard({ 
  userProgress, 
  unlockedTitles, 
  unlockedAchievements,
  xpBarPulse,
  onPressTitles,
  onPressXpHistory 
}) {
  if (!userProgress) return null;

  const currentLevel = userProgress.globalLevel || 1;
  const currentXP = userProgress.totalXP || 0;
  const progressionType = userProgress.progressionType || 'progressive';
  const xpForNextLevel = getXPForNextLevel(currentLevel, progressionType);
  const xpForCurrentLevel = getTotalXPForLevel(currentLevel, progressionType);
  const xpInCurrentLevel = Math.max(0, currentXP - xpForCurrentLevel);
  const progressPercent = Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100);

  return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPressTitles}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Level</Text>
          <Text style={styles.level}>{userProgress.globalLevel || 1}</Text>
        </View>
        <View style={styles.xpContainer}>
          <Text style={styles.label}>Total XP</Text>
          <Text style={styles.xp}>{userProgress.totalXP || 0}</Text>
        </View>
      </View>
      <Animated.View 
        style={[
          styles.xpBarContainer,
          {
            transform: [{ scale: xpBarPulse }],
          },
        ]}
      >
        <View style={styles.xpBarBackground}>
          <Animated.View 
            style={[
              styles.xpBarFill, 
              { width: `${progressPercent}%` }
            ]} 
          />
        </View>
        <Text style={styles.xpBarText}>
          {Math.floor(xpInCurrentLevel)} / {xpForNextLevel} XP to level {currentLevel + 1}
        </Text>
      </Animated.View>
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerItem}
          activeOpacity={0.7}
          onPress={onPressTitles}
        >
          <Ionicons name="trophy-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.footerText}>
            {unlockedTitles.length + unlockedAchievements.length} unlocked
          </Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.footerItem}
          activeOpacity={0.7}
          onPress={onPressXpHistory}
        >
          <Ionicons name="time-outline" size={16} color={COLORS.accent.primary} />
          <Text style={[styles.footerText, { color: COLORS.accent.primary }]}>
            XP History
          </Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.accent.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  level: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.accent.primary,
  },
  xpContainer: {
    alignItems: 'flex-end',
  },
  xp: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  xpBarContainer: {
    marginBottom: 16,
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: COLORS.elevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent.primary,
    borderRadius: 4,
  },
  xpBarText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  footerItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

