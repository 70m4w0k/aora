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

export default function ArcModal({
  visible,
  editingArc,
  arcForm,
  setArcForm,
  onClose,
  onSave,
  onDelete,
}) {
  const colorOptions = [
    '#8B5CF6', '#F43F5E', '#06B6D4', '#22C55E', '#F59E0B',
    '#EC4899', '#14B8A6', '#3B82F6', '#EF4444', '#10B981',
  ];

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
            <Text style={styles.modalTitle}>{editingArc ? 'Edit Arc' : 'Add Arc'}</Text>
            <TouchableOpacity onPress={onSave}>
              <Text style={styles.modalSaveText}>{editingArc ? 'Update' : 'Save'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Arc Name */}
            <Text style={[styles.inputLabel, { marginTop: 0 }]}>Arc Name</Text>
            <TextInput
              style={styles.input}
              value={arcForm.name}
              onChangeText={(text) => setArcForm({ ...arcForm, name: text })}
              placeholder="e.g., Mental, Physical, Finance"
              placeholderTextColor={COLORS.textTertiary}
              maxLength={100}
            />

            {/* Color Selection */}
            <Text style={styles.inputLabel}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
              {colorOptions.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorChip,
                    arcForm.color === color && { borderColor: color, borderWidth: 2 },
                  ]}
                  onPress={() => setArcForm({ ...arcForm, color })}
                >
                  <View style={[styles.colorChipInner, { backgroundColor: color }]} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Icon Selection */}
            <Text style={styles.inputLabel}>Icon (Optional)</Text>
            <TextInput
              style={styles.input}
              value={arcForm.icon}
              onChangeText={(text) => setArcForm({ ...arcForm, icon: text })}
              placeholder="e.g., fitness, meditation, wallet"
              placeholderTextColor={COLORS.textTertiary}
              maxLength={100}
            />
            <Text style={styles.inputHint}>
              Enter an Ionicons name (e.g., "fitness", "meditation", "wallet")
            </Text>

            {/* Description */}
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={arcForm.description}
              onChangeText={(text) => setArcForm({ ...arcForm, description: text })}
              placeholder="Describe this arc..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            {/* Delete Button (only when editing) */}
            {editingArc && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  onClose();
                  onDelete(editingArc);
                }}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.accent.danger} />
                <Text style={styles.deleteButtonText}>Delete Arc</Text>
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
  inputHint: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  colorScroll: {
    marginVertical: 8,
  },
  colorChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorChipInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
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

