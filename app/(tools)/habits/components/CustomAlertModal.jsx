import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants';

export default function CustomAlertModal({
  visible,
  alertData,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.alertOverlay}>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>{alertData.title}</Text>
          <Text style={styles.alertMessage}>{alertData.message}</Text>
          <View style={styles.alertButtons}>
            {alertData.buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.alertButton,
                  index === alertData.buttons.length - 1 && alertData.buttons.length > 1 && styles.alertButtonPrimary,
                  button.text === 'Delete' && styles.alertButtonDanger,
                ]}
                onPress={() => {
                  if (button.onPress) button.onPress();
                  onClose();
                }}
              >
                <Text style={[
                  styles.alertButtonText,
                  index === alertData.buttons.length - 1 && alertData.buttons.length > 1 && styles.alertButtonTextPrimary,
                  button.text === 'Delete' && styles.alertButtonTextDanger,
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  alertButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    minWidth: 80,
    alignItems: 'center',
  },
  alertButtonPrimary: {
    backgroundColor: COLORS.accent.primary,
  },
  alertButtonDanger: {
    backgroundColor: `${COLORS.accent.danger}15`,
  },
  alertButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  alertButtonTextPrimary: {
    color: COLORS.textPrimary,
  },
  alertButtonTextDanger: {
    color: COLORS.accent.danger,
  },
});

