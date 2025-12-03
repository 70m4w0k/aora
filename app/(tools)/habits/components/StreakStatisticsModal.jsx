import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { QuestFrequencies } from '../../../../lib/appwrite';

export default function StreakStatisticsModal({
  visible,
  streakStatistics,
  streakStatsLoading,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalTitle}>Streak Statistics</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {streakStatsLoading ? (
              <View style={styles.streakStatsLoading}>
                <ActivityIndicator size="large" color={COLORS.accent.primary} />
                <Text style={styles.streakStatsLoadingText}>Calculating streaks...</Text>
              </View>
            ) : streakStatistics ? (
              <>
                {/* Overall Stats */}
                <View style={styles.streakStatsSection}>
                  <Text style={styles.streakStatsSectionTitle}>Overall Performance</Text>
                  <View style={styles.streakStatsGrid}>
                    <View style={styles.streakStatCard}>
                      <Ionicons name="flame" size={32} color={COLORS.accent.warning} />
                      <Text style={styles.streakStatValue}>{streakStatistics.bestStreakOverall}</Text>
                      <Text style={styles.streakStatLabel}>Best Streak</Text>
                    </View>
                    <View style={styles.streakStatCard}>
                      <Ionicons name="trophy-outline" size={32} color={COLORS.accent.primary} />
                      <Text style={styles.streakStatValue}>{streakStatistics.totalActiveStreaks}</Text>
                      <Text style={styles.streakStatLabel}>Active Streaks</Text>
                    </View>
                    <View style={styles.streakStatCard}>
                      <Ionicons name="stats-chart-outline" size={32} color={COLORS.accent.success} />
                      <Text style={styles.streakStatValue}>{streakStatistics.averageStreak}</Text>
                      <Text style={styles.streakStatLabel}>Average Streak</Text>
                    </View>
                  </View>
                </View>

                {/* Longest Streaks Per Quest */}
                {streakStatistics.longestStreaksPerQuest.length > 0 && (
                  <View style={styles.streakStatsSection}>
                    <Text style={styles.streakStatsSectionTitle}>Longest Streaks by Quest</Text>
                    <View style={styles.streakQuestList}>
                      {streakStatistics.longestStreaksPerQuest.slice(0, 10).map((quest, index) => (
                        <View key={quest.questId} style={styles.streakQuestItem}>
                          <View style={styles.streakQuestRank}>
                            <Text style={styles.streakQuestRankText}>#{index + 1}</Text>
                          </View>
                          <View style={[styles.streakQuestIndicator, { backgroundColor: `${quest.arcColor}20` }]}>
                            <View style={[styles.streakQuestIndicatorDot, { backgroundColor: quest.arcColor }]} />
                          </View>
                          <View style={styles.streakQuestContent}>
                            <Text style={styles.streakQuestName}>{quest.questName}</Text>
                            <View style={styles.streakQuestMeta}>
                              <Text style={styles.streakQuestArc}>{quest.arcName}</Text>
                              <Text style={styles.streakQuestFrequency}>
                                {quest.frequency === QuestFrequencies.DAILY ? 'Daily' :
                                 quest.frequency === QuestFrequencies.WEEKLY ? 'Weekly' :
                                 quest.frequency === QuestFrequencies.MONTHLY ? 'Monthly' :
                                 quest.frequency === QuestFrequencies.ANNUAL ? 'Annual' : 'Unique'}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.streakQuestStreaks}>
                            <View style={styles.streakQuestStreakItem}>
                              <Ionicons name="flame" size={16} color={COLORS.accent.warning} />
                              <Text style={styles.streakQuestStreakValue}>{quest.currentStreak}</Text>
                              <Text style={styles.streakQuestStreakLabel}>Current</Text>
                            </View>
                            <View style={styles.streakQuestStreakItem}>
                              <Ionicons name="trophy" size={16} color={quest.arcColor} />
                              <Text style={[styles.streakQuestStreakValue, { color: quest.arcColor }]}>
                                {quest.longestStreak}
                              </Text>
                              <Text style={styles.streakQuestStreakLabel}>Best</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Streak Breakdown by Arc */}
                {streakStatistics.streakBreakdownByArc.length > 0 && (
                  <View style={styles.streakStatsSection}>
                    <Text style={styles.streakStatsSectionTitle}>Streak Breakdown by Arc</Text>
                    <View style={styles.streakArcList}>
                      {streakStatistics.streakBreakdownByArc.map((arc) => (
                        <View key={arc.arcName} style={styles.streakArcItem}>
                          <View style={[styles.streakArcHeader, { borderLeftColor: arc.arcColor }]}>
                            <View style={styles.streakArcHeaderLeft}>
                              <View style={[styles.streakArcIndicator, { backgroundColor: arc.arcColor }]} />
                              <Text style={styles.streakArcName}>{arc.arcName}</Text>
                            </View>
                            <View style={styles.streakArcStats}>
                              <View style={styles.streakArcStatItem}>
                                <Ionicons name="flame" size={16} color={COLORS.accent.warning} />
                                <Text style={styles.streakArcStatValue}>{arc.longest}</Text>
                                <Text style={styles.streakArcStatLabel}>Best</Text>
                              </View>
                              <View style={styles.streakArcStatItem}>
                                <Ionicons name="list-outline" size={16} color={COLORS.textSecondary} />
                                <Text style={styles.streakArcStatValue}>{arc.count}</Text>
                                <Text style={styles.streakArcStatLabel}>Quests</Text>
                              </View>
                            </View>
                          </View>
                          {arc.quests.length > 0 && (
                            <View style={styles.streakArcQuests}>
                              {arc.quests.map((quest, idx) => (
                                <View key={idx} style={styles.streakArcQuestItem}>
                                  <Text style={styles.streakArcQuestName}>{quest.questName}</Text>
                                  <View style={styles.streakArcQuestStreaks}>
                                    <View style={styles.streakArcQuestStreak}>
                                      <Text style={styles.streakArcQuestStreakValue}>{quest.currentStreak}</Text>
                                      <Text style={styles.streakArcQuestStreakLabel}>Current</Text>
                                    </View>
                                    <View style={styles.streakArcQuestStreak}>
                                      <Text style={[styles.streakArcQuestStreakValue, { color: arc.arcColor }]}>
                                        {quest.longestStreak}
                                      </Text>
                                      <Text style={styles.streakArcQuestStreakLabel}>Best</Text>
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Streak Milestones */}
                {streakStatistics.streakMilestones.length > 0 && (
                  <View style={styles.streakStatsSection}>
                    <Text style={styles.streakStatsSectionTitle}>Streak Milestones</Text>
                    <Text style={styles.streakStatsSectionSubtitle}>
                      Quests that have reached these streak thresholds
                    </Text>
                    <View style={styles.streakMilestonesList}>
                      {streakStatistics.streakMilestones
                        .filter(m => m.questsReached > 0)
                        .reverse()
                        .map((milestone) => (
                          <View key={milestone.threshold} style={styles.streakMilestoneItem}>
                            <View style={styles.streakMilestoneHeader}>
                              <View style={styles.streakMilestoneBadge}>
                                <Ionicons name="trophy" size={20} color={COLORS.accent.warning} />
                                <Text style={styles.streakMilestoneThreshold}>{milestone.threshold} days</Text>
                              </View>
                              <Text style={styles.streakMilestoneCount}>
                                {milestone.questsReached} quest{milestone.questsReached > 1 ? 's' : ''}
                              </Text>
                            </View>
                            {milestone.quests.length > 0 && milestone.quests.length <= 5 && (
                              <View style={styles.streakMilestoneQuests}>
                                {milestone.quests.map((questName, idx) => (
                                  <View key={idx} style={styles.streakMilestoneQuestChip}>
                                    <Text style={styles.streakMilestoneQuestText}>{questName}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        ))}
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="flame-outline" size={48} color={COLORS.textTertiary} />
                <Text style={styles.emptyStateText}>No streak data available</Text>
                <Text style={styles.emptyStateSubtext}>Complete quests to build streaks</Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  streakStatsLoading: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  streakStatsLoadingText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 12,
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
  streakStatsSection: {
    marginBottom: 32,
  },
  streakStatsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  streakStatsSectionSubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginBottom: 12,
  },
  streakStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  streakStatCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  streakStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  streakStatLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  streakQuestList: {
    gap: 12,
  },
  streakQuestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  streakQuestRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakQuestRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  streakQuestIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakQuestIndicatorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  streakQuestContent: {
    flex: 1,
  },
  streakQuestName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  streakQuestMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  streakQuestArc: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  streakQuestFrequency: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  streakQuestStreaks: {
    flexDirection: 'row',
    gap: 12,
  },
  streakQuestStreakItem: {
    alignItems: 'center',
    gap: 4,
  },
  streakQuestStreakValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  streakQuestStreakLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  streakArcList: {
    gap: 16,
  },
  streakArcItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  streakArcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderLeftWidth: 4,
  },
  streakArcHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  streakArcIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  streakArcName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  streakArcStats: {
    flexDirection: 'row',
    gap: 16,
  },
  streakArcStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  streakArcStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  streakArcStatLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  streakArcQuests: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  streakArcQuestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  streakArcQuestName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  streakArcQuestStreaks: {
    flexDirection: 'row',
    gap: 12,
  },
  streakArcQuestStreak: {
    alignItems: 'center',
    gap: 2,
    minWidth: 50,
  },
  streakArcQuestStreakValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  streakArcQuestStreakLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  streakMilestonesList: {
    gap: 12,
  },
  streakMilestoneItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  streakMilestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakMilestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent.warning}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  streakMilestoneThreshold: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent.warning,
  },
  streakMilestoneCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  streakMilestoneQuests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  streakMilestoneQuestChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  streakMilestoneQuestText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});

