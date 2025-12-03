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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { QuestFrequencies, TargetTypes, getXPForNextLevel, getTotalXPForLevel } from '../../../../lib/appwrite';

export default function ArcDetailModal({
  visible,
  selectedArc,
  arcDetailTab,
  setArcDetailTab,
  arcQuests,
  arcTiers,
  arcProgress,
  questCompletions,
  questStreaks,
  tierProgress,
  tierCompletions,
  userProgress,
  onClose,
  onEdit,
  onAddQuest,
  onAddTier,
  onQuestPress,
  onTierPress,
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
              {selectedArc && (
                <View style={styles.arcDetailHeader}>
                  <View style={[styles.arcDetailIndicator, { backgroundColor: selectedArc.color || COLORS.accent.primary }]} />
                  <Text style={styles.modalTitle}>{selectedArc.name || 'Arc Details'}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onEdit}>
              <Ionicons name="create-outline" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.modalTabs}>
            <TouchableOpacity
              style={[styles.modalTab, arcDetailTab === 'overview' && styles.modalTabActive]}
              onPress={() => setArcDetailTab('overview')}
            >
              <Ionicons 
                name="grid-outline" 
                size={18} 
                color={arcDetailTab === 'overview' ? COLORS.accent.primary : COLORS.textSecondary} 
              />
              <Text style={[
                styles.modalTabText,
                arcDetailTab === 'overview' && styles.modalTabTextActive
              ]}>
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalTab, arcDetailTab === 'quests' && styles.modalTabActive]}
              onPress={() => setArcDetailTab('quests')}
            >
              <Ionicons 
                name="checkmark-circle-outline" 
                size={18} 
                color={arcDetailTab === 'quests' ? COLORS.accent.primary : COLORS.textSecondary} 
              />
              <Text style={[
                styles.modalTabText,
                arcDetailTab === 'quests' && styles.modalTabTextActive
              ]}>
                Quests ({arcQuests.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalTab, arcDetailTab === 'tiers' && styles.modalTabActive]}
              onPress={() => setArcDetailTab('tiers')}
            >
              <Ionicons 
                name="trophy-outline" 
                size={18} 
                color={arcDetailTab === 'tiers' ? COLORS.accent.primary : COLORS.textSecondary} 
              />
              <Text style={[
                styles.modalTabText,
                arcDetailTab === 'tiers' && styles.modalTabTextActive
              ]}>
                Tiers ({arcTiers.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Overview Tab */}
            {arcDetailTab === 'overview' && selectedArc && (
              <>
                {/* Arc Info */}
                <View style={styles.arcDetailInfo}>
                  {selectedArc.description && (
                    <View style={styles.arcDetailDescription}>
                      <Text style={styles.arcDetailDescriptionText}>{selectedArc.description}</Text>
                    </View>
                  )}
                  
                  {/* Arc Progress */}
                  {arcProgress && (
                    <View style={styles.arcDetailProgress}>
                      <View style={styles.arcDetailProgressHeader}>
                        <Text style={styles.arcDetailProgressTitle}>Arc Progress</Text>
                        <Text style={styles.arcDetailProgressLevel}>Level {arcProgress.level || 1}</Text>
                      </View>
                      <View style={styles.arcDetailProgressBar}>
                        {(() => {
                          const progressionType = userProgress?.progressionType || 'progressive';
                          const arcLevel = arcProgress.level || 1;
                          const arcXP = arcProgress.totalXP || 0;
                          const xpForNextLevel = getXPForNextLevel(arcLevel, progressionType);
                          const xpForCurrentLevel = getTotalXPForLevel(arcLevel, progressionType);
                          const xpInCurrentLevel = Math.max(0, arcXP - xpForCurrentLevel);
                          const progressPercent = Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100);
                          
                          return (
                            <View 
                              style={[
                                styles.arcDetailProgressFill, 
                                { 
                                  width: `${progressPercent}%`,
                                  backgroundColor: selectedArc.color || COLORS.accent.primary,
                                }
                              ]} 
                            />
                          );
                        })()}
                      </View>
                      <Text style={styles.arcDetailProgressXP}>
                        {arcProgress.totalXP || 0} XP • {arcProgress.questsCompleted || 0} quests • {arcProgress.tiersCompleted || 0} tiers
                      </Text>
                    </View>
                  )}
                  
                  {/* Arc Statistics */}
                  <View style={styles.arcDetailStats}>
                    <View style={styles.arcDetailStatCard}>
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.accent.success} />
                      <Text style={styles.arcDetailStatValue}>{arcQuests.length}</Text>
                      <Text style={styles.arcDetailStatLabel}>Quests</Text>
                    </View>
                    <View style={styles.arcDetailStatCard}>
                      <Ionicons name="trophy" size={24} color={COLORS.accent.primary} />
                      <Text style={styles.arcDetailStatValue}>{arcTiers.length}</Text>
                      <Text style={styles.arcDetailStatLabel}>Tiers</Text>
                    </View>
                    {arcProgress && (
                      <>
                        <View style={styles.arcDetailStatCard}>
                          <Ionicons name="star" size={24} color={COLORS.accent.warning} />
                          <Text style={styles.arcDetailStatValue}>{arcProgress.totalXP || 0}</Text>
                          <Text style={styles.arcDetailStatLabel}>Total XP</Text>
                        </View>
                        <View style={styles.arcDetailStatCard}>
                          <Ionicons name="flame" size={24} color={COLORS.accent.danger} />
                          <Text style={styles.arcDetailStatValue}>{arcProgress.level || 1}</Text>
                          <Text style={styles.arcDetailStatLabel}>Level</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
                
                <View style={{ height: 40 }} />
              </>
            )}

            {/* Quests Tab */}
            {arcDetailTab === 'quests' && (
              <>
                <View style={styles.arcDetailSectionHeader}>
                  <Text style={styles.arcDetailSectionTitle}>Quests in {selectedArc?.name || 'Arc'}</Text>
                  <TouchableOpacity 
                    style={styles.arcDetailAddButton}
                    onPress={onAddQuest}
                  >
                    <Ionicons name="add" size={20} color={COLORS.accent.primary} />
                  </TouchableOpacity>
                </View>
                
                {arcQuests.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.textTertiary} />
                    <Text style={styles.emptyStateText}>No quests in this arc</Text>
                    <Text style={styles.emptyStateSubtext}>Create quests to start tracking</Text>
                  </View>
                ) : (
                  <View style={styles.arcDetailList}>
                    {arcQuests.map((quest) => {
                      const isCompleted = questCompletions[quest.$id];
                      return (
                        <TouchableOpacity
                          key={quest.$id}
                          style={styles.arcDetailQuestItem}
                          activeOpacity={0.7}
                          onPress={() => onQuestPress(quest)}
                        >
                          <View style={styles.arcDetailQuestContent}>
                            <Text style={styles.arcDetailQuestName}>{quest.name}</Text>
                            <View style={styles.arcDetailQuestMeta}>
                              <Text style={styles.arcDetailQuestFrequency}>
                                {quest.frequency === QuestFrequencies.DAILY ? 'Daily' :
                                 quest.frequency === QuestFrequencies.WEEKLY ? 'Weekly' :
                                 quest.frequency === QuestFrequencies.MONTHLY ? 'Monthly' :
                                 quest.frequency === QuestFrequencies.ANNUAL ? 'Annual' : 'Unique'}
                              </Text>
                              {questStreaks[quest.$id] > 0 && (
                                <View style={styles.streakBadge}>
                                  <Ionicons name="flame" size={12} color={COLORS.accent.warning} />
                                  <Text style={styles.streakText}>{questStreaks[quest.$id]}</Text>
                                </View>
                              )}
                              <Text style={styles.arcDetailQuestXP}>+{quest.xpPerCompletion || 10} XP</Text>
                            </View>
                          </View>
                          <Ionicons 
                            name={isCompleted ? "checkmark-circle" : "checkmark-circle-outline"} 
                            size={24} 
                            color={isCompleted ? COLORS.accent.success : COLORS.textTertiary} 
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                
                <View style={{ height: 40 }} />
              </>
            )}

            {/* Tiers Tab */}
            {arcDetailTab === 'tiers' && (
              <>
                <View style={styles.arcDetailSectionHeader}>
                  <Text style={styles.arcDetailSectionTitle}>Tiers in {selectedArc?.name || 'Arc'}</Text>
                  <TouchableOpacity 
                    style={styles.arcDetailAddButton}
                    onPress={onAddTier}
                  >
                    <Ionicons name="add" size={20} color={COLORS.accent.primary} />
                  </TouchableOpacity>
                </View>
                
                {arcTiers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="trophy-outline" size={48} color={COLORS.textTertiary} />
                    <Text style={styles.emptyStateText}>No tiers in this arc</Text>
                    <Text style={styles.emptyStateSubtext}>Create milestones to track major achievements</Text>
                  </View>
                ) : (
                  <View style={styles.arcDetailList}>
                    {arcTiers.map((tier) => {
                      const progress = tierProgress[tier.$id] || { current: 0, target: tier.targetValue || 100, percentage: 0 };
                      const isCompleted = tierCompletions[tier.$id] !== null && tierCompletions[tier.$id] !== undefined;
                      
                      return (
                        <TouchableOpacity
                          key={tier.$id}
                          style={styles.arcDetailTierItem}
                          activeOpacity={0.7}
                          onPress={() => onTierPress(tier)}
                        >
                          <View style={styles.arcDetailTierContent}>
                            <View style={styles.arcDetailTierHeader}>
                              <Text style={styles.arcDetailTierName}>{tier.name}</Text>
                              {isCompleted && (
                                <Ionicons name="checkmark-circle" size={20} color={COLORS.accent.success} />
                              )}
                            </View>
                            <View style={styles.arcDetailTierProgress}>
                              <View style={styles.arcDetailTierProgressBar}>
                                <View 
                                  style={[
                                    styles.arcDetailTierProgressFill,
                                    {
                                      width: `${isCompleted ? 100 : progress.percentage}%`,
                                      backgroundColor: selectedArc?.color || COLORS.accent.primary,
                                    }
                                  ]}
                                />
                              </View>
                              <Text style={styles.arcDetailTierProgressText}>
                                {isCompleted 
                                  ? 'Completed!' 
                                  : `${Math.floor(progress.current)} / ${progress.target} ${tier.targetType === TargetTypes.DAYS ? 'days' : tier.targetType === TargetTypes.COUNT ? 'completions' : 'items'}`
                                }
                              </Text>
                            </View>
                            <Text style={styles.arcDetailTierXP}>+{tier.xpReward || 100} XP</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                
                <View style={{ height: 40 }} />
              </>
            )}
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
  modalTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  modalTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    gap: 6,
  },
  modalTabActive: {
    backgroundColor: `${COLORS.accent.primary}20`,
  },
  modalTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  modalTabTextActive: {
    color: COLORS.accent.primary,
    fontWeight: '600',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  arcDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arcDetailIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  arcDetailInfo: {
    gap: 20,
  },
  arcDetailDescription: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  arcDetailDescriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  arcDetailProgress: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  arcDetailProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  arcDetailProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  arcDetailProgressLevel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent.primary,
  },
  arcDetailProgressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  arcDetailProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  arcDetailProgressXP: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  arcDetailStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  arcDetailStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  arcDetailStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  arcDetailStatLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  arcDetailSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  arcDetailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  arcDetailAddButton: {
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
  arcDetailList: {
    gap: 12,
  },
  arcDetailQuestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  arcDetailQuestContent: {
    flex: 1,
  },
  arcDetailQuestName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  arcDetailQuestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arcDetailQuestFrequency: {
    fontSize: 12,
    color: COLORS.textTertiary,
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
  arcDetailQuestXP: {
    fontSize: 12,
    color: COLORS.accent.success,
    fontWeight: '600',
  },
  arcDetailTierItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  arcDetailTierContent: {
    gap: 8,
  },
  arcDetailTierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  arcDetailTierName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  arcDetailTierProgress: {
    gap: 4,
  },
  arcDetailTierProgressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  arcDetailTierProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  arcDetailTierProgressText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  arcDetailTierXP: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent.success,
  },
});

