import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants';
import CharacterProfileCard from '../components/CharacterProfileCard';
import TiersSection from '../components/TiersSection';

/**
 * Character Screen
 * Profile, titles, and achievements
 */
export default function CharacterScreen({
  refreshing,
  onRefresh,
  user,
  userProgress,
  unlockedTitles,
  unlockedAchievements,
  questStreaks,
  arcs,
  xpBarPulse,
  tiers,
  tierProgress,
  tierCompletions,
  handlers,
}) {

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Character</Text>
        <Text style={styles.subtitle}>Profile and achievements</Text>
      </View>

      <CharacterProfileCard
        user={user}
        userProgress={userProgress}
        unlockedTitles={unlockedTitles}
        unlockedAchievements={unlockedAchievements}
        questStreaks={questStreaks}
        arcs={arcs}
        xpBarPulse={xpBarPulse}
        onPressTitles={() => handlers.openTitlesModal()}
        onPressXpHistory={() => handlers.openXpHistoryModal()}
        onPressCharacter={() => handlers.openTitlesModal()}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Titles & Achievements</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{unlockedTitles.length}</Text>
            <Text style={styles.statLabel}>Titles</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{unlockedAchievements.length}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>
      </View>

      <TiersSection
        tiers={tiers}
        arcs={arcs}
        tierProgress={tierProgress}
        tierCompletions={tierCompletions}
        onAddTier={() => handlers.openTierModal()}
        onTierPress={(tier) => handlers.openTierModal(tier)}
        onTierLongPress={(tier) => handlers.handleDeleteTier(tier)}
        onCompleteTier={handlers.handleCompleteTier}
      />

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.title,
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  section: {
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    ...TYPOGRAPHY.subtitle,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.hero,
    fontSize: 32,
    color: COLORS.accent.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

