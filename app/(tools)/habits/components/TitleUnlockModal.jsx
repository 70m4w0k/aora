import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { COLORS } from '../constants';

export default function TitleUnlockModal({
  visible,
  title,
  onClose,
}) {
  const xpScale = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(xpScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(xpAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      xpScale.setValue(0);
      xpAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.titleUnlockModal,
            {
              transform: [{ scale: xpScale }],
              opacity: xpAnim,
            },
          ]}
        >
          <View style={styles.titleUnlockContent}>
            <Text style={styles.titleUnlockIcon}>
              {title?.icon || '🎉'}
            </Text>
            <Text style={styles.titleUnlockTitle}>Title Unlocked!</Text>
            <Text style={styles.titleUnlockName}>
              {title?.name || 'New Title'}
            </Text>
            <Text style={styles.titleUnlockDescription}>
              {title?.description || ''}
            </Text>
            <TouchableOpacity
              style={styles.titleUnlockButton}
              onPress={onClose}
            >
              <Text style={styles.titleUnlockButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleUnlockModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: '85%',
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
  },
  titleUnlockContent: {
    alignItems: 'center',
  },
  titleUnlockIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  titleUnlockTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  titleUnlockName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.accent.primary,
    marginBottom: 8,
  },
  titleUnlockDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  titleUnlockButton: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  titleUnlockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

