import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { QuestFrequencies } from '../../../../lib/appwrite';

export default function QuestModal({
  visible,
  editingQuest,
  questForm,
  setQuestForm,
  questModalTab,
  setQuestModalTab,
  questCompletionsHistory,
  questStats,
  arcs,
  onClose,
  onSave,
  onDelete,
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
            <Text style={styles.modalTitle}>
              {editingQuest ? (editingQuest.name || 'Quest Details') : 'Add Quest'}
            </Text>
            {editingQuest ? (
              <View style={{ width: 40 }} />
            ) : (
              <TouchableOpacity onPress={onSave}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs for editing quest */}
          {editingQuest && (
            <View style={styles.modalTabs}>
              <TouchableOpacity
                style={[styles.modalTab, questModalTab === 'details' && styles.modalTabActive]}
                onPress={() => setQuestModalTab('details')}
              >
                <Ionicons 
                  name="create-outline" 
                  size={18} 
                  color={questModalTab === 'details' ? COLORS.accent.primary : COLORS.textSecondary} 
                />
                <Text style={[
                  styles.modalTabText,
                  questModalTab === 'details' && styles.modalTabTextActive
                ]}>
                  Edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalTab, questModalTab === 'history' && styles.modalTabActive]}
                onPress={() => setQuestModalTab('history')}
              >
                <Ionicons 
                  name="time-outline" 
                  size={18} 
                  color={questModalTab === 'history' ? COLORS.accent.primary : COLORS.textSecondary} 
                />
                <Text style={[
                  styles.modalTabText,
                  questModalTab === 'history' && styles.modalTabTextActive
                ]}>
                  History
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalTab, questModalTab === 'stats' && styles.modalTabActive]}
                onPress={() => setQuestModalTab('stats')}
              >
                <Ionicons 
                  name="stats-chart-outline" 
                  size={18} 
                  color={questModalTab === 'stats' ? COLORS.accent.primary : COLORS.textSecondary} 
                />
                <Text style={[
                  styles.modalTabText,
                  questModalTab === 'stats' && styles.modalTabTextActive
                ]}>
                  Stats
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Details Tab */}
            {(!editingQuest || questModalTab === 'details') && (
              <>
                {/* Quest Name */}
                <Text style={[styles.inputLabel, { marginTop: 0 }]}>Quest Name</Text>
                <TextInput
                  style={styles.input}
                  value={questForm.name}
                  onChangeText={(text) => setQuestForm({ ...questForm, name: text })}
                  placeholder="e.g., Meditate 1x per day, Run 4x per week"
                  placeholderTextColor={COLORS.textTertiary}
                  maxLength={200}
                />

                {/* Arc Selection */}
                <Text style={styles.inputLabel}>Arc</Text>
                {arcs.length === 0 ? (
                  <View style={styles.emptyArcWarning}>
                    <Ionicons name="alert-circle-outline" size={20} color={COLORS.accent.warning} />
                    <Text style={styles.emptyArcWarningText}>Create an arc first</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.arcChipsScroll}>
                    {arcs.map((arc) => (
                      <TouchableOpacity
                        key={arc.$id}
                        style={[
                          styles.arcChip,
                          questForm.arcId === arc.$id && { backgroundColor: `${arc.color || COLORS.accent.primary}20`, borderColor: arc.color || COLORS.accent.primary },
                        ]}
                        onPress={() => setQuestForm({ ...questForm, arcId: arc.$id })}
                      >
                        <View style={[styles.arcChipIndicator, { backgroundColor: arc.color || COLORS.accent.primary }]} />
                        <Text style={[
                          styles.arcChipText,
                          questForm.arcId === arc.$id && { color: COLORS.textPrimary },
                        ]}>
                          {arc.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {/* Frequency */}
                <Text style={styles.inputLabel}>Frequency</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.frequencyScroll}>
                  {Object.entries({
                    [QuestFrequencies.DAILY]: 'Daily',
                    [QuestFrequencies.WEEKLY]: 'Weekly',
                    [QuestFrequencies.MONTHLY]: 'Monthly',
                    [QuestFrequencies.ANNUAL]: 'Annual',
                    [QuestFrequencies.UNIQUE]: 'Unique',
                  }).map(([value, label]) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.frequencyChip,
                        questForm.frequency === value && styles.frequencyChipActive,
                      ]}
                      onPress={() => setQuestForm({ ...questForm, frequency: value })}
                    >
                      <Text style={[
                        styles.frequencyChipText,
                        questForm.frequency === value && styles.frequencyChipTextActive,
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Repetition Per Period */}
                <Text style={styles.inputLabel}>Repetition Per Period</Text>
                <TextInput
                  style={styles.input}
                  value={questForm.repetitionPerPeriod}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    setQuestForm({ ...questForm, repetitionPerPeriod: Math.max(1, num).toString() });
                  }}
                  placeholder="e.g., 3 (for 3x per week)"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>
                  How many times per period (e.g., 3 for "3x per week")
                </Text>

                {/* Intensity/Difficulty */}
                <Text style={styles.inputLabel}>Intensity / Difficulty (1-5)</Text>
                <View style={styles.intensityContainer}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.intensityButton,
                        parseInt(questForm.intensity) === level && styles.intensityButtonActive,
                      ]}
                      onPress={() => setQuestForm({ ...questForm, intensity: level.toString() })}
                    >
                      <Text style={[
                        styles.intensityButtonText,
                        parseInt(questForm.intensity) === level && styles.intensityButtonTextActive,
                      ]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* XP Per Completion */}
                <Text style={styles.inputLabel}>XP Per Completion</Text>
                <TextInput
                  style={styles.input}
                  value={questForm.xpPerCompletion}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 10;
                    setQuestForm({ ...questForm, xpPerCompletion: Math.max(1, num).toString() });
                  }}
                  placeholder="10"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="numeric"
                />

                {/* Access Level (Optional) */}
                <Text style={styles.inputLabel}>Access Level (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={questForm.accessLevel}
                  onChangeText={(text) => setQuestForm({ ...questForm, accessLevel: text })}
                  placeholder="Leave empty if no requirement"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="numeric"
                />

                {/* Save Button (when editing in details tab) */}
                {editingQuest && questModalTab === 'details' && (
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={async () => {
                      await onSave();
                    }}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                )}

                {/* Delete Button (only when editing in details tab) */}
                {editingQuest && questModalTab === 'details' && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      onClose();
                      onDelete(editingQuest);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.accent.danger} />
                    <Text style={styles.deleteButtonText}>Delete Quest</Text>
                  </TouchableOpacity>
                )}

                {!editingQuest && <View style={{ height: 40 }} />}
              </>
            )}

            {/* History Tab */}
            {editingQuest && questModalTab === 'history' && (
              <>
                <View style={styles.questHistoryHeader}>
                  <Text style={styles.questHistoryTitle}>Completion History</Text>
                  <Text style={styles.questHistorySubtitle}>
                    {questCompletionsHistory.length} total completion{questCompletionsHistory.length !== 1 ? 's' : ''}
                  </Text>
                </View>

                {questCompletionsHistory.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="time-outline" size={48} color={COLORS.textTertiary} />
                    <Text style={styles.emptyStateText}>No completions yet</Text>
                    <Text style={styles.emptyStateSubtext}>Complete this quest to see history</Text>
                  </View>
                ) : (
                  <View style={styles.completionHistoryList}>
                    {questCompletionsHistory.map((completion, index) => {
                      const completionDate = new Date(completion.completedAt || completion.$createdAt);
                      const isToday = completionDate.toDateString() === new Date().toDateString();
                      const isYesterday = completionDate.toDateString() === new Date(Date.now() - 86400000).toDateString();
                      
                      let dateLabel = '';
                      if (isToday) {
                        dateLabel = 'Today';
                      } else if (isYesterday) {
                        dateLabel = 'Yesterday';
                      } else {
                        dateLabel = completionDate.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: completionDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        });
                      }
                      
                      return (
                        <View key={completion.$id || index} style={styles.completionHistoryItem}>
                          <View style={styles.completionHistoryIndicator}>
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.accent.success} />
                          </View>
                          <View style={styles.completionHistoryContent}>
                            <Text style={styles.completionHistoryDate}>{dateLabel}</Text>
                            <Text style={styles.completionHistoryTime}>
                              {completionDate.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </Text>
                          </View>
                          <View style={styles.completionHistoryMeta}>
                            {completion.streakCount > 0 && (
                              <View style={styles.completionStreakBadge}>
                                <Ionicons name="flame" size={12} color={COLORS.accent.warning} />
                                <Text style={styles.completionStreakText}>{completion.streakCount}</Text>
                              </View>
                            )}
                            <Text style={styles.completionHistoryXP}>
                              +{completion.xpEarned || editingQuest.xpPerCompletion || 10} XP
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
                <View style={{ height: 40 }} />
              </>
            )}

            {/* Stats Tab */}
            {editingQuest && questModalTab === 'stats' && questStats && (
              <>
                <View style={styles.questStatsContainer}>
                  {/* Current Streak */}
                  <View style={styles.questStatCard}>
                    <View style={styles.questStatHeader}>
                      <Ionicons name="flame" size={24} color={COLORS.accent.warning} />
                      <Text style={styles.questStatLabel}>Current Streak</Text>
                    </View>
                    <Text style={styles.questStatValue}>{questStats.currentStreak}</Text>
                    <Text style={styles.questStatUnit}>days</Text>
                  </View>

                  {/* Best Streak */}
                  <View style={styles.questStatCard}>
                    <View style={styles.questStatHeader}>
                      <Ionicons name="trophy" size={24} color={COLORS.accent.primary} />
                      <Text style={styles.questStatLabel}>Best Streak</Text>
                    </View>
                    <Text style={styles.questStatValue}>{questStats.bestStreak}</Text>
                    <Text style={styles.questStatUnit}>days</Text>
                  </View>

                  {/* Total Completions */}
                  <View style={styles.questStatCard}>
                    <View style={styles.questStatHeader}>
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.accent.success} />
                      <Text style={styles.questStatLabel}>Total Completions</Text>
                    </View>
                    <Text style={styles.questStatValue}>{questStats.totalCompletions}</Text>
                    <Text style={styles.questStatUnit}>times</Text>
                  </View>

                  {/* Total XP Earned */}
                  <View style={styles.questStatCard}>
                    <View style={styles.questStatHeader}>
                      <Ionicons name="star" size={24} color={COLORS.accent.primary} />
                      <Text style={styles.questStatLabel}>Total XP Earned</Text>
                    </View>
                    <Text style={styles.questStatValue}>{questStats.totalXP}</Text>
                    <Text style={styles.questStatUnit}>XP</Text>
                  </View>
                </View>

                {/* Additional Stats */}
                <View style={styles.questStatsDetails}>
                  {questStats.firstCompletion && (
                    <View style={styles.questStatDetailItem}>
                      <Text style={styles.questStatDetailLabel}>First Completion</Text>
                      <Text style={styles.questStatDetailValue}>
                        {questStats.firstCompletion.toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                  )}
                  {questStats.lastCompletion && (
                    <View style={styles.questStatDetailItem}>
                      <Text style={styles.questStatDetailLabel}>Last Completion</Text>
                      <Text style={styles.questStatDetailValue}>
                        {questStats.lastCompletion.toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                  )}
                  {questStats.firstCompletion && questStats.lastCompletion && (
                    <View style={styles.questStatDetailItem}>
                      <Text style={styles.questStatDetailLabel}>Quest Duration</Text>
                      <Text style={styles.questStatDetailValue}>
                        {Math.floor((questStats.lastCompletion - questStats.firstCompletion) / (1000 * 60 * 60 * 24))} days
                      </Text>
                    </View>
                  )}
                </View>

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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent.primary,
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  emptyArcWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent.warning}15`,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyArcWarningText: {
    fontSize: 13,
    color: COLORS.accent.warning,
    fontWeight: '500',
  },
  arcChipsScroll: {
    marginVertical: 8,
  },
  arcChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  arcChipIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  arcChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  frequencyScroll: {
    marginVertical: 8,
  },
  frequencyChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  frequencyChipActive: {
    backgroundColor: `${COLORS.accent.primary}20`,
    borderColor: COLORS.accent.primary,
  },
  frequencyChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  frequencyChipTextActive: {
    color: COLORS.accent.primary,
    fontWeight: '600',
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityButtonActive: {
    backgroundColor: `${COLORS.accent.primary}20`,
    borderColor: COLORS.accent.primary,
  },
  intensityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  intensityButtonTextActive: {
    color: COLORS.accent.primary,
  },
  saveButton: {
    backgroundColor: COLORS.accent.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.accent.danger}15`,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent.danger,
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
  questHistoryHeader: {
    marginBottom: 16,
  },
  questHistoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  questHistorySubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  completionHistoryList: {
    gap: 12,
  },
  completionHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  completionHistoryIndicator: {
    marginRight: 4,
  },
  completionHistoryContent: {
    flex: 1,
  },
  completionHistoryDate: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  completionHistoryTime: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  completionHistoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completionStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent.warning}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  completionStreakText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent.warning,
  },
  completionHistoryXP: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent.success,
  },
  questStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  questStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  questStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  questStatLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  questStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  questStatUnit: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  questStatsDetails: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  questStatDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questStatDetailLabel: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  questStatDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

