import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow, getRarityColor } from '../utils/visualEffects';
import Badge from './Badge';

/**
 * Filter Bar Component
 * RPG-style filter bar for quests and content
 */
export default function FilterBar({
  filters = {
    arcId: null,
    status: null, // 'active', 'completed', 'missed'
    rarity: null, // 'common', 'rare', 'epic', 'legendary'
    sortBy: null, // 'streak', 'xp', 'name', 'date'
  },
  arcs = [],
  onFilterChange,
  showSort = true,
}) {
  const handleFilterToggle = (filterType, value) => {
    const newFilters = { ...filters };
    if (newFilters[filterType] === value) {
      newFilters[filterType] = null; // Toggle off
    } else {
      newFilters[filterType] = value; // Set filter
    }
    if (onFilterChange) onFilterChange(newFilters);
  };

  const getRarityColorForFilter = (rarity) => {
    return COLORS.rarity[rarity] || COLORS.textSecondary;
  };

  return (
    <View style={styles.filterBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {/* Arc Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Arc</Text>
          <View style={styles.filterChips}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filters.arcId === null && styles.filterChipActive,
              ]}
              onPress={() => handleFilterToggle('arcId', null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filters.arcId === null && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {arcs.map((arc) => (
              <TouchableOpacity
                key={arc.$id}
                style={[
                  styles.filterChip,
                  styles.filterChipArc,
                  filters.arcId === arc.$id && styles.filterChipActive,
                  { borderColor: arc.color || COLORS.accent.primary },
                ]}
                onPress={() => handleFilterToggle('arcId', arc.$id)}
              >
                <View
                  style={[
                    styles.filterChipIndicator,
                    { backgroundColor: arc.color || COLORS.accent.primary },
                  ]}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    filters.arcId === arc.$id && styles.filterChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {arc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Status</Text>
          <View style={styles.filterChips}>
            {[
              { value: null, label: 'All', icon: 'list' },
              { value: 'active', label: 'Active', icon: 'radio-button-on', color: COLORS.accent.primary },
              { value: 'completed', label: 'Done', icon: 'checkmark-circle', color: COLORS.accent.success },
              { value: 'missed', label: 'Missed', icon: 'warning', color: COLORS.accent.danger },
            ].map((status) => (
              <TouchableOpacity
                key={status.value || 'all'}
                style={[
                  styles.filterChip,
                  filters.status === status.value && styles.filterChipActive,
                  status.color && { borderColor: status.color },
                ]}
                onPress={() => handleFilterToggle('status', status.value)}
              >
                {status.icon && (
                  <Ionicons
                    name={status.icon}
                    size={14}
                    color={
                      filters.status === status.value
                        ? status.color || COLORS.accent.primary
                        : COLORS.textSecondary
                    }
                    style={styles.filterChipIcon}
                  />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    filters.status === status.value && styles.filterChipTextActive,
                  ]}
                >
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rarity Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Rarity</Text>
          <View style={styles.filterChips}>
            {[
              { value: null, label: 'All' },
              { value: 'common', label: 'Common', color: COLORS.rarity.common },
              { value: 'rare', label: 'Rare', color: COLORS.rarity.rare },
              { value: 'epic', label: 'Epic', color: COLORS.rarity.epic },
              { value: 'legendary', label: 'Legendary', color: COLORS.rarity.legendary },
            ].map((rarity) => (
              <TouchableOpacity
                key={rarity.value || 'all'}
                style={[
                  styles.filterChip,
                  styles.filterChipRarity,
                  filters.rarity === rarity.value && styles.filterChipActive,
                  rarity.color && { borderColor: rarity.color },
                ]}
                onPress={() => handleFilterToggle('rarity', rarity.value)}
              >
                {rarity.color && (
                  <View
                    style={[
                      styles.filterChipIndicator,
                      { backgroundColor: rarity.color },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    filters.rarity === rarity.value && styles.filterChipTextActive,
                    rarity.color && { color: rarity.color },
                  ]}
                >
                  {rarity.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sort Options */}
        {showSort && (
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Sort</Text>
            <View style={styles.filterChips}>
              {[
                { value: null, label: 'Default', icon: 'swap-vertical' },
                { value: 'streak', label: 'Streak', icon: 'flame' },
                { value: 'xp', label: 'XP', icon: 'star' },
                { value: 'name', label: 'Name', icon: 'text' },
              ].map((sort) => (
                <TouchableOpacity
                  key={sort.value || 'default'}
                  style={[
                    styles.filterChip,
                    filters.sortBy === sort.value && styles.filterChipActive,
                  ]}
                  onPress={() => handleFilterToggle('sortBy', sort.value)}
                >
                  {sort.icon && (
                    <Ionicons
                      name={sort.icon}
                      size={14}
                      color={
                        filters.sortBy === sort.value
                          ? COLORS.accent.primary
                          : COLORS.textSecondary
                      }
                      style={styles.filterChipIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.sortBy === sort.value && styles.filterChipTextActive,
                    ]}
                  >
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  filterGroup: {
    marginRight: 16,
  },
  filterGroupLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    color: COLORS.textTertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.elevated,
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
    ...createGlow(COLORS.glows.primary, 0.2),
  },
  filterChipArc: {
    borderWidth: 1.5,
  },
  filterChipRarity: {
    borderWidth: 1.5,
  },
  filterChipIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterChipIcon: {
    marginRight: 2,
  },
  filterChipText: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});

