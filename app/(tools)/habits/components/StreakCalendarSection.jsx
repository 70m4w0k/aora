import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

export default function StreakCalendarSection({ onView }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>STREAK CALENDAR</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={onView}
        >
          <Text style={styles.viewAllButtonText}>View</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.accent.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.preview}>
        <Text style={styles.previewText}>
          Visualize your quest completion streaks
        </Text>
        <Text style={styles.previewSubtext}>
          Track consistency across all your quests
        </Text>
      </View>
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllButtonText: {
    fontSize: 12,
    color: COLORS.accent.primary,
    fontWeight: '500',
  },
  preview: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  previewSubtext: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});

