import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useGlobalContext } from '../../../context/GlobalProvider';
import {
  getHouseholdArcs,
  getHouseholdQuests,
  getQuestCompletions,
  getUserProgress,
  completeQuest,
  QuestFrequencies,
  calculateLevel,
  getXPForNextLevel,
  getTotalXPForLevel,
} from '../../../lib/appwrite';

// Dark theme colors - consistent with app
const COLORS = {
  background: '#0A0A0C',
  surface: '#111114',
  card: '#1A1A1F',
  elevated: '#222228',
  border: 'rgba(255,255,255,0.1)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  accent: {
    primary: '#8B5CF6',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
};

const HabitsTracker = () => {
  const { user, household } = useGlobalContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data
  const [arcs, setArcs] = useState([]);
  const [quests, setQuests] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [todayQuests, setTodayQuests] = useState([]);
  
  useEffect(() => {
    if (household?.$id && user?.$id) {
      fetchData();
    }
  }, [household?.$id, user?.$id]);

  const fetchData = async () => {
    if (!household?.$id || !user?.$id) return;
    
    setLoading(true);
    try {
      const [arcsData, questsData, progressData] = await Promise.all([
        getHouseholdArcs(household.$id).catch(() => []),
        getHouseholdQuests(household.$id).catch(() => []),
        getUserProgress(user.$id, household.$id).catch(() => null),
      ]);
      
      setArcs(arcsData);
      setQuests(questsData);
      setUserProgress(progressData);
      
      // Filter today's quests
      const today = new Date();
      const todayQuestsFiltered = questsData.filter(quest => {
        if (quest.frequency === QuestFrequencies.DAILY) return true;
        // TODO: Add logic for weekly/monthly quests
        return false;
      });
      setTodayQuests(todayQuestsFiltered);
    } catch (error) {
      console.error('Error fetching habits data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleCompleteQuest = async (quest) => {
    try {
      const arcId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
      await completeQuest({
        questId: quest.$id,
        userId: user.$id,
        householdId: household.$id,
        xpEarned: quest.xpPerCompletion || 10,
        arcId: arcId,
        streakCount: 1, // TODO: Calculate actual streak
      });
      await fetchData();
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  const getArcProgress = (arcId) => {
    if (!userProgress || !userProgress.arcProgress) return { totalXP: 0, level: 1 };
    
    try {
      const arcProgressData = typeof userProgress.arcProgress === 'string' 
        ? JSON.parse(userProgress.arcProgress) 
        : userProgress.arcProgress;
      return arcProgressData[arcId] || { totalXP: 0, level: 1 };
    } catch (e) {
      return { totalXP: 0, level: 1 };
    }
  };

  const [questCompletions, setQuestCompletions] = useState({});

  useEffect(() => {
    if (todayQuests.length > 0 && user?.$id) {
      checkTodayCompletions();
    }
  }, [todayQuests, user?.$id]);

  const checkTodayCompletions = async () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    
    const completionsMap = {};
    for (const quest of todayQuests) {
      try {
        const completions = await getQuestCompletions(quest.$id, user.$id, startOfDay, endOfDay);
        completionsMap[quest.$id] = completions.length > 0;
      } catch (error) {
        completionsMap[quest.$id] = false;
      }
    }
    setQuestCompletions(completionsMap);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>NEOSYSTEM</Text>
            <Text style={styles.headerSubtitle}>Habits Tracker</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, Platform.OS === 'android' && styles.headerAndroid]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>NEOSYSTEM</Text>
          <Text style={styles.headerSubtitle}>Habits Tracker</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent.primary} />
        }
      >
        {/* Global Progress Card */}
        {userProgress && (
          <View style={styles.globalProgressCard}>
            <View style={styles.globalProgressHeader}>
              <View>
                <Text style={styles.globalProgressLabel}>Level</Text>
                <Text style={styles.globalLevel}>{userProgress.globalLevel || 1}</Text>
              </View>
              <View style={styles.xpContainer}>
                <Text style={styles.globalProgressLabel}>Total XP</Text>
                <Text style={styles.globalXP}>{userProgress.totalXP || 0}</Text>
              </View>
            </View>
            <View style={styles.xpBarContainer}>
              {(() => {
                const currentLevel = userProgress.globalLevel || 1;
                const currentXP = userProgress.totalXP || 0;
                const progressionType = userProgress.progressionType || 'progressive';
                const xpForNextLevel = getXPForNextLevel(currentLevel, progressionType);
                const xpForCurrentLevel = getTotalXPForLevel(currentLevel, progressionType);
                const xpInCurrentLevel = Math.max(0, currentXP - xpForCurrentLevel);
                const progressPercent = Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100);
                
                return (
                  <>
                    <View style={styles.xpBarBackground}>
                      <View 
                        style={[
                          styles.xpBarFill, 
                          { width: `${progressPercent}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.xpBarText}>
                      {Math.floor(xpInCurrentLevel)} / {xpForNextLevel} XP to level {currentLevel + 1}
                    </Text>
                  </>
                );
              })()}
            </View>
          </View>
        )}

        {/* Arcs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ARCS</Text>
            <TouchableOpacity style={styles.addButton}>
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
                const arcQuests = quests.filter(q => {
                  const qArcId = typeof q.arcId === 'object' ? q.arcId.$id : q.arcId;
                  return qArcId === arc.$id;
                });
                
                return (
                  <TouchableOpacity
                    key={arc.$id}
                    style={[styles.arcCard, { borderLeftColor: arc.color || COLORS.accent.primary }]}
                    activeOpacity={0.8}
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
                          Level {progress.level} • {arcQuests.length} quests
                        </Text>
                      </View>
                    </View>
                    <View style={styles.arcProgressBar}>
                      <View 
                        style={[
                          styles.arcProgressFill, 
                          { 
                            width: `${Math.min((progress.totalXP % 100) / 100 * 100, 100)}%`,
                            backgroundColor: arc.color || COLORS.accent.primary,
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.arcXP}>{progress.totalXP} XP</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Today's Quests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S QUESTS</Text>
            <Text style={styles.questCount}>{todayQuests.length}</Text>
          </View>
          
          {todayQuests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyStateText}>No quests for today</Text>
              <Text style={styles.emptyStateSubtext}>Create quests to start tracking</Text>
            </View>
          ) : (
            <View style={styles.questsList}>
              {todayQuests.slice(0, 5).map((quest) => {
                const arc = arcs.find(a => {
                  const aId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
                  return a.$id === aId;
                });
                
                return (
                  <TouchableOpacity
                    key={quest.$id}
                    style={styles.questCard}
                    activeOpacity={0.7}
                    onPress={() => handleCompleteQuest(quest)}
                  >
                    <View style={[styles.questIndicator, { backgroundColor: arc?.color || COLORS.accent.primary }]} />
                    <View style={styles.questContent}>
                      <Text style={styles.questName}>{quest.name}</Text>
                      <View style={styles.questMeta}>
                        <Text style={styles.questArc}>{arc?.name || 'Unassigned'}</Text>
                        <Text style={styles.questXP}>+{quest.xpPerCompletion || 10} XP</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={() => handleCompleteQuest(quest)}
                    >
                      <Ionicons 
                        name={questCompletions[quest.$id] ? "checkmark-circle" : "checkmark-circle-outline"} 
                        size={24} 
                        color={questCompletions[quest.$id] ? COLORS.accent.success : COLORS.textTertiary} 
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerAndroid: {
    paddingTop: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  // Global Progress
  globalProgressCard: {
    backgroundColor: COLORS.card,
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 20,
  },
  globalProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  globalProgressLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  globalLevel: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.accent.primary,
  },
  xpContainer: {
    alignItems: 'flex-end',
  },
  globalXP: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  xpBarContainer: {
    marginTop: 8,
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: COLORS.elevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent.primary,
    borderRadius: 4,
  },
  xpBarText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  // Sections
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
  questCount: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  // Arcs Grid
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
  // Quests List
  questsList: {
    gap: 8,
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  questIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  questContent: {
    flex: 1,
  },
  questName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  questMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questArc: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  questXP: {
    fontSize: 12,
    color: COLORS.accent.success,
    fontWeight: '600',
  },
  completeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty States
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
});

export default HabitsTracker;
