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
import StreakCalendarView from './StreakCalendarView';

export default function StreakCalendarModal({
  visible,
  quests,
  arcs,
  user,
  selectedQuestForStreak,
  onClose,
  onQuestFilterChange,
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
              <Text style={styles.modalTitle}>Streak Calendar</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Quest Filter */}
            <View style={styles.streakCalendarFilter}>
              <Text style={styles.inputLabel}>Filter by Quest</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.streakFilterChip,
                    selectedQuestForStreak === null && styles.streakFilterChipActive,
                  ]}
                  onPress={() => onQuestFilterChange(null)}
                >
                  <Text style={[
                    styles.streakFilterChipText,
                    selectedQuestForStreak === null && styles.streakFilterChipTextActive,
                  ]}>
                    All Quests
                  </Text>
                </TouchableOpacity>
                {quests.map((quest) => {
                  const arc = arcs.find(a => {
                    const aId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
                    return a.$id === aId;
                  });
                  return (
                    <TouchableOpacity
                      key={quest.$id}
                      style={[
                        styles.streakFilterChip,
                        selectedQuestForStreak === quest.$id && styles.streakFilterChipActive,
                        selectedQuestForStreak === quest.$id && { borderColor: arc?.color || COLORS.accent.primary },
                      ]}
                      onPress={() => onQuestFilterChange(quest.$id)}
                    >
                      <View style={[
                        styles.streakFilterChipIndicator,
                        { backgroundColor: arc?.color || COLORS.accent.primary },
                      ]} />
                      <Text style={[
                        styles.streakFilterChipText,
                        selectedQuestForStreak === quest.$id && styles.streakFilterChipTextActive,
                      ]} numberOfLines={1}>
                        {quest.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Streak Calendar */}
            <StreakCalendarView
              quests={selectedQuestForStreak ? quests.filter(q => q.$id === selectedQuestForStreak) : quests}
              arcs={arcs}
              userId={user?.$id}
            />

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
    marginBottom: 8,
  },
  streakCalendarFilter: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  streakFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
    gap: 6,
  },
  streakFilterChipActive: {
    backgroundColor: COLORS.accent.primary + '15',
    borderColor: COLORS.accent.primary,
  },
  streakFilterChipIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  streakFilterChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  streakFilterChipTextActive: {
    color: COLORS.accent.primary,
    fontWeight: '600',
  },
});

