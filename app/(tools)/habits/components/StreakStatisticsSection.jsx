import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

export default function StreakStatisticsSection({ questStreaks, onViewDetails }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>STREAK STATISTICS</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onViewDetails}
        >
          <Text style={styles.viewAllButtonText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.accent.primary} />
        </TouchableOpacity>
      </View>
      
      {questStreaks && Object.keys(questStreaks).length > 0 ? (
        <View style={styles.streakStatsPreview}>
          <View style={styles.streakStatsCard}>
            <Ionicons name="flame" size={24} color={COLORS.accent.warning} />
            <View style={styles.streakStatsCardContent}>
              <Text style={styles.streakStatsCardValue}>
                {Math.max(...Object.values(questStreaks), 0)}
              </Text>
              <Text style={styles.streakStatsCardLabel}>Best Current Streak</Text>
            </View>
          </View>
          <View style={styles.streakStatsCard}>
            <Ionicons name="trophy-outline" size={24} color={COLORS.accent.primary} />
            <View style={styles.streakStatsCardContent}>
              <Text style={styles.streakStatsCardValue}>
                {Object.values(questStreaks).filter(s => s > 0).length}
              </Text>
              <Text style={styles.streakStatsCardLabel}>Active Streaks</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="flame-outline" size={48} color={COLORS.textTertiary} />
          <Text style={styles.emptyStateText}>No streaks yet</Text>
          <Text style={styles.emptyStateSubtext}>Complete quests to build streaks</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllButtonText: {
    fontSize: 12,
    color: COLORS.accent.primary,
    fontWeight: '500',
  },
  streakStatsPreview: {
    flexDirection: 'row',
    gap: 12,
  },
  streakStatsCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  streakStatsCardContent: {
    flex: 1,
  },
  streakStatsCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  streakStatsCardLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
});

