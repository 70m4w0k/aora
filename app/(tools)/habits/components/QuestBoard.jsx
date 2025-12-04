import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow } from '../utils/visualEffects';
import QuestCard from './QuestCard';

/**
 * Quest Board Component
 * RPG-style quest board displaying today's quests
 */
export default function QuestBoard({
  todayQuests = [],
  arcs = [],
  questStreaks = {},
  questCompletions = {},
  questPenalties = {},
  userProgress,
  notificationsEnabled,
  missedQuests = [],
  onAddQuest,
  onQuestPress,
  onQuestLongPress,
  onCompleteQuest,
  onOverridePenalty,
  showAlert,
  setAlertModalVisible,
  user,
  household,
  fetchData,
  overridePenalty,
}) {
  const completedCount = Object.values(questCompletions).filter(Boolean).length;
  const totalCount = todayQuests.length;

  return (
    <View style={styles.section}>
      {/* Quest Board Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>TODAY'S QUESTS</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {completedCount}/{totalCount}
            </Text>
          </View>
          {notificationsEnabled && missedQuests.length > 0 && (
            <View style={styles.warningBadge}>
              <Ionicons name="warning" size={12} color={COLORS.accent.warning} />
              <Text style={styles.warningText}>{missedQuests.length}</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={onAddQuest}>
          <Ionicons name="add-circle" size={28} color={COLORS.accent.primary} />
        </TouchableOpacity>
      </View>

      {/* Quest List */}
      {todayQuests.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No Quests Today</Text>
          <Text style={styles.emptySubtext}>Create your first quest to start your journey</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={onAddQuest}>
            <Text style={styles.emptyButtonText}>Create Quest</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.questsContainer}>
          {todayQuests.map((quest) => {
            const arc = arcs.find(a => {
              const aId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
              return a.$id === aId;
            });
            
            const streak = questStreaks[quest.$id] || 0;
            const isCompleted = questCompletions[quest.$id] || false;
            const hasPenalty = userProgress?.penaltySystemActive && questPenalties[quest.$id];
            const penaltyData = questPenalties[quest.$id];

            return (
              <QuestCard
                key={quest.$id}
                quest={quest}
                arc={arc}
                streak={streak}
                isCompleted={isCompleted}
                hasPenalty={hasPenalty}
                penaltyData={penaltyData}
                onPress={() => onQuestPress(quest)}
                onLongPress={() => onQuestLongPress(quest)}
                onComplete={() => onCompleteQuest(quest)}
                onOverridePenalty={async () => {
                  try {
                    const arcId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
                    const result = await overridePenalty(user.$id, household.$id, quest.$id, arcId);
                    if (result.success) {
                      await fetchData();
                      showAlert('Success', `Penalty overridden! ${result.restoredXP} XP restored.`, [
                        { text: 'OK', onPress: () => setAlertModalVisible(false) }
                      ]);
                    }
                  } catch (error) {
                    console.error('Error overriding penalty:', error);
                    showAlert('Error', 'Could not override penalty', [
                      { text: 'OK', onPress: () => setAlertModalVisible(false) }
                    ]);
                  }
                }}
                showOverrideButton={hasPenalty}
              />
            );
          })}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...TYPOGRAPHY.title,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  countBadge: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    ...createGlow(COLORS.glows.primary, 0.5),
  },
  countText: {
    ...TYPOGRAPHY.stat,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent.warning}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  warningText: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    color: COLORS.accent.warning,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questsContainer: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    ...TYPOGRAPHY.subtitle,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    ...createGlow(COLORS.glows.primary, 0.5),
  },
  emptyButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textPrimary,
  },
});

