import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { COLORS } from '../constants';
import CharacterProfileCard from '../components/CharacterProfileCard';
import MissedQuestsBanner from '../components/MissedQuestsBanner';
import QuestBoard from '../components/QuestBoard';
import FilterBar from '../components/FilterBar';
import { applyFiltersAndSort } from '../utils/filters';

/**
 * Dashboard Screen
 * Overview and today's quests
 */
export default function DashboardScreen({
  refreshing,
  onRefresh,
  todayQuests,
  arcs,
  questStreaks,
  questCompletions,
  questPenalties,
  userProgress,
  notificationsEnabled,
  missedQuests,
  user,
  household,
  unlockedTitles,
  unlockedAchievements,
  xpBarPulse,
  handlers,
}) {

  const [questFilters, setQuestFilters] = useState({
    arcId: null,
    status: null,
    rarity: null,
    sortBy: null,
  });

  const filteredQuests = applyFiltersAndSort(todayQuests, questFilters, {
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

      {notificationsEnabled && (
        <MissedQuestsBanner
          missedQuests={missedQuests}
          onPress={() => handlers.openMissedQuestsModal()}
        />
      )}

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

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

