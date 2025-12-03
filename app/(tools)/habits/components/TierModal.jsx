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
import { TargetTypes } from '../../../../lib/appwrite';

export default function TierModal({
  visible,
  editingTier,
  tierForm,
  setTierForm,
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
            <Text style={styles.modalTitle}>{editingTier ? 'Edit Tier' : 'Add Tier'}</Text>
            <TouchableOpacity onPress={onSave}>
              <Text style={styles.modalSaveText}>{editingTier ? 'Update' : 'Save'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Tier Name */}
            <Text style={[styles.inputLabel, { marginTop: 0 }]}>Tier Name</Text>
            <TextInput
              style={styles.input}
              value={tierForm.name}
              onChangeText={(text) => setTierForm({ ...tierForm, name: text })}
              placeholder="e.g., 100 days of meditation, Run a marathon"
              placeholderTextColor={COLORS.textTertiary}
              maxLength={200}
            />

            {/* Arc Selection */}
            <Text style={styles.inputLabel}>Assign to Arc</Text>
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
                      tierForm.arcId === arc.$id && { backgroundColor: `${arc.color || COLORS.accent.primary}20`, borderColor: arc.color || COLORS.accent.primary },
                    ]}
                    onPress={() => setTierForm({ ...tierForm, arcId: arc.$id })}
                  >
                    <View style={[styles.arcChipIndicator, { backgroundColor: arc.color || COLORS.accent.primary }]} />
                    <Text style={[
                      styles.arcChipText,
                      tierForm.arcId === arc.$id && { color: COLORS.textPrimary },
                    ]}>
                      {arc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Target Type */}
            <Text style={styles.inputLabel}>Target Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.frequencyScroll}>
              {Object.entries({
                [TargetTypes.DAYS]: 'Days',
                [TargetTypes.COUNT]: 'Count',
                [TargetTypes.AMOUNT]: 'Amount',
              }).map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.frequencyChip,
                    tierForm.targetType === value && styles.frequencyChipSelected,
                  ]}
                  onPress={() => setTierForm({ ...tierForm, targetType: value })}
                >
                  <Text style={[
                    styles.frequencyChipText,
                    tierForm.targetType === value && styles.frequencyChipTextSelected,
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Target Value */}
            <Text style={styles.inputLabel}>Target Value</Text>
            <TextInput
              style={styles.input}
              value={tierForm.targetValue}
              onChangeText={(text) => {
                const num = parseInt(text) || 100;
                setTierForm({ ...tierForm, targetValue: Math.max(1, num).toString() });
              }}
              placeholder="e.g., 100 (for 100 days)"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="numeric"
            />

            {/* XP Reward */}
            <Text style={styles.inputLabel}>XP Reward</Text>
            <TextInput
              style={styles.input}
              value={tierForm.xpReward}
              onChangeText={(text) => {
                const num = parseInt(text) || 100;
                setTierForm({ ...tierForm, xpReward: Math.max(1, num).toString() });
              }}
              placeholder="e.g., 500"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="numeric"
            />

            {/* Description */}
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={tierForm.description}
              onChangeText={(text) => setTierForm({ ...tierForm, description: text })}
              placeholder="Describe this tier..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            {/* Title Reward (Optional) */}
            <Text style={styles.inputLabel}>Title Reward (Optional)</Text>
            <TextInput
              style={styles.input}
              value={tierForm.titleReward || ''}
              onChangeText={(text) => setTierForm({ ...tierForm, titleReward: text })}
              placeholder="e.g., Master Meditator"
              placeholderTextColor={COLORS.textTertiary}
              maxLength={100}
            />
            <Text style={styles.inputHint}>
              Optional class title unlocked when tier is achieved
            </Text>

            {/* Delete Button (only when editing) */}
            {editingTier && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  onClose();
                  onDelete(editingTier);
                }}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.accent.danger} />
                <Text style={styles.deleteButtonText}>Delete Tier</Text>
              </TouchableOpacity>
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  frequencyChipSelected: {
    backgroundColor: `${COLORS.accent.primary}20`,
    borderColor: COLORS.accent.primary,
  },
  frequencyChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  frequencyChipTextSelected: {
    color: COLORS.accent.primary,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.accent.danger}15`,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent.danger,
  },
});

