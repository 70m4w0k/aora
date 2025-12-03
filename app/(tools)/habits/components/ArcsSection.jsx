import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { getXPForNextLevel, getTotalXPForLevel } from '../../../../lib/appwrite';

export default function ArcsSection({ 
  arcs, 
  quests, 
  userProgress,
  getArcProgress,
  onAddArc,
  onArcPress,
  onArcLongPress 
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>ARCS</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddArc}>
          <Ionicons name="add" size={20} color={COLORS.accent.primary} />
        </TouchableOpacity>
      </View>
      
      {arcs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="layers-outline" size={48} color={COLORS.textTertiary} />
          <Text style={styles.emptyStateText}>No arcs yet</Text>
          <Text style={styles.emptyStateSubtext}>Create your first arc to get started</Text>
        </View>
      ) : (
        <View style={styles.arcsGrid}>
          {arcs.map((arc) => {
            const progress = getArcProgress(arc.$id);
            
            return (
              <TouchableOpacity
                key={arc.$id}
                style={[styles.arcCard, { borderLeftColor: arc.color || COLORS.accent.primary }]}
                activeOpacity={0.8}
                onPress={() => onArcPress(arc)}
                onLongPress={() => onArcLongPress(arc)}
              >
                <View style={styles.arcCardHeader}>
                  <View style={styles.arcIconContainer}>
                    {arc.icon ? (
                      <Ionicons name={arc.icon} size={24} color={arc.color || COLORS.accent.primary} />
                    ) : (
                      <View style={[styles.arcIconPlaceholder, { backgroundColor: `${arc.color || COLORS.accent.primary}20` }]}>
                        <Text style={[styles.arcIconText, { color: arc.color || COLORS.accent.primary }]}>
                          {arc.name?.[0]?.toUpperCase() || 'A'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.arcInfo}>
                    <Text style={styles.arcName}>{arc.name}</Text>
                    <Text style={styles.arcStats}>
                      Level {progress.level || 1} • {progress.questsCompleted || 0} quests • {progress.tiersCompleted || 0} tiers
                    </Text>
                  </View>
                </View>
                <View style={styles.arcProgressBar}>
                  {(() => {
                    const progressionType = userProgress?.progressionType || 'progressive';
                    const arcLevel = progress.level || 1;
                    const arcXP = progress.totalXP || 0;
                    const xpForNextLevel = getXPForNextLevel(arcLevel, progressionType);
                    const xpForCurrentLevel = getTotalXPForLevel(arcLevel, progressionType);
                    const xpInCurrentLevel = Math.max(0, arcXP - xpForCurrentLevel);
                    const progressPercent = Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100);
                    
                    return (
                      <View 
                        style={[
                          styles.arcProgressFill, 
                          { 
                            width: `${progressPercent}%`,
                            backgroundColor: arc.color || COLORS.accent.primary,
                          }
                        ]} 
                      />
                    );
                  })()}
                </View>
                <Text style={styles.arcXP}>{progress.totalXP || 0} XP • Level {progress.level || 1}</Text>
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
  arcsGrid: {
    gap: 12,
  },
  arcCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  arcCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  arcIconContainer: {
    marginRight: 12,
  },
  arcIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arcIconText: {
    fontSize: 20,
    fontWeight: '700',
  },
  arcInfo: {
    flex: 1,
  },
  arcName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  arcStats: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  arcProgressBar: {
    height: 6,
    backgroundColor: COLORS.elevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  arcProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  arcXP: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

