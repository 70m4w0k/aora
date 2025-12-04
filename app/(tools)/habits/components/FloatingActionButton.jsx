import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Modal, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow } from '../utils/visualEffects';
import { hapticAction } from '../utils/haptics';

/**
 * Floating Action Button Component
 * RPG-style FAB with expandable quick actions
 */
export default function FloatingActionButton({
  onAddQuest,
  onAddArc,
  onViewStats,
  style,
}) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const toggleExpanded = () => {
    hapticAction();
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);

    Animated.parallel([
      Animated.spring(rotateAnim, {
        toValue,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAction = (action) => {
    hapticAction();
    toggleExpanded();
    setTimeout(() => {
      if (action) action();
    }, 200);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const backdropOpacity = opacityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.7],
  });

  return (
    <>
      {/* Backdrop */}
      {expanded && (
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={toggleExpanded}
          />
        </Animated.View>
      )}

      {/* Action Buttons */}
      <View style={[styles.container, style]}>
        {/* Add Quest */}
        <Animated.View
          style={[
            styles.actionButton,
            {
              transform: [
                {
                  translateY: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -80],
                  }),
                },
                { scale: scaleAnim },
              ],
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButtonTouchable}
            onPress={() => handleAction(onAddQuest)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={COLORS.gradients?.xp || [COLORS.accent?.primary || '#8B5CF6', COLORS.accent?.primary || '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="add-circle" size={24} color={COLORS.textPrimary} />
            </LinearGradient>
            <View style={styles.actionLabel}>
              <View style={styles.actionLabelBackground}>
                <Ionicons name="list" size={14} color={COLORS.textPrimary} />
                <View style={styles.actionLabelTextContainer}>
                  <Text style={styles.actionLabelText}>Add Quest</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Add Arc */}
        <Animated.View
          style={[
            styles.actionButton,
            {
              transform: [
                {
                  translateY: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -140],
                  }),
                },
                { scale: scaleAnim },
              ],
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButtonTouchable}
            onPress={() => handleAction(onAddArc)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={COLORS.gradients?.success || [COLORS.accent?.success || '#22C55E', COLORS.accent?.success || '#22C55E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="layers" size={24} color={COLORS.textPrimary} />
            </LinearGradient>
            <View style={styles.actionLabel}>
              <View style={styles.actionLabelBackground}>
                <Ionicons name="layers-outline" size={14} color={COLORS.textPrimary} />
                <View style={styles.actionLabelTextContainer}>
                  <Text style={styles.actionLabelText}>Add Arc</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* View Stats */}
        <Animated.View
          style={[
            styles.actionButton,
            {
              transform: [
                {
                  translateY: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -200],
                  }),
                },
                { scale: scaleAnim },
              ],
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButtonTouchable}
            onPress={() => handleAction(onViewStats)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={COLORS.gradients?.arc?.mental || [COLORS.accent?.primary || '#8B5CF6', COLORS.accent?.primary || '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="stats-chart" size={24} color={COLORS.textPrimary} />
            </LinearGradient>
            <View style={styles.actionLabel}>
              <View style={styles.actionLabelBackground}>
                <Ionicons name="stats-chart-outline" size={14} color={COLORS.textPrimary} />
                <View style={styles.actionLabelTextContainer}>
                  <Text style={styles.actionLabelText}>View Stats</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Main FAB */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={toggleExpanded}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={COLORS.gradients?.xp || [COLORS.accent?.primary || '#8B5CF6', COLORS.accent?.primary || '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainButtonGradient}
          >
            <Animated.View
              style={{
                transform: [{ rotate: rotation }],
              }}
            >
              <Ionicons name="add" size={32} color={COLORS.textPrimary} />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    zIndex: 998,
  },
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 999,
  },
  mainButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    ...createGlow(COLORS.glows.primary, 0.6),
  },
  mainButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 56,
    height: 56,
  },
  actionButtonTouchable: {
    width: '100%',
    height: '100%',
  },
  actionButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...createGlow(COLORS.glows.primary, 0.4),
  },
  actionLabel: {
    position: 'absolute',
    right: 64,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  actionLabelBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    ...createGlow(COLORS.glows.primary, 0.2),
  },
  actionLabelTextContainer: {
    marginLeft: 4,
  },
  actionLabelText: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
});

