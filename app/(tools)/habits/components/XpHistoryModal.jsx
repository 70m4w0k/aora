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

export default function XpHistoryModal({
  visible,
  xpHistory,
  xpHistoryLoading,
  xpHistoryFilters,
  arcs,
  onClose,
  onFilterChange,
  onLoadHistory,
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
              <Text style={styles.modalTitle}>XP History</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Filters */}
            <View style={styles.xpHistoryFilters}>
              <Text style={styles.inputLabel}>Filters</Text>
              
              {/* Arc Filter */}
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Arc</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      xpHistoryFilters.arcId === null && styles.filterChipActive,
                    ]}
                    onPress={() => onFilterChange({ ...xpHistoryFilters, arcId: null })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      xpHistoryFilters.arcId === null && styles.filterChipTextActive,
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {arcs.map((arc) => (
                    <TouchableOpacity
                      key={arc.$id}
                      style={[
                        styles.filterChip,
                        xpHistoryFilters.arcId === arc.$id && styles.filterChipActive,
                        xpHistoryFilters.arcId === arc.$id && { borderColor: arc.color },
                      ]}
                      onPress={() => onFilterChange({ ...xpHistoryFilters, arcId: arc.$id })}
                    >
                      <View style={[styles.filterChipIndicator, { backgroundColor: arc.color }]} />
                      <Text style={[
                        styles.filterChipText,
                        xpHistoryFilters.arcId === arc.$id && styles.filterChipTextActive,
                      ]}>
                        {arc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Source Type Filter */}
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Source</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      xpHistoryFilters.sourceType === null && styles.filterChipActive,
                    ]}
                    onPress={() => onFilterChange({ ...xpHistoryFilters, sourceType: null })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      xpHistoryFilters.sourceType === null && styles.filterChipTextActive,
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      xpHistoryFilters.sourceType === 'quest' && styles.filterChipActive,
                    ]}
                    onPress={() => onFilterChange({ ...xpHistoryFilters, sourceType: 'quest' })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      xpHistoryFilters.sourceType === 'quest' && styles.filterChipTextActive,
                    ]}>
                      Quests
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      xpHistoryFilters.sourceType === 'tier' && styles.filterChipActive,
                    ]}
                    onPress={() => onFilterChange({ ...xpHistoryFilters, sourceType: 'tier' })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      xpHistoryFilters.sourceType === 'tier' && styles.filterChipTextActive,
                    ]}>
                      Tiers
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Apply Filters Button */}
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={onLoadHistory}
              >
                <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>

            {/* XP History Timeline */}
            {xpHistoryLoading ? (
              <View style={styles.xpHistoryLoading}>
                <ActivityIndicator size="small" color={COLORS.accent.primary} />
                <Text style={styles.xpHistoryLoadingText}>Loading history...</Text>
              </View>
            ) : xpHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color={COLORS.textTertiary} />
                <Text style={styles.emptyStateText}>No XP history yet</Text>
                <Text style={styles.emptyStateSubtext}>Complete quests and tiers to see your XP gains</Text>
              </View>
            ) : (
              <View style={styles.xpHistoryTimeline}>
                {xpHistory.map((entry, index) => {
                  const arc = arcs.find(a => {
                    const aId = typeof entry.arcId === 'object' ? entry.arcId?.$id : entry.arcId;
                    return a.$id === aId;
                  });
                  const date = new Date(entry.earnedAt || entry.$createdAt);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();
                  
                  let dateLabel = '';
                  if (isToday) {
                    dateLabel = 'Today';
                  } else if (isYesterday) {
                    dateLabel = 'Yesterday';
                  } else {
                    dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
                  }
                  
                  const timeLabel = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                  
                  return (
                    <View key={entry.$id} style={styles.xpHistoryEntry}>
                      <View style={styles.xpHistoryTimelineLine}>
                        <View style={[
                          styles.xpHistoryTimelineDot,
                          { backgroundColor: arc?.color || COLORS.accent.primary },
                        ]} />
                        {index < xpHistory.length - 1 && <View style={styles.xpHistoryTimelineLineConnector} />}
                      </View>
                      <View style={styles.xpHistoryEntryContent}>
                        <View style={styles.xpHistoryEntryHeader}>
                          <View style={styles.xpHistoryEntryInfo}>
                            <Text style={styles.xpHistoryEntrySource}>
                              {entry.questName || entry.tierName || 'Unknown'}
                            </Text>
                            {entry.arcName && (
                              <Text style={styles.xpHistoryEntryArc}>
                                {entry.arcName}
                              </Text>
                            )}
                          </View>
                          <View style={styles.xpHistoryEntryXP}>
                            <Text style={[
                              styles.xpHistoryEntryXPAmount,
                              entry.penaltyXP > 0 && { color: COLORS.accent.danger },
                            ]}>
                              {entry.penaltyXP > 0 ? '-' : '+'}{entry.xpAmount}
                            </Text>
                            <Text style={styles.xpHistoryEntryXPLabel}>XP</Text>
                          </View>
                        </View>
                        <View style={styles.xpHistoryEntryMeta}>
                          <View style={[
                            styles.xpHistoryEntrySourceType,
                            { backgroundColor: entry.sourceType === 'quest' ? COLORS.accent.primary + '20' : COLORS.accent.success + '20' },
                          ]}>
                            <Ionicons 
                              name={entry.sourceType === 'quest' ? 'checkmark-circle' : 'trophy'} 
                              size={12} 
                              color={entry.sourceType === 'quest' ? COLORS.accent.primary : COLORS.accent.success} 
                            />
                            <Text style={[
                              styles.xpHistoryEntrySourceTypeText,
                              { color: entry.sourceType === 'quest' ? COLORS.accent.primary : COLORS.accent.success },
                            ]}>
                              {entry.sourceType === 'quest' ? 'Quest' : 'Tier'}
                            </Text>
                          </View>
                          <Text style={styles.xpHistoryEntryDate}>
                            {dateLabel} • {timeLabel}
                          </Text>
                          {entry.penaltyXP > 0 && (
                            <Text style={styles.xpHistoryEntryPenalty}>
                              Penalty: -{entry.penaltyXP} XP
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  xpHistoryFilters: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.accent.primary + '15',
    borderColor: COLORS.accent.primary,
  },
  filterChipIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.accent.primary,
    fontWeight: '600',
  },
  applyFiltersButton: {
    backgroundColor: COLORS.accent.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  applyFiltersButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  xpHistoryLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  xpHistoryLoadingText: {
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
  xpHistoryTimeline: {
    marginTop: 8,
  },
  xpHistoryEntry: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  xpHistoryTimelineLine: {
    alignItems: 'center',
    marginRight: 12,
  },
  xpHistoryTimelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accent.primary,
  },
  xpHistoryTimelineLineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
    minHeight: 40,
  },
  xpHistoryEntryContent: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
  },
  xpHistoryEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  xpHistoryEntryInfo: {
    flex: 1,
  },
  xpHistoryEntrySource: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  xpHistoryEntryArc: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  xpHistoryEntryXP: {
    alignItems: 'flex-end',
  },
  xpHistoryEntryXPAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent.primary,
  },
  xpHistoryEntryXPLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  xpHistoryEntryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  xpHistoryEntrySourceType: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  xpHistoryEntrySourceTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  xpHistoryEntryDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  xpHistoryEntryPenalty: {
    fontSize: 11,
    color: COLORS.accent.danger,
    fontWeight: '600',
  },
});

