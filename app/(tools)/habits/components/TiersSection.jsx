import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { TargetTypes } from '../../../../lib/appwrite';

export default function TiersSection({ 
  tiers,
  arcs,
  tierProgress,
  tierCompletions,
  onAddTier,
  onTierPress,
  onTierLongPress,
  onCompleteTier,
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TIERS & MILESTONES</Text>
        <View style={styles.questHeaderRight}>
          <Text style={styles.questCount}>{tiers.length}</Text>
          <TouchableOpacity style={styles.addButton} onPress={onAddTier}>
            <Ionicons name="add" size={20} color={COLORS.accent.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {tiers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={48} color={COLORS.textTertiary} />
          <Text style={styles.emptyStateText}>No tiers yet</Text>
          <Text style={styles.emptyStateSubtext}>Create milestones to track major achievements</Text>
        </View>
      ) : (
        <View style={styles.tiersList}>
          {tiers.map((tier) => {
            const arc = arcs.find(a => {
              const aId = typeof tier.arcId === 'object' ? tier.arcId.$id : tier.arcId;
              return a.$id === aId;
            });
            
            // Get calculated progress from state
            const progress = tierProgress[tier.$id] || { current: 0, target: tier.targetValue || 100, percentage: 0 };
            const isCompleted = tierCompletions[tier.$id] !== null && tierCompletions[tier.$id] !== undefined;
            
            return (
              <TouchableOpacity
                key={tier.$id}
                style={styles.tierCard}
                activeOpacity={0.7}
                onPress={() => onTierPress(tier)}
                onLongPress={() => onTierLongPress(tier)}
              >
                <View style={[styles.tierIndicator, { backgroundColor: arc?.color || COLORS.accent.primary }]} />
                <View style={styles.tierContent}>
                  <View style={styles.tierHeader}>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    {isCompleted && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.accent.success} />
                    )}
                  </View>
                  <View style={styles.tierMeta}>
                    <Text style={styles.tierArc}>{arc?.name || 'Unassigned'}</Text>
                    <Text style={styles.tierXP}>+{tier.xpReward || 100} XP</Text>
                  </View>
                  <View style={styles.tierProgressContainer}>
                    <View style={styles.tierProgressBar}>
                      <View 
                        style={[
                          styles.tierProgressFill,
                          {
                            width: `${isCompleted ? 100 : progress.percentage}%`,
                            backgroundColor: arc?.color || COLORS.accent.primary,
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.tierProgressText}>
                      {isCompleted 
                        ? 'Completed!' 
                        : `${Math.floor(progress.current)} / ${progress.target} ${tier.targetType === TargetTypes.DAYS ? 'days' : tier.targetType === TargetTypes.COUNT ? 'completions' : 'items'}`
                      }
                    </Text>
                  </View>
                </View>
                {!isCompleted && (
                  <TouchableOpacity
                    style={styles.tierCompleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      onCompleteTier(tier);
                    }}
                  >
                    <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.accent.success} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
  questHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  tiersList: {
    gap: 12,
  },
  tierCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent.primary,
  },
  tierIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  tierContent: {
    flex: 1,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  tierMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tierArc: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  tierXP: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent.primary,
  },
  tierProgressContainer: {
    marginTop: 8,
  },
  tierProgressBar: {
    height: 6,
    backgroundColor: COLORS.elevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  tierProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tierProgressText: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  tierCompleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

