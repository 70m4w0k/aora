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
import { ProgressionTypes } from '../../../../lib/appwrite';

export default function SettingsModal({
  visible,
  userProgress,
  notificationsEnabled,
  user,
  household,
  onClose,
  onUpdateProgressionType,
  onToggleNotifications,
  onTogglePenaltySystem,
  showAlert,
  setAlertModalVisible,
  fetchData,
  onImportExamples,
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
            <Text style={styles.modalTitle}>Settings</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Progression Type */}
            <Text style={[styles.inputLabel, { marginTop: 0 }]}>Progression Type</Text>
            <Text style={styles.inputHint}>
              Choose how XP requirements scale as you level up
            </Text>
            
            <View style={styles.progressionTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.progressionTypeCard,
                  userProgress?.progressionType === ProgressionTypes.LINEAR && styles.progressionTypeCardSelected,
                ]}
                onPress={async () => {
                  try {
                    await onUpdateProgressionType(user.$id, household.$id, ProgressionTypes.LINEAR);
                    await fetchData();
                    showAlert('Success', 'Progression type updated to Linear', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
                  } catch (error) {
                    console.error('Error updating progression type:', error);
                    showAlert('Error', 'Could not update progression type', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
                  }
                }}
              >
                <Text style={styles.progressionTypeTitle}>Linear</Text>
                <Text style={styles.progressionTypeDescription}>
                  100 XP per level{'\n'}
                  Consistent progression
                </Text>
                {userProgress?.progressionType === ProgressionTypes.LINEAR && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.accent.primary} style={styles.progressionTypeCheck} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.progressionTypeCard,
                  (!userProgress?.progressionType || userProgress?.progressionType === ProgressionTypes.PROGRESSIVE) && styles.progressionTypeCardSelected,
                ]}
                onPress={async () => {
                  try {
                    await onUpdateProgressionType(user.$id, household.$id, ProgressionTypes.PROGRESSIVE);
                    await fetchData();
                    showAlert('Success', 'Progression type updated to Progressive', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
                  } catch (error) {
                    console.error('Error updating progression type:', error);
                    showAlert('Error', 'Could not update progression type', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
                  }
                }}
              >
                <Text style={styles.progressionTypeTitle}>Progressive</Text>
                <Text style={styles.progressionTypeDescription}>
                  Exponential growth{'\n'}
                  Level 1: 50 XP, Level 2: 75 XP, etc.
                </Text>
                {(!userProgress?.progressionType || userProgress?.progressionType === ProgressionTypes.PROGRESSIVE) && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.accent.primary} style={styles.progressionTypeCheck} />
                )}
              </TouchableOpacity>
            </View>

            {/* Notifications Toggle */}
            <View style={styles.settingsSection}>
              <Text style={[styles.inputLabel, { marginTop: 24 }]}>Quest Notifications</Text>
              <Text style={styles.inputHint}>
                Get notified about missed quest recurrences
              </Text>
              
              <TouchableOpacity
                style={styles.toggleContainer}
                onPress={onToggleNotifications}
              >
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Enable Missed Quest Notifications</Text>
                  <Text style={styles.toggleDescription}>
                    Show warnings and badges for missed quests
                  </Text>
                </View>
                <View style={[
                  styles.toggleSwitch,
                  notificationsEnabled && styles.toggleSwitchActive
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    notificationsEnabled && styles.toggleThumbActive
                  ]} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Penalty System Toggle */}
            <View style={styles.settingsSection}>
              <Text style={[styles.inputLabel, { marginTop: 24 }]}>Penalty System</Text>
              <Text style={styles.inputHint}>
                When active, missing quest recurrences will deduct XP (50% of quest XP per miss)
              </Text>
              
              <TouchableOpacity
                style={styles.toggleContainer}
                onPress={async () => {
                  try {
                    const newState = !userProgress?.penaltySystemActive;
                    await onTogglePenaltySystem(user.$id, household.$id, newState);
                    await fetchData();
                  } catch (error) {
                    console.error('Error toggling penalty system:', error);
                  }
                }}
              >
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Enable Penalty System</Text>
                  <Text style={styles.toggleDescription}>
                    Track missed recurrences and apply XP penalties
                  </Text>
                </View>
                <View style={[
                  styles.toggleSwitch,
                  userProgress?.penaltySystemActive && styles.toggleSwitchActive
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    userProgress?.penaltySystemActive && styles.toggleThumbActive
                  ]} />
                </View>
              </TouchableOpacity>
              
              {userProgress?.penaltySystemActive && (
                <View style={styles.penaltyStats}>
                  <Text style={styles.penaltyStatsLabel}>Penalty Statistics</Text>
                  <View style={styles.penaltyStatsRow}>
                    <Text style={styles.penaltyStatsValue}>
                      Total Penalties: {userProgress?.totalPenalties || 0}
                    </Text>
                    <Text style={styles.penaltyStatsValue}>
                      Total XP Lost: -{userProgress?.totalPenaltyXP || 0}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Examples Section */}
            <View style={styles.settingsSection}>
              <Text style={[styles.inputLabel, { marginTop: 24 }]}>Exemples</Text>
              <Text style={styles.inputHint}>
                Importe des arcs, quêtes et paliers pré-définis pour démarrer rapidement
              </Text>
              
              <TouchableOpacity
                style={styles.exampleButton}
                onPress={onImportExamples}
              >
                <Ionicons name="download" size={20} color={COLORS.accent.primary} />
                <Text style={styles.exampleButtonText}>Charger les exemples</Text>
              </TouchableOpacity>
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
    marginTop: 16,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 12,
  },
  progressionTypeContainer: {
    gap: 12,
    marginBottom: 8,
  },
  progressionTypeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  progressionTypeCardSelected: {
    borderColor: COLORS.accent.primary,
    backgroundColor: `${COLORS.accent.primary}10`,
  },
  progressionTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  progressionTypeDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  progressionTypeCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  settingsSection: {
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
    color: COLORS.textTertiary,
    lineHeight: 16,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: COLORS.accent.primary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  penaltyStats: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  penaltyStatsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  penaltyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  penaltyStatsValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.elevated,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
  },
  exampleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent.primary,
  },
});

