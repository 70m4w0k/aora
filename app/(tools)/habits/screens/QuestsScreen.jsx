import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants';
import QuestBoard from '../components/QuestBoard';
import FilterBar from '../components/FilterBar';
import QuestCalendarView from '../components/QuestCalendarView';
import { applyFiltersAndSort } from '../utils/filters';

/**
 * Quests Screen
 * All quests management
 */
export default function QuestsScreen({
  refreshing,
  onRefresh,
  quests,
  arcs,
  questStreaks,
  questCompletions,
  questPenalties,
  userProgress,
  notificationsEnabled,
  missedQuests,
  user,
  household,
  handlers,
}) {

  const [questFilters, setQuestFilters] = useState({
    arcId: null,
    status: null,
    rarity: null,
    sortBy: null,
  });

  const filteredQuests = applyFiltersAndSort(quests, questFilters, {
    arcs,
    questStreaks,
    questCompletions,
    today: new Date(),
  });

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>All Quests</Text>
        <Text style={styles.subtitle}>{filteredQuests.length} quests</Text>
      </View>

      <FilterBar
        filters={questFilters}
        arcs={arcs}
        onFilterChange={setQuestFilters}
        showSort={true}
      />

      <QuestBoard
        todayQuests={filteredQuests}
        arcs={arcs}
        questStreaks={questStreaks}
        questCompletions={questCompletions}
        questPenalties={questPenalties}
        userProgress={userProgress}
        notificationsEnabled={notificationsEnabled}
        missedQuests={missedQuests}
        onAddQuest={() => handlers.openQuestModal()}
        onQuestPress={(quest) => handlers.openQuestModal(quest)}
        onQuestLongPress={(quest) => handlers.handleDeleteQuest(quest)}
        onCompleteQuest={handlers.handleCompleteQuest}
        onOverridePenalty={handlers.overridePenalty}
        showAlert={handlers.showAlert}
        setAlertModalVisible={handlers.setAlertModalVisible}
        user={user}
        household={household}
        fetchData={onRefresh}
        overridePenalty={handlers.overridePenalty}
      />

      {/* Quest Calendar - At the end */}
      <View style={styles.calendarSection}>
        <QuestCalendarView
          quests={quests}
          arcs={arcs}
          userId={user?.$id}
        />
      </View>

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
  calendarSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    marginBottom: 16,
  },
});

