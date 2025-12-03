import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

export default function TodaysQuestsSection({ 
  todayQuests,
  arcs,
  questStreaks,
  questCompletions,
  questPenalties,
  userProgress,
  notificationsEnabled,
  missedQuests,
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
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>TODAY'S QUESTS</Text>
          {notificationsEnabled && missedQuests.length > 0 && (
            <View style={styles.missedQuestsSectionBadge}>
              <Ionicons name="warning" size={14} color={COLORS.accent.warning} />
              <Text style={styles.missedQuestsSectionBadgeText}>{missedQuests.length}</Text>
            </View>
          )}
        </View>
        <View style={styles.questHeaderRight}>
          <Text style={styles.questCount}>{todayQuests.length}</Text>
          <TouchableOpacity style={styles.addButton} onPress={onAddQuest}>
            <Ionicons name="add" size={20} color={COLORS.accent.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {todayQuests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.textTertiary} />
          <Text style={styles.emptyStateText}>No quests for today</Text>
          <Text style={styles.emptyStateSubtext}>Create quests to start tracking</Text>
        </View>
      ) : (
        <View style={styles.questsList}>
          {todayQuests.slice(0, 5).map((quest) => {
            const arc = arcs.find(a => {
              const aId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
              return a.$id === aId;
            });
            
            return (
              <TouchableOpacity
                key={quest.$id}
                style={styles.questCard}
                activeOpacity={0.7}
                onPress={() => onQuestPress(quest)}
                onLongPress={() => onQuestLongPress(quest)}
              >
                <View style={[styles.questIndicator, { backgroundColor: arc?.color || COLORS.accent.primary }]} />
                <View style={styles.questContent}>
                  <Text style={styles.questName}>{quest.name}</Text>
                  <View style={styles.questMeta}>
                    <Text style={styles.questArc}>{arc?.name || 'Unassigned'}</Text>
                    {questStreaks[quest.$id] > 0 && (
                      <View style={styles.streakBadge}>
                        <Ionicons name="flame" size={12} color={COLORS.accent.warning} />
                        <Text style={styles.streakText}>{questStreaks[quest.$id]}</Text>
                      </View>
                    )}
                    <Text style={styles.questXP}>+{quest.xpPerCompletion || 10} XP</Text>
                  </View>
                  {/* Penalty Warning */}
                  {userProgress?.penaltySystemActive && questPenalties[quest.$id] && (
                    <View style={styles.penaltyWarning}>
                      <Ionicons name="warning" size={14} color={COLORS.accent.danger} />
                      <Text style={styles.penaltyText}>
                        {questPenalties[quest.$id].missedRecurrences} missed • -{questPenalties[quest.$id].penaltyXP} XP
                      </Text>
                      <TouchableOpacity
                        style={styles.penaltyOverrideButton}
                        onPress={async (e) => {
                          e.stopPropagation();
                          try {
                            const arcId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
                            const result = await overridePenalty(user.$id, household.$id, quest.$id, arcId);
                            if (result.success) {
                              await fetchData();
                              showAlert('Success', `Penalty overridden! ${result.restoredXP} XP restored.`, [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
                            }
                          } catch (error) {
                            console.error('Error overriding penalty:', error);
                            showAlert('Error', 'Could not override penalty', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
                          }
                        }}
                      >
                        <Ionicons name="refresh" size={12} color={COLORS.accent.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <View style={styles.questActions}>
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      onCompleteQuest(quest);
                    }}
                  >
                    <Ionicons 
                      name={questCompletions[quest.$id] ? "checkmark-circle" : "checkmark-circle-outline"} 
                      size={24} 
                      color={questCompletions[quest.$id] ? COLORS.accent.success : COLORS.textTertiary} 
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
  missedQuestsSectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent.warning}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  missedQuestsSectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent.warning,
  },
  questHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
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
  questsList: {
    gap: 8,
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  questIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  questContent: {
    flex: 1,
  },
  questName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  questMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questArc: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  questXP: {
    fontSize: 12,
    color: COLORS.accent.success,
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent.warning}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent.warning,
  },
  penaltyWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent.danger}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    gap: 6,
  },
  penaltyText: {
    fontSize: 11,
    color: COLORS.accent.danger,
    fontWeight: '500',
    flex: 1,
  },
  penaltyOverrideButton: {
    padding: 4,
  },
  questActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

