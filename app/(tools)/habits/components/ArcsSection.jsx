import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants';
import ArcCard from './ArcCard';

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
              <ArcCard
                key={arc.$id}
                arc={arc}
                progress={progress}
                userProgress={userProgress}
                onPress={() => onArcPress(arc)}
                onLongPress={() => onArcLongPress(arc)}
              />
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
    ...TYPOGRAPHY.title,
    fontSize: 18,
    color: COLORS.textPrimary,
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

