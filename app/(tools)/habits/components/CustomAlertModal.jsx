import React from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow } from '../utils/visualEffects';
import RPGButton from './RPGButton';

export default function CustomAlertModal({
  visible,
  title,
  message,
  buttons = [],
  alertData, // Legacy support
  onClose,
}) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const handleButtonPress = (button) => {
    if (button.onPress) button.onPress();
    onClose();
  };

  // Support legacy alertData prop
  const alertTitle = title || (alertData?.title || '');
  const alertMessage = message || (alertData?.message || '');
  const alertButtons = buttons.length > 0 ? buttons : (alertData?.buttons || []);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.alertOverlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.alertContent,
            {
              transform: [{ scale: scaleAnim }],
              ...createGlow(COLORS.glows.primary, 0.3),
            },
          ]}
        >
          {/* Decorative Top Border */}
          <LinearGradient
            colors={COLORS.gradients.xp}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.decorativeBorder}
          />

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="information-circle" size={48} color={COLORS.accent.primary} />
          </View>

          <Text style={styles.alertTitle}>{alertTitle}</Text>
          <Text style={styles.alertMessage}>{alertMessage}</Text>
          <View style={styles.alertButtons}>
            {alertButtons.map((button, index) => {
              const isPrimary = index === alertButtons.length - 1 && alertButtons.length > 1;
              const isDanger = button.text === 'Delete' || button.variant === 'danger';
              const variant = isDanger ? 'danger' : isPrimary ? 'primary' : 'secondary';

              return (
                <RPGButton
                  key={index}
                  title={button.text}
                  variant={variant}
                  size="medium"
                  onPress={() => handleButtonPress(button)}
                  style={styles.alertButton}
                />
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  decorativeBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  iconContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  alertTitle: {
    ...TYPOGRAPHY.title,
    fontSize: 22,
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  alertMessage: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
    textAlign: 'center',
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
    flexWrap: 'wrap',
  },
  alertButton: {
    minWidth: 100,
  },
});

