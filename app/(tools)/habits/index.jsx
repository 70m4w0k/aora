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
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
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
  createArc,
  updateArc,
  deleteArc,
  createQuest,
  updateQuest,
  deleteQuest,
  getHouseholdTiers,
  createTier,
  updateTier,
  deleteTier,
  completeTier,
  QuestFrequencies,
  TargetTypes,
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
  const [tiers, setTiers] = useState([]);
  const [tierCompletions, setTierCompletions] = useState({}); // { tierId: completion }
  const [userProgress, setUserProgress] = useState(null);
  const [todayQuests, setTodayQuests] = useState([]);
  
  // Arc Modal
  const [arcModalVisible, setArcModalVisible] = useState(false);
  const [editingArc, setEditingArc] = useState(null);
  const [arcForm, setArcForm] = useState({
    name: '',
    color: '#8B5CF6',
    icon: '',
    description: '',
  });

  // Quest Modal
  const [questModalVisible, setQuestModalVisible] = useState(false);
  const [editingQuest, setEditingQuest] = useState(null);
  const [questForm, setQuestForm] = useState({
    name: '',
    arcId: '',
    frequency: QuestFrequencies.DAILY,
    repetitionPerPeriod: '1',
    intensity: '1',
    xpPerCompletion: '10',
    accessLevel: '',
  });

  // Tier Modal
  const [tierModalVisible, setTierModalVisible] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [tierForm, setTierForm] = useState({
    name: '',
    arcId: '',
    targetValue: '100',
    targetType: TargetTypes.DAYS,
    xpReward: '100',
    titleReward: '',
  });
  
  useEffect(() => {
    if (household?.$id && user?.$id) {
      fetchData();
    }
  }, [household?.$id, user?.$id]);

  const fetchData = async () => {
    if (!household?.$id || !user?.$id) return;
    
    setLoading(true);
    try {
      const [arcsData, questsData, tiersData, progressData] = await Promise.all([
        getHouseholdArcs(household.$id).catch(() => []),
        getHouseholdQuests(household.$id).catch(() => []),
        getHouseholdTiers(household.$id).catch(() => []),
        getUserProgress(user.$id, household.$id).catch(() => null),
      ]);
      
      setArcs(arcsData);
      setQuests(questsData);
      setTiers(tiersData);
      setUserProgress(progressData);
      
      // Fetch tier completions for current user
      const completionsMap = {};
      for (const tier of tiersData) {
        try {
          // Check if user has completed this tier
          // We'll need to add a function to check tier completions
          // For now, we'll calculate progress based on quest completions
          completionsMap[tier.$id] = null; // Will be calculated later
        } catch (error) {
          completionsMap[tier.$id] = null;
        }
      }
      setTierCompletions(completionsMap);
      
      // Filter today's quests
      // Show all quests for now (daily, weekly, monthly, annual, unique)
      // TODO: Add proper filtering logic based on frequency and date
      const todayQuestsFiltered = questsData.filter(quest => {
        // For now, show all quests except those that are explicitly filtered out
        // This ensures users can see their quests regardless of frequency
        return true;
      });
      setTodayQuests(todayQuestsFiltered);
      
      // Debug: Log quests to see what we're getting
      if (questsData.length > 0) {
        console.log('Total quests fetched:', questsData.length);
        console.log('Today quests filtered:', todayQuestsFiltered.length);
        questsData.forEach(q => {
          console.log(`Quest: "${q.name}", Frequency: "${q.frequency}", ArcId: ${typeof q.arcId === 'object' ? q.arcId.$id : q.arcId}`);
        });
      }
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

  // Arc Management
  const openArcModal = (arc = null) => {
    if (arc) {
      setEditingArc(arc);
      setArcForm({
        name: arc.name || '',
        color: arc.color || '#8B5CF6',
        icon: arc.icon || '',
        description: arc.description || '',
      });
    } else {
      setEditingArc(null);
      setArcForm({
        name: '',
        color: '#8B5CF6',
        icon: '',
        description: '',
      });
    }
    setArcModalVisible(true);
  };

  const closeArcModal = () => {
    setArcModalVisible(false);
    setEditingArc(null);
    setArcForm({
      name: '',
      color: '#8B5CF6',
      icon: '',
      description: '',
    });
  };

  const handleSaveArc = async () => {
    if (!arcForm.name.trim()) {
      Alert.alert('Error', 'Please enter an arc name');
      return;
    }

    try {
      if (editingArc) {
        await updateArc(editingArc.$id, {
          name: arcForm.name.trim(),
          color: arcForm.color,
          icon: arcForm.icon || null,
          description: arcForm.description.trim() || null,
        });
      } else {
        await createArc({
          name: arcForm.name.trim(),
          color: arcForm.color,
          icon: arcForm.icon || null,
          description: arcForm.description.trim() || null,
          householdId: household.$id,
          userId: user.$id,
        });
      }
      await fetchData();
      closeArcModal();
    } catch (error) {
      console.error('Error saving arc:', error);
      Alert.alert('Error', 'Could not save arc');
    }
  };

  const handleDeleteArc = (arc) => {
    Alert.alert(
      'Delete Arc',
      `Are you sure you want to delete "${arc.name}"? This will also delete all associated quests and tiers.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteArc(arc.$id);
              await fetchData();
            } catch (error) {
              console.error('Error deleting arc:', error);
              Alert.alert('Error', 'Could not delete arc');
            }
          },
        },
      ]
    );
  };

  // Quest Management
  const openQuestModal = (quest = null) => {
    if (quest) {
      setEditingQuest(quest);
      const arcId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
      setQuestForm({
        name: quest.name || '',
        arcId: arcId || '',
        frequency: quest.frequency || QuestFrequencies.DAILY,
        repetitionPerPeriod: quest.repetitionPerPeriod?.toString() || '1',
        intensity: quest.intensity?.toString() || '1',
        xpPerCompletion: quest.xpPerCompletion?.toString() || '10',
        accessLevel: quest.accessLevel?.toString() || '',
      });
    } else {
      setEditingQuest(null);
      setQuestForm({
        name: '',
        arcId: arcs.length > 0 ? arcs[0].$id : '',
        frequency: QuestFrequencies.DAILY,
        repetitionPerPeriod: '1',
        intensity: '1',
        xpPerCompletion: '10',
        accessLevel: '',
      });
    }
    setQuestModalVisible(true);
  };

  const closeQuestModal = () => {
    setQuestModalVisible(false);
    setEditingQuest(null);
    setQuestForm({
      name: '',
      arcId: arcs.length > 0 ? arcs[0].$id : '',
      frequency: QuestFrequencies.DAILY,
      repetitionPerPeriod: '1',
      intensity: '1',
      xpPerCompletion: '10',
      accessLevel: '',
    });
  };

  const handleSaveQuest = async () => {
    if (!questForm.name.trim()) {
      Alert.alert('Error', 'Please enter a quest name');
      return;
    }
    if (!questForm.arcId) {
      Alert.alert('Error', 'Please select an arc');
      return;
    }

    try {
      if (editingQuest) {
        await updateQuest(editingQuest.$id, {
          name: questForm.name.trim(),
          arcId: questForm.arcId,
          frequency: questForm.frequency,
          repetitionPerPeriod: parseInt(questForm.repetitionPerPeriod) || 1,
          intensity: parseInt(questForm.intensity) || 1,
          xpPerCompletion: parseInt(questForm.xpPerCompletion) || 10,
          accessLevel: questForm.accessLevel ? parseInt(questForm.accessLevel) : null,
        });
      } else {
        await createQuest({
          name: questForm.name.trim(),
          arcId: questForm.arcId,
          frequency: questForm.frequency,
          repetitionPerPeriod: parseInt(questForm.repetitionPerPeriod) || 1,
          intensity: parseInt(questForm.intensity) || 1,
          xpPerCompletion: parseInt(questForm.xpPerCompletion) || 10,
          accessLevel: questForm.accessLevel ? parseInt(questForm.accessLevel) : null,
          householdId: household.$id,
          userId: user.$id,
        });
      }
      await fetchData();
      closeQuestModal();
    } catch (error) {
      console.error('Error saving quest:', error);
      Alert.alert('Error', 'Could not save quest');
    }
  };

  const handleDeleteQuest = (quest) => {
    Alert.alert(
      'Delete Quest',
      `Are you sure you want to delete "${quest.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuest(quest.$id);
              await fetchData();
            } catch (error) {
              console.error('Error deleting quest:', error);
              Alert.alert('Error', 'Could not delete quest');
            }
          },
        },
      ]
    );
  };

  // Tier Management
  const openTierModal = (tier = null) => {
    if (tier) {
      setEditingTier(tier);
      setTierForm({
        name: tier.name || '',
        arcId: typeof tier.arcId === 'object' ? tier.arcId.$id : tier.arcId || '',
        targetValue: tier.targetValue?.toString() || '100',
        targetType: tier.targetType || TargetTypes.DAYS,
        xpReward: tier.xpReward?.toString() || '100',
        titleReward: tier.titleReward || '',
      });
    } else {
      setEditingTier(null);
      setTierForm({
        name: '',
        arcId: arcs.length > 0 ? arcs[0].$id : '',
        targetValue: '100',
        targetType: TargetTypes.DAYS,
        xpReward: '100',
        titleReward: '',
      });
    }
    setTierModalVisible(true);
  };

  const closeTierModal = () => {
    setTierModalVisible(false);
    setEditingTier(null);
    setTierForm({
      name: '',
      arcId: arcs.length > 0 ? arcs[0].$id : '',
      targetValue: '100',
      targetType: TargetTypes.DAYS,
      xpReward: '100',
      titleReward: '',
    });
  };

  const handleSaveTier = async () => {
    if (!tierForm.name.trim()) {
      Alert.alert('Error', 'Please enter a tier name');
      return;
    }
    if (!tierForm.arcId) {
      Alert.alert('Error', 'Please select an arc');
      return;
    }

    try {
      if (editingTier) {
        await updateTier(editingTier.$id, {
          name: tierForm.name.trim(),
          arcId: tierForm.arcId,
          targetValue: parseInt(tierForm.targetValue) || 100,
          targetType: tierForm.targetType,
          xpReward: parseInt(tierForm.xpReward) || 100,
          titleReward: tierForm.titleReward.trim() || null,
        });
      } else {
        await createTier({
          name: tierForm.name.trim(),
          arcId: tierForm.arcId,
          targetValue: parseInt(tierForm.targetValue) || 100,
          targetType: tierForm.targetType,
          xpReward: parseInt(tierForm.xpReward) || 100,
          titleReward: tierForm.titleReward.trim() || null,
          householdId: household.$id,
          userId: user.$id,
        });
      }
      await fetchData();
      closeTierModal();
    } catch (error) {
      console.error('Error saving tier:', error);
      Alert.alert('Error', 'Could not save tier');
    }
  };

  const handleDeleteTier = (tier) => {
    Alert.alert(
      'Delete Tier',
      `Are you sure you want to delete "${tier.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTier(tier.$id);
              await fetchData();
            } catch (error) {
              console.error('Error deleting tier:', error);
              Alert.alert('Error', 'Could not delete tier');
            }
          },
        },
      ]
    );
  };

  const handleCompleteTier = async (tier) => {
    try {
      const arcId = typeof tier.arcId === 'object' ? tier.arcId.$id : tier.arcId;
      await completeTier({
        tierId: tier.$id,
        userId: user.$id,
        householdId: household.$id,
        xpEarned: tier.xpReward || 100,
        arcId: arcId,
      });
      await fetchData();
      Alert.alert('Success', `Tier "${tier.name}" completed! +${tier.xpReward || 100} XP`);
    } catch (error) {
      console.error('Error completing tier:', error);
      Alert.alert('Error', 'Could not complete tier');
    }
  };

  // Calculate tier progress based on quest completions
  const getTierProgress = async (tier) => {
    if (!tier || !user?.$id) return { current: 0, target: tier?.targetValue || 100, percentage: 0 };
    
    try {
      const arcId = typeof tier.arcId === 'object' ? tier.arcId.$id : tier.arcId;
      const arcQuests = quests.filter(q => {
        const qArcId = typeof q.arcId === 'object' ? q.arcId.$id : q.arcId;
        return qArcId === arcId;
      });

      if (tier.targetType === TargetTypes.DAYS) {
        // Count unique days with quest completions
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - (tier.targetValue || 100));
        
        const completionDates = new Set();
        for (const quest of arcQuests) {
          try {
            const completions = await getQuestCompletions(quest.$id, user.$id, startDate.toISOString(), today.toISOString());
            completions.forEach(c => {
              const date = new Date(c.completedAt);
              completionDates.add(date.toDateString());
            });
          } catch (error) {
            // Skip if error
          }
        }
        return {
          current: completionDates.size,
          target: tier.targetValue || 100,
          percentage: Math.min((completionDates.size / (tier.targetValue || 100)) * 100, 100),
        };
      } else if (tier.targetType === TargetTypes.COUNT) {
        // Count total quest completions
        let totalCompletions = 0;
        for (const quest of arcQuests) {
          try {
            const completions = await getQuestCompletions(quest.$id, user.$id);
            totalCompletions += completions.length;
          } catch (error) {
            // Skip if error
          }
        }
        return {
          current: totalCompletions,
          target: tier.targetValue || 100,
          percentage: Math.min((totalCompletions / (tier.targetValue || 100)) * 100, 100),
        };
      }
      
      return { current: 0, target: tier.targetValue || 100, percentage: 0 };
    } catch (error) {
      console.error('Error calculating tier progress:', error);
      return { current: 0, target: tier.targetValue || 100, percentage: 0 };
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
            <TouchableOpacity style={styles.addButton} onPress={() => openArcModal()}>
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
                    onPress={() => openArcModal(arc)}
                    onLongPress={() => handleDeleteArc(arc)}
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
            <View style={styles.questHeaderRight}>
              <Text style={styles.questCount}>{todayQuests.length}</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => openQuestModal()}>
                <Ionicons name="add" size={20} color={COLORS.accent.primary} />
              </TouchableOpacity>
            </View>
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
                    onPress={() => openQuestModal(quest)}
                    onLongPress={() => handleDeleteQuest(quest)}
                  >
                    <View style={[styles.questIndicator, { backgroundColor: arc?.color || COLORS.accent.primary }]} />
                    <View style={styles.questContent}>
                      <Text style={styles.questName}>{quest.name}</Text>
                      <View style={styles.questMeta}>
                        <Text style={styles.questArc}>{arc?.name || 'Unassigned'}</Text>
                        <Text style={styles.questXP}>+{quest.xpPerCompletion || 10} XP</Text>
                      </View>
                    </View>
                    <View style={styles.questActions}>
                      <TouchableOpacity
                        style={styles.completeButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleCompleteQuest(quest);
                        }}
                      >
                        <Ionicons 
                          name={questCompletions[quest.$id] ? "checkmark-circle" : "checkmark-circle-outline"} 
                          size={24} 
                          color={questCompletions[quest.$id] ? COLORS.accent.success : COLORS.textTertiary} 
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Tiers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TIERS & MILESTONES</Text>
            <View style={styles.questHeaderRight}>
              <Text style={styles.questCount}>{tiers.length}</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => openTierModal()}>
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
                
                // Calculate progress (simplified - will be enhanced)
                const progress = { current: 0, target: tier.targetValue || 100, percentage: 0 };
                const isCompleted = tierCompletions[tier.$id] !== null && tierCompletions[tier.$id] !== undefined;
                
                return (
                  <TouchableOpacity
                    key={tier.$id}
                    style={styles.tierCard}
                    activeOpacity={0.7}
                    onPress={() => openTierModal(tier)}
                    onLongPress={() => handleDeleteTier(tier)}
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
                          {isCompleted ? 'Completed!' : `${progress.current} / ${progress.target} ${tier.targetType || 'days'}`}
                        </Text>
                      </View>
                    </View>
                    {!isCompleted && (
                      <TouchableOpacity
                        style={styles.tierCompleteButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleCompleteTier(tier);
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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Arc Management Modal */}
      <Modal
        visible={arcModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeArcModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeArcModal}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingArc ? 'Edit Arc' : 'Add Arc'}</Text>
              <TouchableOpacity onPress={handleSaveArc}>
                <Text style={styles.modalSaveText}>{editingArc ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Arc Name */}
              <Text style={[styles.inputLabel, { marginTop: 0 }]}>Arc Name</Text>
              <TextInput
                style={styles.input}
                value={arcForm.name}
                onChangeText={(text) => setArcForm({ ...arcForm, name: text })}
                placeholder="e.g., Mental, Physical, Finance"
                placeholderTextColor={COLORS.textTertiary}
                maxLength={100}
              />

              {/* Color Selection */}
              <Text style={styles.inputLabel}>Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
                {[
                  '#8B5CF6', '#F43F5E', '#06B6D4', '#22C55E', '#F59E0B',
                  '#EC4899', '#14B8A6', '#3B82F6', '#EF4444', '#10B981',
                ].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorChip,
                      arcForm.color === color && { borderColor: color, borderWidth: 2 },
                    ]}
                    onPress={() => setArcForm({ ...arcForm, color })}
                  >
                    <View style={[styles.colorChipInner, { backgroundColor: color }]} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Icon Selection */}
              <Text style={styles.inputLabel}>Icon (Optional)</Text>
              <TextInput
                style={styles.input}
                value={arcForm.icon}
                onChangeText={(text) => setArcForm({ ...arcForm, icon: text })}
                placeholder="e.g., fitness, meditation, wallet"
                placeholderTextColor={COLORS.textTertiary}
                maxLength={100}
              />
              <Text style={styles.inputHint}>
                Enter an Ionicons name (e.g., "fitness", "meditation", "wallet")
              </Text>

              {/* Description */}
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={arcForm.description}
                onChangeText={(text) => setArcForm({ ...arcForm, description: text })}
                placeholder="Describe this arc..."
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={3}
                maxLength={500}
              />

              {/* Delete Button (only when editing) */}
              {editingArc && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    closeArcModal();
                    handleDeleteArc(editingArc);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.accent.danger} />
                  <Text style={styles.deleteButtonText}>Delete Arc</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Quest Management Modal */}
      <Modal
        visible={questModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeQuestModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeQuestModal}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingQuest ? 'Edit Quest' : 'Add Quest'}</Text>
              <TouchableOpacity onPress={handleSaveQuest}>
                <Text style={styles.modalSaveText}>{editingQuest ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Quest Name */}
              <Text style={[styles.inputLabel, { marginTop: 0 }]}>Quest Name</Text>
              <TextInput
                style={styles.input}
                value={questForm.name}
                onChangeText={(text) => setQuestForm({ ...questForm, name: text })}
                placeholder="e.g., Meditate 1x per day, Run 4x per week"
                placeholderTextColor={COLORS.textTertiary}
                maxLength={200}
              />

              {/* Arc Selection */}
              <Text style={styles.inputLabel}>Arc</Text>
              {arcs.length === 0 ? (
                <View style={styles.emptyArcWarning}>
                  <Ionicons name="alert-circle-outline" size={20} color={COLORS.accent.warning} />
                  <Text style={styles.emptyArcWarningText}>Create an arc first</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.arcChipsScroll}>
                  {arcs.map((arc) => (
                    <TouchableOpacity
                      key={arc.$id}
                      style={[
                        styles.arcChip,
                        questForm.arcId === arc.$id && { backgroundColor: `${arc.color || COLORS.accent.primary}20`, borderColor: arc.color || COLORS.accent.primary },
                      ]}
                      onPress={() => setQuestForm({ ...questForm, arcId: arc.$id })}
                    >
                      <View style={[styles.arcChipIndicator, { backgroundColor: arc.color || COLORS.accent.primary }]} />
                      <Text style={[
                        styles.arcChipText,
                        questForm.arcId === arc.$id && { color: COLORS.textPrimary },
                      ]}>
                        {arc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Frequency */}
              <Text style={styles.inputLabel}>Frequency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.frequencyScroll}>
                {Object.entries({
                  [QuestFrequencies.DAILY]: 'Daily',
                  [QuestFrequencies.WEEKLY]: 'Weekly',
                  [QuestFrequencies.MONTHLY]: 'Monthly',
                  [QuestFrequencies.ANNUAL]: 'Annual',
                  [QuestFrequencies.UNIQUE]: 'Unique',
                }).map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.frequencyChip,
                      questForm.frequency === value && styles.frequencyChipActive,
                    ]}
                    onPress={() => setQuestForm({ ...questForm, frequency: value })}
                  >
                    <Text style={[
                      styles.frequencyChipText,
                      questForm.frequency === value && styles.frequencyChipTextActive,
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Repetition Per Period */}
              <Text style={styles.inputLabel}>Repetition Per Period</Text>
              <TextInput
                style={styles.input}
                value={questForm.repetitionPerPeriod}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  setQuestForm({ ...questForm, repetitionPerPeriod: Math.max(1, num).toString() });
                }}
                placeholder="e.g., 3 (for 3x per week)"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numeric"
              />
              <Text style={styles.inputHint}>
                How many times per period (e.g., 3 for "3x per week")
              </Text>

              {/* Intensity/Difficulty */}
              <Text style={styles.inputLabel}>Intensity / Difficulty (1-5)</Text>
              <View style={styles.intensityContainer}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.intensityButton,
                      parseInt(questForm.intensity) === level && styles.intensityButtonActive,
                    ]}
                    onPress={() => setQuestForm({ ...questForm, intensity: level.toString() })}
                  >
                    <Text style={[
                      styles.intensityButtonText,
                      parseInt(questForm.intensity) === level && styles.intensityButtonTextActive,
                    ]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* XP Per Completion */}
              <Text style={styles.inputLabel}>XP Per Completion</Text>
              <TextInput
                style={styles.input}
                value={questForm.xpPerCompletion}
                onChangeText={(text) => {
                  const num = parseInt(text) || 10;
                  setQuestForm({ ...questForm, xpPerCompletion: Math.max(1, num).toString() });
                }}
                placeholder="10"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numeric"
              />

              {/* Access Level (Optional) */}
              <Text style={styles.inputLabel}>Access Level (Optional)</Text>
              <TextInput
                style={styles.input}
                value={questForm.accessLevel}
                onChangeText={(text) => setQuestForm({ ...questForm, accessLevel: text })}
                placeholder="Leave empty if no requirement"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numeric"
              />

              {/* Delete Button (only when editing) */}
              {editingQuest && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    closeQuestModal();
                    handleDeleteQuest(editingQuest);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.accent.danger} />
                  <Text style={styles.deleteButtonText}>Delete Quest</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Tier Management Modal */}
      <Modal
        visible={tierModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeTierModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeTierModal}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingTier ? 'Edit Tier' : 'Add Tier'}</Text>
              <TouchableOpacity onPress={handleSaveTier}>
                <Text style={styles.modalSaveText}>{editingTier ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Tier Name */}
              <Text style={[styles.inputLabel, { marginTop: 0 }]}>Tier Name</Text>
              <TextInput
                style={styles.input}
                value={tierForm.name}
                onChangeText={(text) => setTierForm({ ...tierForm, name: text })}
                placeholder="e.g., 100 days of meditation, Run a marathon"
                placeholderTextColor={COLORS.textTertiary}
                maxLength={200}
              />

              {/* Arc Selection */}
              <Text style={styles.inputLabel}>Assign to Arc</Text>
              {arcs.length === 0 ? (
                <View style={styles.emptyArcWarning}>
                  <Ionicons name="alert-circle-outline" size={20} color={COLORS.accent.warning} />
                  <Text style={styles.emptyArcWarningText}>Create an arc first</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.arcChipsScroll}>
                  {arcs.map((arc) => (
                    <TouchableOpacity
                      key={arc.$id}
                      style={[
                        styles.arcChip,
                        tierForm.arcId === arc.$id && { backgroundColor: `${arc.color || COLORS.accent.primary}20`, borderColor: arc.color || COLORS.accent.primary },
                      ]}
                      onPress={() => setTierForm({ ...tierForm, arcId: arc.$id })}
                    >
                      <View style={[styles.arcChipIndicator, { backgroundColor: arc.color || COLORS.accent.primary }]} />
                      <Text style={[
                        styles.arcChipText,
                        tierForm.arcId === arc.$id && { color: COLORS.textPrimary },
                      ]}>
                        {arc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Target Type */}
              <Text style={styles.inputLabel}>Target Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.frequencyScroll}>
                {Object.entries({
                  [TargetTypes.DAYS]: 'Days',
                  [TargetTypes.COUNT]: 'Count',
                  [TargetTypes.AMOUNT]: 'Amount',
                }).map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.frequencyChip,
                      tierForm.targetType === value && styles.frequencyChipSelected,
                    ]}
                    onPress={() => setTierForm({ ...tierForm, targetType: value })}
                  >
                    <Text style={[
                      styles.frequencyChipText,
                      tierForm.targetType === value && styles.frequencyChipTextSelected,
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Target Value */}
              <Text style={styles.inputLabel}>Target Value</Text>
              <TextInput
                style={styles.input}
                value={tierForm.targetValue}
                onChangeText={(text) => {
                  const num = parseInt(text) || 100;
                  setTierForm({ ...tierForm, targetValue: Math.max(1, num).toString() });
                }}
                placeholder="e.g., 100 (for 100 days)"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numeric"
              />
              <Text style={styles.inputHint}>
                The target value to achieve (e.g., 100 for "100 days")
              </Text>

              {/* XP Reward */}
              <Text style={styles.inputLabel}>XP Reward</Text>
              <TextInput
                style={styles.input}
                value={tierForm.xpReward}
                onChangeText={(text) => {
                  const num = parseInt(text) || 100;
                  setTierForm({ ...tierForm, xpReward: Math.max(1, num).toString() });
                }}
                placeholder="100"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numeric"
              />

              {/* Title Reward (Optional) */}
              <Text style={styles.inputLabel}>Title Reward (Optional)</Text>
              <TextInput
                style={styles.input}
                value={tierForm.titleReward}
                onChangeText={(text) => setTierForm({ ...tierForm, titleReward: text })}
                placeholder="e.g., Master Meditator"
                placeholderTextColor={COLORS.textTertiary}
                maxLength={100}
              />
              <Text style={styles.inputHint}>
                Optional class title unlocked when tier is achieved
              </Text>

              {/* Delete Button (only when editing) */}
              {editingTier && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    closeTierModal();
                    handleDeleteTier(editingTier);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.accent.danger} />
                  <Text style={styles.deleteButtonText}>Delete Tier</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  questHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  questActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Tier Styles
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
  // Quest Modal Styles
  arcChipsScroll: {
    marginBottom: 8,
  },
  arcChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    gap: 6,
  },
  arcChipIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  arcChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  frequencyScroll: {
    marginBottom: 8,
  },
  frequencyChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  frequencyChipActive: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
  },
  frequencyChipSelected: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
  },
  frequencyChipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  frequencyChipTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  frequencyChipTextSelected: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityButtonActive: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
  },
  intensityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  intensityButtonTextActive: {
    color: COLORS.textPrimary,
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
  emptyStateSmall: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  emptyStateTextSmall: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent.primary,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textTertiary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  colorScroll: {
    marginBottom: 8,
  },
  colorChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorChipInner: {
    flex: 1,
    borderRadius: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${COLORS.accent.danger}15`,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: `${COLORS.accent.danger}30`,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.accent.danger,
  },
  emptyArcWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: `${COLORS.accent.warning}15`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.accent.warning}30`,
  },
  emptyArcWarningText: {
    fontSize: 13,
    color: COLORS.accent.warning,
    fontWeight: '500',
  },
});

export default HabitsTracker;
