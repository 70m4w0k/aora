import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants';
import StatisticsSection from '../components/StatisticsSection';
import StreakStatisticsSection from '../components/StreakStatisticsSection';
import StreakCalendarSection from '../components/StreakCalendarSection';

/**
 * Progress Screen
 * Statistics, charts, and history
 */
export default function ProgressScreen({
  refreshing,
  onRefresh,
  statistics,
  questStreaks,
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
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Statistics and analytics</Text>
      </View>

      <StatisticsSection statistics={statistics} />

      <StreakStatisticsSection
        questStreaks={questStreaks}
        onViewDetails={() => handlers.openStreakStatsModal()}
      />

      <StreakCalendarSection
        onView={() => handlers.openStreakCalendarModal()}
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
});

