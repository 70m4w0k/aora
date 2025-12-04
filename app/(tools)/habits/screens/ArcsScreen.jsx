import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants';
import ArcsSection from '../components/ArcsSection';

/**
 * Arcs Screen
 * Arc management and details
 */
export default function ArcsScreen({
  refreshing,
  onRefresh,
  arcs,
  quests,
  userProgress,
  getArcProgress,
  handlers,
}) {

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Arcs</Text>
        <Text style={styles.subtitle}>{arcs.length} arcs</Text>
      </View>

      <ArcsSection
        arcs={arcs}
        quests={quests}
        userProgress={userProgress}
        getArcProgress={getArcProgress}
        onAddArc={() => handlers.openArcModal()}
        onArcPress={(arc) => handlers.openArcDetailModal(arc)}
        onArcLongPress={(arc) => handlers.handleDeleteArc(arc)}
      />

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.title,
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

