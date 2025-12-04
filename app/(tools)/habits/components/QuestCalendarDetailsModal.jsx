import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow } from '../utils/visualEffects';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Quest Calendar Details Modal
 * Bottom sheet style modal for quest completions
 */
export default function QuestCalendarDetailsModal({
  visible,
  onClose,
  date,
  questDetails = [],
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Debug logging
  useEffect(() => {
    console.log('=== QuestCalendarDetailsModal Debug ===');
    console.log('visible:', visible);
    console.log('date:', date);
    console.log('questDetails:', questDetails);
    console.log('questDetails type:', typeof questDetails);
    console.log('questDetails is array:', Array.isArray(questDetails));
    console.log('questDetails.length:', questDetails?.length);
    if (questDetails && questDetails.length > 0) {
      console.log('First quest detail:', questDetails[0]);
      console.log('First quest:', questDetails[0]?.quest);
      console.log('First arc:', questDetails[0]?.arc);
    }
    console.log('=====================================');
  }, [visible, date, questDetails]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      backdropAnim.setValue(0);
    }
  }, [visible]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Debug: Log quest details
  useEffect(() => {
    if (visible) {
      console.log('QuestCalendarDetailsModal - questDetails:', questDetails);
      console.log('QuestCalendarDetailsModal - questDetails.length:', questDetails?.length);
    }
  }, [visible, questDetails]);

  const backdropOpacity = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: backdropOpacity },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.modalContent}>
            {/* Handle bar */}
            <View style={styles.handleBar}>
              <View style={styles.handle} />
            </View>

            {/* Decorative Top Border */}
            <LinearGradient
              colors={COLORS.gradients.xp}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.decorativeBorder}
            />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={[styles.headerIcon, { backgroundColor: `${COLORS.accent.primary}20` }]}>
                  <Ionicons name="calendar" size={24} color={COLORS.accent.primary} />
                </View>
                <Text style={styles.title}>{formatDate(date)}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <View style={styles.scrollContainer}>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                  styles.scrollContent,
                  questDetails.length === 0 && styles.scrollContentEmpty,
                ]}
                showsVerticalScrollIndicator={true}
                bounces={true}
              >
              {questDetails.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={COLORS.textTertiary} />
                  <Text style={styles.emptyText}>No quests completed</Text>
                  <Text style={styles.emptySubtext}>This day has no quest completions</Text>
                </View>
              ) : (
                <View style={styles.questsList}>
                  {questDetails.map(({ quest, arc }, index) => {
                    const arcColor = arc?.color || COLORS.accent.primary;
                    const xpReward = quest?.xpPerCompletion || 10;
                    
                    // Determine quest rarity
                    const getQuestRarity = () => {
                      if (xpReward >= 50) return 'legendary';
                      if (xpReward >= 30) return 'epic';
                      if (xpReward >= 20) return 'rare';
                      return 'common';
                    };
                    
                    const rarity = getQuestRarity();
                    const rarityColor = COLORS.rarity[rarity];

                    return (
                      <View
                        key={quest?.$id || index}
                        style={[
                          styles.questCard,
                          { borderLeftColor: arcColor },
                        ]}
                      >
                        {/* Quest Header */}
                        <View style={styles.questHeader}>
                          <View style={styles.questInfo}>
                            {arc?.icon ? (
                              <View style={[styles.arcIconContainer, { backgroundColor: `${arcColor}20` }]}>
                                <Ionicons name={arc.icon} size={20} color={arcColor} />
                              </View>
                            ) : (
                              <View style={[styles.arcIconContainer, { backgroundColor: `${arcColor}20` }]}>
                                <Text style={[styles.arcIconText, { color: arcColor }]}>
                                  {arc?.name?.[0]?.toUpperCase() || 'Q'}
                                </Text>
                              </View>
                            )}
                            
                            <View style={styles.questTextInfo}>
                              <Text style={styles.questName}>{quest?.name || 'Unknown Quest'}</Text>
                              {arc && (
                                <Text style={styles.arcName}>{arc.name}</Text>
                              )}
                            </View>
                          </View>

                          {/* XP Badge */}
                          <View style={[styles.xpBadge, { backgroundColor: `${COLORS.accent.success}20` }]}>
                            <Ionicons name="star" size={14} color={COLORS.accent.success} />
                            <Text style={styles.xpBadgeText}>+{xpReward}</Text>
                          </View>
                        </View>

                        {/* Rarity Badge */}
                        <View style={styles.questFooter}>
                          <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}20` }]}>
                            <Text style={[styles.rarityText, { color: rarityColor }]}>
                              {rarity.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
              </ScrollView>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContainer: {
    maxHeight: SCREEN_HEIGHT * 0.85,
    width: '100%',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
    overflow: 'hidden',
    maxHeight: SCREEN_HEIGHT * 0.85,
    flexDirection: 'column',
    ...createGlow(COLORS.glows.primary, 0.3),
  },
  scrollContainer: {
    height: SCREEN_HEIGHT * 0.6,
    maxHeight: SCREEN_HEIGHT * 0.7,
    backgroundColor: 'transparent', // Debug: make visible
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textTertiary,
    opacity: 0.5,
  },
  decorativeBorder: {
    height: 4,
    width: '100%',
  },
  header: {
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
  title: {
    ...TYPOGRAPHY.title,
    fontSize: 20,
    color: COLORS.textPrimary,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent', // Debug: make visible
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  scrollContentEmpty: {
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    ...TYPOGRAPHY.subtitle,
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  questsList: {
    gap: 12,
  },
  questCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    ...createGlow(COLORS.glows.primary, 0.2),
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  questInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  arcIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arcIconText: {
    ...TYPOGRAPHY.title,
    fontSize: 18,
  },
  questTextInfo: {
    flex: 1,
  },
  questName: {
    ...TYPOGRAPHY.subtitle,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  arcName: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  xpBadgeText: {
    ...TYPOGRAPHY.stat,
    fontSize: 13,
    color: COLORS.accent.success,
    fontWeight: '600',
  },
  questFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rarityText: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '700',
  },
});
