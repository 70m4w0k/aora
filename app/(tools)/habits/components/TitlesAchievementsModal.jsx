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

export default function TitlesAchievementsModal({
  visible,
  userProgress,
  unlockedTitles,
  unlockedAchievements,
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
              <Text style={styles.modalTitle}>Titles & Achievements</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Progress Summary */}
            {userProgress && (
              <View style={styles.achievementsProgressSummary}>
                <View style={styles.achievementsProgressItem}>
                  <Text style={styles.achievementsProgressValue}>{userProgress.globalLevel || 1}</Text>
                  <Text style={styles.achievementsProgressLabel}>Level</Text>
                </View>
                <View style={styles.achievementsProgressItem}>
                  <Text style={styles.achievementsProgressValue}>{userProgress.totalXP || 0}</Text>
                  <Text style={styles.achievementsProgressLabel}>Total XP</Text>
                </View>
                <View style={styles.achievementsProgressItem}>
                  <Text style={styles.achievementsProgressValue}>
                    {unlockedTitles.length + unlockedAchievements.length}
                  </Text>
                  <Text style={styles.achievementsProgressLabel}>Unlocked</Text>
                </View>
              </View>
            )}

            {/* Unlocked Titles */}
            <View style={styles.achievementsSection}>
              <Text style={styles.achievementsSectionTitle}>Titles</Text>
              {unlockedTitles.length > 0 ? (
                <View style={styles.achievementsGrid}>
                  {unlockedTitles.map((title) => (
                    <View key={title.id} style={styles.achievementBadge}>
                      <Text style={styles.achievementIcon}>{title.icon}</Text>
                      <Text style={styles.achievementName} numberOfLines={1}>{title.name}</Text>
                      <Text style={styles.achievementDescription} numberOfLines={2}>{title.description}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="trophy-outline" size={48} color={COLORS.textTertiary} />
                  <Text style={styles.emptyStateText}>No titles unlocked yet</Text>
                  <Text style={styles.emptyStateSubtext}>Complete tiers to unlock titles</Text>
                </View>
              )}
            </View>

            {/* Unlocked Achievements */}
            <View style={styles.achievementsSection}>
              <Text style={styles.achievementsSectionTitle}>Achievements</Text>
              {unlockedAchievements.length > 0 ? (
                <View style={styles.achievementsGrid}>
                  {unlockedAchievements.map((achievement) => (
                    <View key={achievement.id} style={styles.achievementBadge}>
                      <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                      <Text style={styles.achievementName} numberOfLines={1}>{achievement.name}</Text>
                      <Text style={styles.achievementDescription} numberOfLines={2}>{achievement.description}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="star-outline" size={48} color={COLORS.textTertiary} />
                  <Text style={styles.emptyStateText}>No achievements unlocked yet</Text>
                  <Text style={styles.emptyStateSubtext}>Complete quests and tiers to earn achievements</Text>
                </View>
              )}
            </View>

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
  achievementsProgressSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  achievementsProgressItem: {
    alignItems: 'center',
  },
  achievementsProgressValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.accent.primary,
    marginBottom: 4,
  },
  achievementsProgressLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  achievementsSection: {
    marginBottom: 32,
  },
  achievementsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementBadge: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
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
});

