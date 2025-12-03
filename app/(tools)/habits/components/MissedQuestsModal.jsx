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
import { QuestFrequencies } from '../../../../lib/appwrite';

export default function MissedQuestsModal({
  visible,
  missedQuests,
  arcs,
  onClose,
  onQuestPress,
  onCompleteQuest,
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
              <Text style={styles.modalTitle}>Missed Quests</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {missedQuests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color={COLORS.accent.success} />
                <Text style={styles.emptyStateText}>All caught up!</Text>
                <Text style={styles.emptyStateSubtext}>No missed quests</Text>
              </View>
            ) : (
              <View style={styles.missedQuestsList}>
                {missedQuests.map((missed) => {
                  const arc = arcs.find(a => {
                    const aId = typeof missed.quest.arcId === 'object' ? missed.quest.arcId.$id : missed.quest.arcId;
                    return a.$id === aId;
                  });
                  
                  return (
                    <TouchableOpacity
                      key={missed.quest.$id}
                      style={styles.missedQuestCard}
                      activeOpacity={0.7}
                      onPress={() => onQuestPress(missed.quest)}
                    >
                      <View style={[styles.missedQuestIndicator, styles.missedQuestIndicatorLarge, { backgroundColor: `${COLORS.accent.danger}20` }]}>
                        <Ionicons name="warning" size={20} color={COLORS.accent.danger} />
                      </View>
                      <View style={styles.missedQuestContent}>
                        <View style={styles.missedQuestHeader}>
                          <Text style={styles.missedQuestName}>{missed.quest.name}</Text>
                          <View style={[styles.missedQuestCountBadge, { backgroundColor: COLORS.accent.danger }]}>
                            <Text style={styles.missedQuestCountText}>{missed.missedCount}x</Text>
                          </View>
                        </View>
                        <View style={styles.missedQuestMeta}>
                          <View style={styles.missedQuestMetaItem}>
                            <View style={[styles.missedQuestMetaIndicator, { backgroundColor: arc?.color || COLORS.accent.primary }]} />
                            <Text style={styles.missedQuestMetaText}>{arc?.name || 'Unassigned'}</Text>
                          </View>
                          {missed.lastCompleted && (
                            <View style={styles.missedQuestMetaItem}>
                              <Ionicons name="time-outline" size={14} color={COLORS.textTertiary} />
                              <Text style={styles.missedQuestMetaText}>
                                {missed.daysSinceLastCompletion === 0 
                                  ? 'Today' 
                                  : missed.daysSinceLastCompletion === 1 
                                  ? 'Yesterday' 
                                  : `${missed.daysSinceLastCompletion} days ago`}
                              </Text>
                            </View>
                          )}
                          {!missed.lastCompleted && (
                            <View style={styles.missedQuestMetaItem}>
                              <Ionicons name="alert-circle-outline" size={14} color={COLORS.accent.danger} />
                              <Text style={[styles.missedQuestMetaText, { color: COLORS.accent.danger }]}>
                                Never completed
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.missedQuestFrequency}>
                          <Ionicons name="repeat" size={12} color={COLORS.textTertiary} />
                          <Text style={styles.missedQuestFrequencyText}>
                            {missed.quest.frequency === QuestFrequencies.DAILY ? 'Daily' :
                             missed.quest.frequency === QuestFrequencies.WEEKLY ? 'Weekly' :
                             missed.quest.frequency === QuestFrequencies.MONTHLY ? 'Monthly' :
                             missed.quest.frequency === QuestFrequencies.ANNUAL ? 'Annual' : 'Unique'}
                            {missed.quest.repetitionPerPeriod > 1 && ` • ${missed.quest.repetitionPerPeriod}x`}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.missedQuestCompleteButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          onCompleteQuest(missed.quest);
                          onClose();
                        }}
                      >
                        <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.accent.success} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
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
  missedQuestsList: {
    gap: 12,
  },
  missedQuestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  missedQuestIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  missedQuestIndicatorLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  missedQuestContent: {
    flex: 1,
  },
  missedQuestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  missedQuestName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  missedQuestCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  missedQuestCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  missedQuestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  missedQuestMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  missedQuestMetaIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  missedQuestMetaText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  missedQuestFrequency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  missedQuestFrequencyText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  missedQuestCompleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

