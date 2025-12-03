import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

export default function LevelUpModal({
  visible,
  levelUpData,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.levelUpOverlay}>
        <View style={[
          styles.levelUpContent,
          levelUpData.arc && { borderColor: levelUpData.arc.color || COLORS.accent.primary },
        ]}>
          {/* Icon/Emoji */}
          <View style={[
            styles.levelUpIconContainer,
            levelUpData.arc && { backgroundColor: `${levelUpData.arc.color || COLORS.accent.primary}20` },
          ]}>
            {levelUpData.arc?.icon ? (
              <Ionicons 
                name={levelUpData.arc.icon} 
                size={40} 
                color={levelUpData.arc.color || COLORS.accent.primary} 
              />
            ) : (
              <Text style={styles.levelUpEmoji}>
                {levelUpData.type === 'global' ? '🎉' : '⭐'}
              </Text>
            )}
          </View>

          {/* Title */}
          <Text style={[
            styles.levelUpTitle,
            levelUpData.arc && { color: levelUpData.arc.color || COLORS.accent.primary },
          ]}>
            {levelUpData.type === 'global' ? 'Level Up!' : `${levelUpData.arc?.name || 'Arc'} Level Up!`}
          </Text>

          {/* Level Display */}
          <View style={styles.levelUpLevelContainer}>
            <Text style={styles.levelUpLevelLabel}>Level</Text>
            <Text style={[
              styles.levelUpLevelValue,
              levelUpData.arc && { color: levelUpData.arc.color || COLORS.accent.primary },
            ]}>
              {levelUpData.level}
            </Text>
          </View>

          {/* XP Earned */}
          <Text style={styles.levelUpXP}>
            +{levelUpData.xpEarned} XP earned
          </Text>

          {/* Close Button */}
          <TouchableOpacity
            style={[
              styles.levelUpButton,
              levelUpData.arc && { backgroundColor: levelUpData.arc.color || COLORS.accent.primary },
            ]}
            onPress={onClose}
          >
            <Text style={styles.levelUpButtonText}>Awesome!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  levelUpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  levelUpContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: '85%',
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
  },
  levelUpIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.accent.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelUpEmoji: {
    fontSize: 48,
  },
  levelUpTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.accent.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  levelUpLevelContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  levelUpLevelLabel: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  levelUpLevelValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.accent.primary,
  },
  levelUpXP: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  levelUpButton: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 120,
  },
  levelUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});

