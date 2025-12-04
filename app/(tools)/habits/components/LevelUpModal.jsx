import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow, getRarityColor } from '../utils/visualEffects';
import { hapticLevelUp } from '../utils/haptics';
import Confetti from './Confetti';
import ParticleBurst from './ParticleBurst';
import GlowView from './GlowView';

export default function LevelUpModal({
  visible,
  levelUpData,
  onClose,
}) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const levelScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && levelUpData.level) {
      // Haptic feedback
      hapticLevelUp();
      
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      glowAnim.setValue(0);
      levelScaleAnim.setValue(0);
      
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
      
      // Rotate animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
      
      // Level badge reveal
      setTimeout(() => {
        Animated.spring(levelScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }).start();
      }, 300);
      
      // Hide confetti after animation
      setTimeout(() => {
        setShowConfetti(false);
        setShowParticles(false);
      }, 3000);
    }
  }, [visible, levelUpData.level]);

  const rarityColor = levelUpData.level ? getRarityColor(levelUpData.level) : COLORS.accent.primary;
  const arcColor = levelUpData.arc?.color || COLORS.accent.primary;
  const primaryColor = levelUpData.type === 'global' ? rarityColor : arcColor;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.3, 0.8],
  });

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.levelUpOverlay}>
        {/* Confetti */}
        <Confetti visible={showConfetti} color={primaryColor} />
        
        {/* Particle Burst */}
        <ParticleBurst
          visible={showParticles}
          color={primaryColor}
          duration={1500}
        />

        <Animated.View
          style={[
            styles.levelUpContent,
            {
              transform: [{ scale: scaleAnim }],
              borderColor: primaryColor,
            },
          ]}
        >
          {/* Glow overlay */}
          <Animated.View
            style={[
              styles.glowOverlay,
              {
                backgroundColor: primaryColor,
                opacity: glowOpacity,
              },
            ]}
          />

          {/* Icon/Emblem */}
          <Animated.View
            style={[
              styles.levelUpIconContainer,
              {
                transform: [{ rotate: rotation }],
              },
            ]}
          >
            <GlowView glowColor={primaryColor} intensity={1}>
              <LinearGradient
                colors={[primaryColor, COLORS.accent.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                {levelUpData.arc?.icon ? (
                  <Ionicons 
                    name={levelUpData.arc.icon} 
                    size={48} 
                    color={COLORS.textPrimary} 
                  />
                ) : (
                  <Text style={styles.levelUpEmoji}>
                    {levelUpData.type === 'global' ? '🎉' : '⭐'}
                  </Text>
                )}
              </LinearGradient>
            </GlowView>
          </Animated.View>

          {/* Title */}
          <Text style={[styles.levelUpTitle, { color: primaryColor }]}>
            {levelUpData.type === 'global' ? 'LEVEL UP!' : `${levelUpData.arc?.name || 'ARC'} LEVEL UP!`}
          </Text>

          {/* Level Display */}
          <View style={styles.levelUpLevelContainer}>
            <Text style={styles.levelUpLevelLabel}>LEVEL</Text>
            <Animated.View
              style={{
                transform: [{ scale: levelScaleAnim }],
              }}
            >
              <GlowView glowColor={rarityColor} intensity={1}>
                <Text style={[styles.levelUpLevelValue, { color: rarityColor }]}>
                  {levelUpData.level}
                </Text>
              </GlowView>
            </Animated.View>
          </View>

          {/* XP Earned */}
          <View style={styles.xpEarnedContainer}>
            <Ionicons name="star" size={20} color={COLORS.accent.primary} />
            <Text style={styles.levelUpXP}>
              +{levelUpData.xpEarned} XP earned
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.levelUpButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[primaryColor, COLORS.accent.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.levelUpButtonText}>Awesome!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  levelUpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  levelUpContent: {
    backgroundColor: COLORS.card,
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    maxWidth: '90%',
    borderWidth: 3,
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
  levelUpIconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelUpEmoji: {
    fontSize: 56,
  },
  levelUpTitle: {
    ...TYPOGRAPHY.hero,
    fontSize: 32,
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 2,
  },
  levelUpLevelContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  levelUpLevelLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 8,
  },
  levelUpLevelValue: {
    ...TYPOGRAPHY.hero,
    fontSize: 64,
  },
  xpEarnedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  levelUpXP: {
    ...TYPOGRAPHY.subtitle,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  levelUpButton: {
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
  levelUpButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
});

