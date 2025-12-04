import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow } from '../utils/visualEffects';
import RPGButton from './RPGButton';

/**
 * RPG-Style Modal Component
 * Enhanced modal with RPG aesthetics
 */
export default function RPGModal({
  visible,
  onClose,
  title,
  icon = null,
  children,
  footer = null,
  variant = 'default', // 'default', 'quest', 'arc', 'tier'
  showCloseButton = true,
  animationType = 'slide', // 'slide', 'fade', 'scale'
  fullScreen = false,
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      if (animationType === 'slide') {
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }).start();
      } else if (animationType === 'fade') {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    } else {
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'quest':
        return {
          borderColor: COLORS.accent.primary,
          gradient: COLORS.gradients.xp,
        };
      case 'arc':
        return {
          borderColor: COLORS.accent.success,
          gradient: COLORS.gradients.success,
        };
      case 'tier':
        return {
          borderColor: COLORS.rarity.legendary,
          gradient: COLORS.gradients.levelUp,
        };
      default:
        return {
          borderColor: COLORS.border,
          gradient: [COLORS.card, COLORS.elevated],
        };
    }
  };

  const variantStyles = getVariantStyles();

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const opacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  return (
    <Modal visible={visible} transparent={true} animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              animationType === 'slide' && { transform: [{ translateY }] },
              animationType === 'fade' && { opacity },
              animationType === 'scale' && { transform: [{ scale }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity activeOpacity={1}>
              <View
                style={[
                  styles.modalContent,
                  fullScreen && styles.modalContentFullScreen,
                  {
                    borderColor: variantStyles.borderColor,
                    ...createGlow(variantStyles.borderColor, 0.3),
                  },
                ]}
              >
                {/* Decorative Top Border */}
                <LinearGradient
                  colors={variantStyles.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.decorativeBorder}
                />

                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.headerLeft}>
                    {icon && (
                      <View style={[styles.headerIcon, { backgroundColor: `${variantStyles.borderColor}20` }]}>
                        <Ionicons name={icon} size={24} color={variantStyles.borderColor} />
                      </View>
                    )}
                    <Text style={styles.modalTitle}>{title}</Text>
                  </View>
                  {showCloseButton && (
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={onClose}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Content */}
                <View style={styles.modalBody}>{children}</View>

                {/* Footer */}
                {footer && <View style={styles.modalFooter}>{footer}</View>}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
  },
  modalContentFullScreen: {
    borderRadius: 0,
    maxHeight: '100%',
    height: '100%',
  },
  decorativeBorder: {
    height: 4,
    width: '100%',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...TYPOGRAPHY.title,
    fontSize: 20,
    color: COLORS.textPrimary,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
});

