import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow, getRarityColor } from '../utils/visualEffects';
import { hapticAchievement } from '../utils/haptics';
import Confetti from './Confetti';
import ParticleBurst from './ParticleBurst';
import GlowView from './GlowView';

export default function TitleUnlockModal({
  visible,
  title,
  onClose,
}) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && title) {
      // Haptic feedback
      hapticAchievement();
      
      // Reset animations
      scaleAnim.setValue(0);
      iconScaleAnim.setValue(0);
      glowAnim.setValue(0);
      rotateAnim.setValue(0);
      
      // Show confetti and particles
      setShowConfetti(true);
      setShowParticles(true);
      
      // Animate modal entrance
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
      
      // Icon animation
      setTimeout(() => {
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }).start();
      }, 200);
      
      // Rotate animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
      
      // Hide confetti after animation
      setTimeout(() => {
        setShowConfetti(false);
        setShowParticles(false);
      }, 3000);
    } else {
      scaleAnim.setValue(0);
      iconScaleAnim.setValue(0);
    }
  }, [visible, title]);

  const rarityColor = COLORS.rarity.legendary; // Titles are always legendary
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.4, 0.9],
  });

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Confetti */}
        <Confetti visible={showConfetti} color={rarityColor} />
        
        {/* Particle Burst */}
        <ParticleBurst
          visible={showParticles}
          color={rarityColor}
          duration={1500}
        />

        <Animated.View
          style={[
            styles.titleUnlockModal,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Glow overlay */}
          <Animated.View
            style={[
              styles.glowOverlay,
              {
                backgroundColor: rarityColor,
                opacity: glowOpacity,
              },
            ]}
          />

          {/* Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [
                  { scale: iconScaleAnim },
                  { rotate: rotation },
                ],
              },
            ]}
          >
            <GlowView glowColor={rarityColor} intensity={1}>
              <LinearGradient
                colors={[rarityColor, COLORS.accent.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Text style={styles.titleUnlockIcon}>
                  {title?.icon || '🎉'}
                </Text>
              </LinearGradient>
            </GlowView>
          </Animated.View>

          {/* Title */}
          <Text style={styles.titleUnlockTitle}>ACHIEVEMENT UNLOCKED!</Text>
          
          {/* Title Name */}
          <Text style={[styles.titleUnlockName, { color: rarityColor }]}>
            {title?.name || 'New Title'}
          </Text>
          
          {/* Description */}
          <Text style={styles.titleUnlockDescription}>
            {title?.description || ''}
          </Text>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.titleUnlockButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[rarityColor, COLORS.accent.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.titleUnlockButtonText}>Awesome!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleUnlockModal: {
    backgroundColor: COLORS.card,
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    maxWidth: '90%',
    borderWidth: 3,
    borderColor: COLORS.rarity.legendary,
    overflow: 'hidden',
    ...createGlow(COLORS.glows.primary, 0.6),
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleUnlockIcon: {
    fontSize: 72,
  },
  titleUnlockTitle: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    color: COLORS.textTertiary,
    marginBottom: 12,
    letterSpacing: 2,
  },
  titleUnlockName: {
    ...TYPOGRAPHY.hero,
    fontSize: 36,
    marginBottom: 16,
    textAlign: 'center',
  },
  titleUnlockDescription: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  titleUnlockButton: {
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 140,
    ...createGlow(COLORS.glows.primary, 0.5),
  },
  buttonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleUnlockButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
});

