import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

export default function MissedQuestsBanner({ missedQuests, onPress }) {
  if (!missedQuests || missedQuests.length === 0) return null;

  return (
    <TouchableOpacity
      style={styles.banner}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.content}>
        <Ionicons name="notifications" size={20} color={COLORS.accent.warning} />
        <View style={styles.text}>
          <Text style={styles.title}>
            {missedQuests.length} quest{missedQuests.length > 1 ? 's' : ''} missed
          </Text>
          <Text style={styles.subtitle}>
            Tap to view details
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{missedQuests.length}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: `${COLORS.accent.warning}15`,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: `${COLORS.accent.warning}30`,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});

