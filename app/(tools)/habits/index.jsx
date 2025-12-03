import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  Animated,
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
  ProgressionTypes,
  calculateLevel,
  getXPForNextLevel,
  getTotalXPForLevel,
  updateProgressionType,
  calculateMissedRecurrences,
  calculatePenaltyXP,
  togglePenaltySystem,
  overridePenalty,
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
  const [tierProgress, setTierProgress] = useState({}); // { tierId: { current, target, percentage } }
  const [userProgress, setUserProgress] = useState(null);
  const [todayQuests, setTodayQuests] = useState([]);
  const [statistics, setStatistics] = useState(null); // { arcStats, weeklySummary, monthlySummary, trends }
  const [questPenalties, setQuestPenalties] = useState({}); // { questId: { missedRecurrences, penaltyXP } }
  
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
  const [questModalTab, setQuestModalTab] = useState('details'); // 'details', 'history', 'stats'
  const [questCompletionsHistory, setQuestCompletionsHistory] = useState([]);
  const [questStats, setQuestStats] = useState(null);
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

  // Settings Modal
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // Custom Alert Modal
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', buttons: [] });

  // Level Up Modal
  const [levelUpModalVisible, setLevelUpModalVisible] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ type: null, level: null, xpEarned: null, arc: null });

  // XP Notification
  const [xpNotification, setXpNotification] = useState(null);
  const xpAnim = useRef(new Animated.Value(0)).current;
  const xpScale = useRef(new Animated.Value(0)).current;
  
  // XP Bar Pulse Animation
  const xpBarPulse = useRef(new Animated.Value(1)).current;
  
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
      
      // Initialize with default values for immediate UI render
      const completionsMap = {};
      const progressMap = {};
      const streaksMap = {};
      
      for (const tier of tiersData) {
        completionsMap[tier.$id] = null;
        progressMap[tier.$id] = { current: 0, target: tier.targetValue || 100, percentage: 0 };
      }
      
      for (const quest of questsData) {
        streaksMap[quest.$id] = 0;
      }
      
      setTierCompletions(completionsMap);
      setTierProgress(progressMap);
      setQuestStreaks(streaksMap);
      
      // Filter today's quests (simplified - show all for now, filter async)
      setTodayQuests(questsData);
      
      // Set loading to false to show UI immediately
      setLoading(false);
      
      // Load detailed data in background (non-blocking)
      loadDetailedData(arcsData, questsData, tiersData, user.$id);
      
    } catch (error) {
      console.error('Error fetching habits data:', error);
      setLoading(false);
    }
  };

  // Load detailed data in background (non-blocking)
  const loadDetailedData = async (arcsData, questsData, tiersData, userId) => {
    try {
      // Parallelize all calculations
      const [
        tierProgressResults,
        todayQuestsFiltered,
        questStreaksResults,
      ] = await Promise.all([
        // Calculate tier progress in parallel
        Promise.all(
          tiersData.map(async (tier) => {
            try {
              const progress = await getTierProgress(tier, questsData, userId);
              return { tierId: tier.$id, progress };
            } catch (error) {
              return { tierId: tier.$id, progress: { current: 0, target: tier.targetValue || 100, percentage: 0 } };
            }
          })
        ),
        // Filter today's quests
        filterQuestsForToday(questsData, userId),
        // Calculate streaks in parallel (limit concurrent requests)
        Promise.all(
          questsData.map(async (quest) => {
            try {
              const streak = await calculateQuestStreak(quest, userId);
              return { questId: quest.$id, streak };
            } catch (error) {
              return { questId: quest.$id, streak: 0 };
            }
          })
        ),
      ]);
      
      // Update state with calculated values
      const progressMap = {};
      tierProgressResults.forEach(({ tierId, progress }) => {
        progressMap[tierId] = progress;
      });
      setTierProgress(progressMap);
      
      setTodayQuests(todayQuestsFiltered);
      
      const streaksMap = {};
      questStreaksResults.forEach(({ questId, streak }) => {
        streaksMap[questId] = streak;
      });
      setQuestStreaks(streaksMap);
      
      // Calculate statistics in background (can be slow)
      setTimeout(async () => {
        try {
          const stats = await calculateStatistics(arcsData, questsData, userId);
          setStatistics(stats);
        } catch (error) {
          console.error('Error calculating statistics:', error);
        }
      }, 100);
    } catch (error) {
      console.error('Error loading detailed data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Custom Alert Function
  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => {} }]) => {
    setAlertData({ title, message, buttons });
    setAlertModalVisible(true);
  };

  // Show Level Up Modal
  const showLevelUp = (type, level, xpEarned, arc = null) => {
    setLevelUpData({ type, level, xpEarned, arc });
    setLevelUpModalVisible(true);
  };

  // Show XP Notification
  const showXPNotification = (xp, arcColor = null) => {
    setXpNotification({ xp, arcColor });
    
    // Reset animations
    xpAnim.setValue(0);
    xpScale.setValue(0);
    
    // Animate scale (pop in)
    Animated.spring(xpScale, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
    
    // Animate upward and fade out
    Animated.parallel([
      Animated.timing(xpAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(xpScale, {
          toValue: 0.8,
          duration: 1700,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Reset after animation
      setXpNotification(null);
      xpAnim.setValue(0);
      xpScale.setValue(0);
    });
    
    // Pulse XP bar
    Animated.sequence([
      Animated.timing(xpBarPulse, {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(xpBarPulse, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCompleteQuest = async (quest) => {
    try {
      const arcId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
      const xpEarned = quest.xpPerCompletion || 10;
      
      // Calculate current streak before completion
      const currentStreak = await calculateQuestStreak(quest, user.$id);
      
      // Check if quest was already completed today
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      let newStreak = currentStreak;
      
      try {
        const todayCompletions = await getQuestCompletions(
          quest.$id, 
          user.$id, 
          startOfDay.toISOString(), 
          endOfDay.toISOString()
        );
        
        // If not completed today, this completion will extend the streak
        if (todayCompletions.length === 0) {
          newStreak = currentStreak + 1;
        } else {
          // Already completed today, keep current streak (don't increment)
          newStreak = currentStreak;
        }
      } catch (error) {
        // If error checking, assume not completed today and increment
        newStreak = currentStreak + 1;
      }
      
      // Get current progress before completion
      const currentProgress = await getUserProgress(user.$id, household.$id);
      const oldLevel = currentProgress?.globalLevel || 1;
      const oldArcProgress = currentProgress?.arcProgress ? 
        (typeof currentProgress.arcProgress === 'string' ? JSON.parse(currentProgress.arcProgress) : currentProgress.arcProgress) : {};
      const oldArcLevel = arcId && oldArcProgress[arcId] ? oldArcProgress[arcId].level : 1;
      
      // Calculate missed recurrences and penalty if penalty system is active
      let penaltyXP = 0;
      if (currentProgress?.penaltySystemActive) {
        try {
          const allCompletions = await getQuestCompletions(quest.$id, user.$id);
          const missedRecurrences = calculateMissedRecurrences(quest, allCompletions);
          penaltyXP = calculatePenaltyXP(quest, missedRecurrences);
        } catch (error) {
          console.error('Error calculating penalty:', error);
        }
      }
      
      await completeQuest({
        questId: quest.$id,
        userId: user.$id,
        householdId: household.$id,
        xpEarned: xpEarned,
        arcId: arcId,
        streakCount: newStreak,
        penaltyXP: penaltyXP,
      });
      
      // Fetch updated progress
      const updatedProgress = await getUserProgress(user.$id, household.$id);
      const newLevel = updatedProgress?.globalLevel || 1;
      const newArcProgress = updatedProgress?.arcProgress ? 
        (typeof updatedProgress.arcProgress === 'string' ? JSON.parse(updatedProgress.arcProgress) : updatedProgress.arcProgress) : {};
      const newArcLevel = arcId && newArcProgress[arcId] ? newArcProgress[arcId].level : 1;
      
      // Show XP notification
      const arc = arcs.find(a => a.$id === arcId);
      showXPNotification(xpEarned, arc?.color);
      
      // Check for level-ups
      if (newLevel > oldLevel) {
        setTimeout(() => {
          showLevelUp('global', newLevel, xpEarned, null);
        }, 500);
      } else if (arcId && newArcLevel > oldArcLevel) {
        setTimeout(() => {
          showLevelUp('arc', newArcLevel, xpEarned, arc);
        }, 500);
      }
      
      await fetchData();
      
      // Update tier progress for affected tiers
      const affectedTiers = tiers.filter(t => {
        const tArcId = typeof t.arcId === 'object' ? t.arcId.$id : t.arcId;
        return tArcId === arcId;
      });
      
      const updatedProgressMap = { ...tierProgress };
      for (const tier of affectedTiers) {
        try {
          const progress = await getTierProgress(tier);
          updatedProgressMap[tier.$id] = progress;
        } catch (error) {
          // Keep existing progress on error
        }
      }
      setTierProgress(updatedProgressMap);
    } catch (error) {
      console.error('Error completing quest:', error);
      showAlert('Error', 'Could not complete quest', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
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
      showAlert('Error', 'Please enter an arc name', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
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
      showAlert('Error', 'Could not save arc', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
    }
  };

  const handleDeleteArc = (arc) => {
    showAlert(
      'Delete Arc',
      `Are you sure you want to delete "${arc.name}"? This will also delete all associated quests and tiers.`,
      [
        { text: 'Cancel', onPress: () => setAlertModalVisible(false) },
        {
          text: 'Delete',
          onPress: async () => {
            setAlertModalVisible(false);
            try {
              await deleteArc(arc.$id);
              await fetchData();
            } catch (error) {
              console.error('Error deleting arc:', error);
              showAlert('Error', 'Could not delete arc', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
            }
          },
        },
      ]
    );
  };

  // Quest Management
  const openQuestModal = async (quest = null) => {
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
      
      // Load completion history and stats
      try {
        const completions = await getQuestCompletions(quest.$id, user.$id);
        setQuestCompletionsHistory(completions.sort((a, b) => {
          const dateA = new Date(a.completedAt || a.$createdAt);
          const dateB = new Date(b.completedAt || b.$createdAt);
          return dateB - dateA;
        }));
        
        // Calculate stats
        const currentStreak = await calculateQuestStreak(quest, user.$id);
        const totalCompletions = completions.length;
        const totalXP = completions.reduce((sum, c) => sum + (c.xpEarned || quest.xpPerCompletion || 10), 0);
        const firstCompletion = completions.length > 0 ? new Date(completions[completions.length - 1].completedAt || completions[completions.length - 1].$createdAt) : null;
        const lastCompletion = completions.length > 0 ? new Date(completions[0].completedAt || completions[0].$createdAt) : null;
        
        // Calculate best streak
        let bestStreak = 0;
        let currentStreakCount = 0;
        const sortedCompletions = [...completions].sort((a, b) => {
          const dateA = new Date(a.completedAt || a.$createdAt);
          const dateB = new Date(b.completedAt || b.$createdAt);
          return dateA - dateB;
        });
        
        for (let i = 0; i < sortedCompletions.length; i++) {
          if (i === 0) {
            currentStreakCount = 1;
          } else {
            const prevDate = new Date(sortedCompletions[i - 1].completedAt || sortedCompletions[i - 1].$createdAt);
            const currDate = new Date(sortedCompletions[i].completedAt || sortedCompletions[i].$createdAt);
            const daysDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff <= 1) {
              currentStreakCount++;
            } else {
              bestStreak = Math.max(bestStreak, currentStreakCount);
              currentStreakCount = 1;
            }
          }
        }
        bestStreak = Math.max(bestStreak, currentStreakCount);
        
        setQuestStats({
          totalCompletions,
          totalXP,
          currentStreak,
          bestStreak,
          firstCompletion,
          lastCompletion,
        });
      } catch (error) {
        console.error('Error loading quest history:', error);
        setQuestCompletionsHistory([]);
        setQuestStats(null);
      }
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
      setQuestCompletionsHistory([]);
      setQuestStats(null);
    }
    setQuestModalTab('details');
    setQuestModalVisible(true);
  };

  const closeQuestModal = () => {
    setQuestModalVisible(false);
    setEditingQuest(null);
    setQuestModalTab('details');
    setQuestCompletionsHistory([]);
    setQuestStats(null);
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
      showAlert('Error', 'Please enter a quest name', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
      return;
    }
    if (!questForm.arcId) {
      showAlert('Error', 'Please select an arc', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
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
      showAlert('Error', 'Could not save quest', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
    }
  };

  const handleDeleteQuest = (quest) => {
    showAlert(
      'Delete Quest',
      `Are you sure you want to delete "${quest.name}"?`,
      [
        { text: 'Cancel', onPress: () => setAlertModalVisible(false) },
        {
          text: 'Delete',
          onPress: async () => {
            setAlertModalVisible(false);
            try {
              await deleteQuest(quest.$id);
              await fetchData();
            } catch (error) {
              console.error('Error deleting quest:', error);
              showAlert('Error', 'Could not delete quest', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
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
      showAlert('Error', 'Please enter a tier name', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
      return;
    }
    if (!tierForm.arcId) {
      showAlert('Error', 'Please select an arc', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
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
      showAlert('Error', 'Could not save tier', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
    }
  };

  const handleDeleteTier = (tier) => {
    showAlert(
      'Delete Tier',
      `Are you sure you want to delete "${tier.name}"?`,
      [
        { text: 'Cancel', onPress: () => setAlertModalVisible(false) },
        {
          text: 'Delete',
          onPress: async () => {
            setAlertModalVisible(false);
            try {
              await deleteTier(tier.$id);
              await fetchData();
            } catch (error) {
              console.error('Error deleting tier:', error);
              showAlert('Error', 'Could not delete tier', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
            }
          },
        },
      ]
    );
  };

  const handleCompleteTier = async (tier) => {
    try {
      const arcId = typeof tier.arcId === 'object' ? tier.arcId.$id : tier.arcId;
      const xpEarned = tier.xpReward || 100;
      
      // Get current progress before completion
      const currentProgress = await getUserProgress(user.$id, household.$id);
      const oldLevel = currentProgress?.globalLevel || 1;
      const oldArcProgress = currentProgress?.arcProgress ? 
        (typeof currentProgress.arcProgress === 'string' ? JSON.parse(currentProgress.arcProgress) : currentProgress.arcProgress) : {};
      const oldArcLevel = arcId && oldArcProgress[arcId] ? oldArcProgress[arcId].level : 1;
      
      await completeTier({
        tierId: tier.$id,
        userId: user.$id,
        householdId: household.$id,
        xpEarned: xpEarned,
        arcId: arcId,
      });
      
      // Fetch updated progress
      const updatedProgress = await getUserProgress(user.$id, household.$id);
      const newLevel = updatedProgress?.globalLevel || 1;
      const newArcProgress = updatedProgress?.arcProgress ? 
        (typeof updatedProgress.arcProgress === 'string' ? JSON.parse(updatedProgress.arcProgress) : updatedProgress.arcProgress) : {};
      const newArcLevel = arcId && newArcProgress[arcId] ? newArcProgress[arcId].level : 1;
      
      // Show XP notification
      const arc = arcs.find(a => a.$id === arcId);
      showXPNotification(xpEarned, arc?.color);
      
      // Check for level-ups
      if (newLevel > oldLevel) {
        setTimeout(() => {
          showLevelUp('global', newLevel, xpEarned, null);
        }, 500);
      } else if (arcId && newArcLevel > oldArcLevel) {
        setTimeout(() => {
          showLevelUp('arc', newArcLevel, xpEarned, arc);
        }, 500);
      }
      
      await fetchData();
    } catch (error) {
      console.error('Error completing tier:', error);
      showAlert('Error', 'Could not complete tier', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
    }
  };

  // Calculate tier progress based on quest completions
  const getTierProgress = async (tier) => {
    if (!tier || !user?.$id || !quests.length) {
      return { current: 0, target: tier?.targetValue || 100, percentage: 0 };
    }
    
    try {
      const arcId = typeof tier.arcId === 'object' ? tier.arcId.$id : tier.arcId;
      const arcQuests = quests.filter(q => {
        const qArcId = typeof q.arcId === 'object' ? q.arcId.$id : q.arcId;
        return qArcId === arcId;
      });

      if (arcQuests.length === 0) {
        return { current: 0, target: tier.targetValue || 100, percentage: 0 };
      }

      if (tier.targetType === TargetTypes.DAYS) {
        // Count unique days with quest completions within the target period
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - (tier.targetValue || 100));
        startDate.setHours(0, 0, 0, 0);
        
        // Fetch all quest completions in parallel
        const questCompletionsData = await Promise.all(
          arcQuests.map(async (quest) => {
            try {
              return await getQuestCompletions(
                quest.$id, 
                user.$id, 
                startDate.toISOString(), 
                today.toISOString()
              );
            } catch (error) {
              return [];
            }
          })
        );
        
        const completionDates = new Set();
        questCompletionsData.forEach(completions => {
          completions.forEach(c => {
            const completionDate = new Date(c.completedAt || c.$createdAt);
            completionDate.setHours(0, 0, 0, 0);
            completionDates.add(completionDate.toISOString());
          });
        });
        
        const current = completionDates.size;
        const target = tier.targetValue || 100;
        return {
          current,
          target,
          percentage: Math.min((current / target) * 100, 100),
        };
      } else if (tier.targetType === TargetTypes.COUNT) {
        // Count total quest completions for all quests in the arc - fetch in parallel
        const questCompletionsData = await Promise.all(
          arcQuests.map(async (quest) => {
            try {
              return await getQuestCompletions(quest.$id, user.$id);
            } catch (error) {
              return [];
            }
          })
        );
        
        const totalCompletions = questCompletionsData.reduce((sum, completions) => sum + completions.length, 0);
        const current = totalCompletions;
        const target = tier.targetValue || 100;
        return {
          current,
          target,
          percentage: Math.min((current / target) * 100, 100),
        };
      } else if (tier.targetType === TargetTypes.AMOUNT) {
        // For amount type, we'll use count as a placeholder - fetch in parallel
        const questCompletionsData = await Promise.all(
          arcQuests.map(async (quest) => {
            try {
              return await getQuestCompletions(quest.$id, user.$id);
            } catch (error) {
              return [];
            }
          })
        );
        
        const totalCompletions = questCompletionsData.reduce((sum, completions) => sum + completions.length, 0);
        const current = totalCompletions;
        const target = tier.targetValue || 100;
        return {
          current,
          target,
          percentage: Math.min((current / target) * 100, 100),
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

  // Calculate streak for a quest based on completion history
  const calculateQuestStreak = async (quest, userId) => {
    try {
      const frequency = quest.frequency || QuestFrequencies.DAILY;
      const completions = await getQuestCompletions(quest.$id, userId);
      
      if (completions.length === 0) {
        return 0;
      }
      
      // Sort completions by date (most recent first)
      const sortedCompletions = completions
        .map(c => ({
          date: new Date(c.completedAt || c.$createdAt),
          streakCount: c.streakCount || 1,
        }))
        .sort((a, b) => b.date - a.date);
      
      if (sortedCompletions.length === 0) {
        return 0;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Daily quests: count consecutive days
      if (frequency === QuestFrequencies.DAILY) {
        let streak = 0;
        let expectedDate = new Date(today);
        expectedDate.setHours(0, 0, 0, 0);
        
        // Check if today was completed
        const todayCompleted = sortedCompletions.some(c => {
          const completionDate = new Date(c.date);
          completionDate.setHours(0, 0, 0, 0);
          return completionDate.getTime() === expectedDate.getTime();
        });
        
        // If today not completed, start from yesterday
        if (!todayCompleted) {
          expectedDate.setDate(expectedDate.getDate() - 1);
        }
        
        for (const completion of sortedCompletions) {
          const completionDate = new Date(completion.date);
          completionDate.setHours(0, 0, 0, 0);
          
          // Check if this completion matches the expected date
          if (completionDate.getTime() === expectedDate.getTime()) {
            streak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
          } else if (completionDate < expectedDate) {
            // Gap found, streak is broken
            break;
          }
          // If completionDate > expectedDate, skip (duplicate or future date)
        }
        
        return streak;
      }
      
      // Weekly quests: count consecutive weeks
      if (frequency === QuestFrequencies.WEEKLY) {
        let streak = 0;
        const currentWeek = getWeekNumber(new Date());
        let expectedWeek = currentWeek;
        
        for (const completion of sortedCompletions) {
          const completionDate = new Date(completion.date);
          const completionWeek = getWeekNumber(completionDate);
          
          if (completionWeek === expectedWeek) {
            streak++;
            expectedWeek--;
            if (expectedWeek < 1) expectedWeek = 52; // Wrap around year
          } else if (completionWeek < expectedWeek) {
            break;
          }
        }
        
        return streak;
      }
      
      // Monthly quests: count consecutive months
      if (frequency === QuestFrequencies.MONTHLY) {
        let streak = 0;
        let expectedMonth = today.getMonth();
        let expectedYear = today.getFullYear();
        
        for (const completion of sortedCompletions) {
          const completionDate = new Date(completion.date);
          const completionMonth = completionDate.getMonth();
          const completionYear = completionDate.getFullYear();
          
          if (completionMonth === expectedMonth && completionYear === expectedYear) {
            streak++;
            expectedMonth--;
            if (expectedMonth < 0) {
              expectedMonth = 11;
              expectedYear--;
            }
          } else {
            const completionMonthIndex = completionYear * 12 + completionMonth;
            const expectedMonthIndex = expectedYear * 12 + expectedMonth;
            if (completionMonthIndex < expectedMonthIndex) {
              break;
            }
          }
        }
        
        return streak;
      }
      
      // For other frequencies, use the streak from the most recent completion
      return sortedCompletions[0]?.streakCount || 0;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };

  // Helper function to get week number
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // Filter quests for today based on frequency
  const filterQuestsForToday = async (quests, userId) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayOfMonth = today.getDate(); // 1-31
    const month = today.getMonth(); // 0-11
    const year = today.getFullYear();
    
    const filteredQuests = [];
    
    for (const quest of quests) {
      const frequency = quest.frequency || QuestFrequencies.DAILY;
      
      // Daily: show every day
      if (frequency === QuestFrequencies.DAILY) {
        filteredQuests.push(quest);
        continue;
      }
      
      // Weekly: show every day, but check if completed enough times this week
      // Users can complete weekly quests on any day of the week
      if (frequency === QuestFrequencies.WEEKLY) {
        // Check if quest has been completed enough times this week
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        try {
          const completions = await getQuestCompletions(
            quest.$id, 
            userId, 
            startOfWeek.toISOString(), 
            endOfWeek.toISOString()
          );
          const repetitions = quest.repetitionPerPeriod || 1;
          
          // Show if not completed enough times this week
          if (completions.length < repetitions) {
            filteredQuests.push(quest);
          }
        } catch (error) {
          // If error, show the quest to avoid hiding valid quests
          filteredQuests.push(quest);
        }
        continue;
      }
      
      // Monthly: show on specific dates of the month
      // Show on the 1st, 15th, and last day of month
      // TODO: Add specific date selection in quest creation
      if (frequency === QuestFrequencies.MONTHLY) {
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        const showDates = [1, 15, lastDayOfMonth];
        
        if (showDates.includes(dayOfMonth)) {
          // Check if already completed enough times this month
          const startOfMonth = new Date(year, month, 1);
          startOfMonth.setHours(0, 0, 0, 0);
          
          const endOfMonth = new Date(year, month + 1, 0);
          endOfMonth.setHours(23, 59, 59, 999);
          
          try {
            const completions = await getQuestCompletions(
              quest.$id, 
              userId, 
              startOfMonth.toISOString(), 
              endOfMonth.toISOString()
            );
            const repetitions = quest.repetitionPerPeriod || 1;
            
            // Show if not completed enough times this month
            if (completions.length < repetitions) {
              filteredQuests.push(quest);
            }
          } catch (error) {
            // If error, show the quest to avoid hiding valid quests
            filteredQuests.push(quest);
          }
        }
        continue;
      }
      
      // Annual: show on specific date each year
      // Show on January 1st
      // TODO: Add specific date selection in quest creation
      if (frequency === QuestFrequencies.ANNUAL) {
        if (month === 0 && dayOfMonth === 1) {
          // Check if already completed this year
          const startOfYear = new Date(year, 0, 1);
          startOfYear.setHours(0, 0, 0, 0);
          
          const endOfYear = new Date(year, 11, 31);
          endOfYear.setHours(23, 59, 59, 999);
          
          try {
            const completions = await getQuestCompletions(
              quest.$id, 
              userId, 
              startOfYear.toISOString(), 
              endOfYear.toISOString()
            );
            
            // Show if not completed this year
            if (completions.length === 0) {
              filteredQuests.push(quest);
            }
          } catch (error) {
            // If error, show the quest to avoid hiding valid quests
            filteredQuests.push(quest);
          }
        }
        continue;
      }
      
      // Unique: show until completed (once)
      if (frequency === QuestFrequencies.UNIQUE) {
        try {
          const completions = await getQuestCompletions(quest.$id, userId);
          
          // Show if never completed
          if (completions.length === 0) {
            filteredQuests.push(quest);
          }
        } catch (error) {
          // If error, show the quest to avoid hiding valid quests
          filteredQuests.push(quest);
        }
        continue;
      }
    }
    
    return filteredQuests;
  };

  const [questCompletions, setQuestCompletions] = useState({});
  const [questStreaks, setQuestStreaks] = useState({}); // { questId: streakCount }

  // Calculate statistics (optimized with parallel calls)
  const calculateStatistics = async (arcsData, questsData, userId) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);
    
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    startOfLastMonth.setHours(0, 0, 0, 0);
    
    // Pre-fetch all quest completions in parallel for all time periods
    const allQuestCompletions = await Promise.all(
      questsData.map(async (quest) => {
        try {
          const [all, week, month, lastWeek, lastMonth] = await Promise.all([
            getQuestCompletions(quest.$id, userId).catch(() => []),
            getQuestCompletions(quest.$id, userId, startOfWeek.toISOString(), today.toISOString()).catch(() => []),
            getQuestCompletions(quest.$id, userId, startOfMonth.toISOString(), today.toISOString()).catch(() => []),
            getQuestCompletions(quest.$id, userId, startOfLastWeek.toISOString(), startOfWeek.toISOString()).catch(() => []),
            getQuestCompletions(quest.$id, userId, startOfLastMonth.toISOString(), startOfMonth.toISOString()).catch(() => []),
          ]);
          return { questId: quest.$id, arcId: typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId, all, week, month, lastWeek, lastMonth };
        } catch (error) {
          return { questId: quest.$id, arcId: typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId, all: [], week: [], month: [], lastWeek: [], lastMonth: [] };
        }
      })
    );
    
    // Calculate arc statistics from pre-fetched data
    const arcStats = arcsData.map(arc => {
      const arcQuests = allQuestCompletions.filter(q => q.arcId === arc.$id);
      
      const totalCompletions = arcQuests.reduce((sum, q) => sum + q.all.length, 0);
      const weeklyCompletions = arcQuests.reduce((sum, q) => sum + q.week.length, 0);
      const monthlyCompletions = arcQuests.reduce((sum, q) => sum + q.month.length, 0);
      const lastWeekCompletions = arcQuests.reduce((sum, q) => sum + q.lastWeek.length, 0);
      const lastMonthCompletions = arcQuests.reduce((sum, q) => sum + q.lastMonth.length, 0);
      
      // Calculate completion rate
      const arcQuestsData = questsData.filter(q => {
        const qArcId = typeof q.arcId === 'object' ? q.arcId.$id : q.arcId;
        return qArcId === arc.$id;
      });
      
      let expectedCompletions = 0;
      for (const quest of arcQuestsData) {
        const frequency = quest.frequency || QuestFrequencies.DAILY;
        const repetitions = quest.repetitionPerPeriod || 1;
        
        if (frequency === QuestFrequencies.DAILY) {
          expectedCompletions += 7 * repetitions;
        } else if (frequency === QuestFrequencies.WEEKLY) {
          expectedCompletions += repetitions;
        } else if (frequency === QuestFrequencies.MONTHLY) {
          expectedCompletions += repetitions;
        }
      }
      
      const completionRate = expectedCompletions > 0 
        ? Math.min((weeklyCompletions / expectedCompletions) * 100, 100) 
        : 0;
      
      return {
        arcId: arc.$id,
        arcName: arc.name,
        arcColor: arc.color,
        totalCompletions,
        weeklyCompletions,
        monthlyCompletions,
        lastWeekCompletions,
        lastMonthCompletions,
        completionRate,
        questCount: arcQuestsData.length,
      };
    });
    
    // Weekly summary
    const weeklySummary = {
      completions: arcStats.reduce((sum, arc) => sum + arc.weeklyCompletions, 0),
      lastWeekCompletions: arcStats.reduce((sum, arc) => sum + arc.lastWeekCompletions, 0),
      change: 0,
    };
    weeklySummary.change = weeklySummary.lastWeekCompletions > 0
      ? ((weeklySummary.completions - weeklySummary.lastWeekCompletions) / weeklySummary.lastWeekCompletions) * 100
      : weeklySummary.completions > 0 ? 100 : 0;
    
    // Monthly summary
    const monthlySummary = {
      completions: arcStats.reduce((sum, arc) => sum + arc.monthlyCompletions, 0),
      lastMonthCompletions: arcStats.reduce((sum, arc) => sum + arc.lastMonthCompletions, 0),
      change: 0,
    };
    monthlySummary.change = monthlySummary.lastMonthCompletions > 0
      ? ((monthlySummary.completions - monthlySummary.lastMonthCompletions) / monthlySummary.lastMonthCompletions) * 100
      : monthlySummary.completions > 0 ? 100 : 0;
    
    // Progress trends (last 4 weeks) - use pre-fetched data
    const trends = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(startOfWeek);
      weekStart.setDate(startOfWeek.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Calculate from pre-fetched data
      let weekCompletions = 0;
      for (const questCompletion of allQuestCompletions) {
        const completionsInWeek = questCompletion.all.filter(c => {
          const completionDate = new Date(c.completedAt || c.$createdAt);
          return completionDate >= weekStart && completionDate <= weekEnd;
        });
        weekCompletions += completionsInWeek.length;
      }
      
      trends.push({
        week: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${i} weeks ago`,
        completions: weekCompletions,
        date: weekStart,
      });
    }
    
    return {
      arcStats,
      weeklySummary,
      monthlySummary,
      trends,
    };
  };

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
      {/* XP Notification */}
      {xpNotification && (
        <Animated.View
          style={[
            styles.xpNotification,
            {
              opacity: xpAnim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0, 1, 0],
              }),
              transform: [
                {
                  translateY: xpAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -100],
                  }),
                },
                {
                  scale: xpScale.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1.2, 1],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <View style={[
            styles.xpNotificationContent,
            xpNotification.arcColor && { borderColor: xpNotification.arcColor },
          ]}>
            <Ionicons name="star" size={20} color={xpNotification.arcColor || COLORS.accent.primary} />
            <Text style={[
              styles.xpNotificationText,
              xpNotification.arcColor && { color: xpNotification.arcColor },
            ]}>
              +{xpNotification.xp} XP
            </Text>
          </View>
        </Animated.View>
      )}

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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSettingsModalVisible(true)}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
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
            <Animated.View 
              style={[
                styles.xpBarContainer,
                {
                  transform: [{ scale: xpBarPulse }],
                },
              ]}
            >
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
                      <Animated.View 
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
            </Animated.View>
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
                          <>
                            <View 
                              style={[
                                styles.arcProgressFill, 
                                { 
                                  width: `${progressPercent}%`,
                                  backgroundColor: arc.color || COLORS.accent.primary,
                                }
                              ]} 
                            />
                          </>
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
                        {questStreaks[quest.$id] > 0 && (
                          <View style={styles.streakBadge}>
                            <Ionicons name="flame" size={12} color={COLORS.accent.warning} />
                            <Text style={styles.streakText}>{questStreaks[quest.$id]}</Text>
                          </View>
                        )}
                        <Text style={styles.questXP}>+{quest.xpPerCompletion || 10} XP</Text>
                      </View>
                      {/* Penalty Warning */}
                      {userProgress?.penaltySystemActive && questPenalties[quest.$id] && (
                        <View style={styles.penaltyWarning}>
                          <Ionicons name="warning" size={14} color={COLORS.accent.danger} />
                          <Text style={styles.penaltyText}>
                            {questPenalties[quest.$id].missedRecurrences} missed • -{questPenalties[quest.$id].penaltyXP} XP
                          </Text>
                          <TouchableOpacity
                            style={styles.penaltyOverrideButton}
                            onPress={async (e) => {
                              e.stopPropagation();
                              try {
                                const arcId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
                                const result = await overridePenalty(user.$id, household.$id, quest.$id, arcId);
                                if (result.success) {
                                  await fetchData();
                                  showAlert('Success', `Penalty overridden! ${result.restoredXP} XP restored.`, [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
                                }
                              } catch (error) {
                                console.error('Error overriding penalty:', error);
                                showAlert('Error', 'Could not override penalty', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
                              }
                            }}
                          >
                            <Ionicons name="refresh" size={12} color={COLORS.accent.primary} />
                          </TouchableOpacity>
                        </View>
                      )}
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
                
                // Get calculated progress from state
                const progress = tierProgress[tier.$id] || { current: 0, target: tier.targetValue || 100, percentage: 0 };
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

        {/* Statistics Section */}
        {statistics && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>STATISTICS</Text>
            </View>
            
            {/* Weekly Summary */}
            <View style={styles.statCard}>
              <Text style={styles.statCardTitle}>This Week</Text>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{statistics.weeklySummary.completions}</Text>
                  <Text style={styles.statLabel}>Completions</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[
                    styles.statValue,
                    statistics.weeklySummary.change >= 0 ? { color: COLORS.accent.success } : { color: COLORS.accent.danger }
                  ]}>
                    {statistics.weeklySummary.change >= 0 ? '+' : ''}{statistics.weeklySummary.change.toFixed(0)}%
                  </Text>
                  <Text style={styles.statLabel}>vs Last Week</Text>
                </View>
              </View>
            </View>

            {/* Monthly Summary */}
            <View style={styles.statCard}>
              <Text style={styles.statCardTitle}>This Month</Text>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{statistics.monthlySummary.completions}</Text>
                  <Text style={styles.statLabel}>Completions</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[
                    styles.statValue,
                    statistics.monthlySummary.change >= 0 ? { color: COLORS.accent.success } : { color: COLORS.accent.danger }
                  ]}>
                    {statistics.monthlySummary.change >= 0 ? '+' : ''}{statistics.monthlySummary.change.toFixed(0)}%
                  </Text>
                  <Text style={styles.statLabel}>vs Last Month</Text>
                </View>
              </View>
            </View>

            {/* Progress Trends */}
            <View style={styles.statCard}>
              <Text style={styles.statCardTitle}>4-Week Trend</Text>
              <View style={styles.trendsContainer}>
                {statistics.trends.map((trend, index) => {
                  const maxCompletions = Math.max(...statistics.trends.map(t => t.completions), 1);
                  return (
                    <View key={index} style={styles.trendItem}>
                      <Text style={styles.trendLabel}>{trend.week}</Text>
                      <View style={styles.trendBarContainer}>
                        <View 
                          style={[
                            styles.trendBar,
                            {
                              width: `${Math.min((trend.completions / maxCompletions) * 100, 100)}%`,
                              backgroundColor: COLORS.accent.primary,
                            }
                          ]}
                        />
                      </View>
                      <Text style={styles.trendValue}>{trend.completions}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Arc Completion Rates */}
            <View style={styles.statCard}>
              <Text style={styles.statCardTitle}>Completion Rates by Arc</Text>
              <View style={styles.arcStatsList}>
                {statistics.arcStats.map((arcStat) => (
                  <View key={arcStat.arcId} style={styles.arcStatItem}>
                    <View style={styles.arcStatHeader}>
                      <View style={[styles.arcStatIndicator, { backgroundColor: arcStat.arcColor || COLORS.accent.primary }]} />
                      <Text style={styles.arcStatName}>{arcStat.arcName}</Text>
                      <Text style={styles.arcStatRate}>{arcStat.completionRate.toFixed(0)}%</Text>
                    </View>
                    <View style={styles.arcStatProgressBar}>
                      <View 
                        style={[
                          styles.arcStatProgressFill,
                          {
                            width: `${Math.min(arcStat.completionRate, 100)}%`,
                            backgroundColor: arcStat.arcColor || COLORS.accent.primary,
                          }
                        ]}
                      />
                    </View>
                    <View style={styles.arcStatDetails}>
                      <Text style={styles.arcStatDetailText}>
                        {arcStat.weeklyCompletions} this week • {arcStat.monthlyCompletions} this month
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

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
              <Text style={styles.modalTitle}>
                {editingQuest ? (editingQuest.name || 'Quest Details') : 'Add Quest'}
              </Text>
              {editingQuest ? (
                <View style={{ width: 40 }} />
              ) : (
                <TouchableOpacity onPress={handleSaveQuest}>
                  <Text style={styles.modalSaveText}>Save</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Tabs for editing quest */}
            {editingQuest && (
              <View style={styles.modalTabs}>
                <TouchableOpacity
                  style={[styles.modalTab, questModalTab === 'details' && styles.modalTabActive]}
                  onPress={() => setQuestModalTab('details')}
                >
                  <Ionicons 
                    name="create-outline" 
                    size={18} 
                    color={questModalTab === 'details' ? COLORS.accent.primary : COLORS.textSecondary} 
                  />
                  <Text style={[
                    styles.modalTabText,
                    questModalTab === 'details' && styles.modalTabTextActive
                  ]}>
                    Edit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalTab, questModalTab === 'history' && styles.modalTabActive]}
                  onPress={() => setQuestModalTab('history')}
                >
                  <Ionicons 
                    name="time-outline" 
                    size={18} 
                    color={questModalTab === 'history' ? COLORS.accent.primary : COLORS.textSecondary} 
                  />
                  <Text style={[
                    styles.modalTabText,
                    questModalTab === 'history' && styles.modalTabTextActive
                  ]}>
                    History
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalTab, questModalTab === 'stats' && styles.modalTabActive]}
                  onPress={() => setQuestModalTab('stats')}
                >
                  <Ionicons 
                    name="stats-chart-outline" 
                    size={18} 
                    color={questModalTab === 'stats' ? COLORS.accent.primary : COLORS.textSecondary} 
                  />
                  <Text style={[
                    styles.modalTabText,
                    questModalTab === 'stats' && styles.modalTabTextActive
                  ]}>
                    Stats
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Details Tab */}
              {(!editingQuest || questModalTab === 'details') && (
                <>
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

                  {/* Save Button (when editing in details tab) */}
                  {editingQuest && questModalTab === 'details' && (
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={async () => {
                        await handleSaveQuest();
                      }}
                    >
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                  )}

                  {/* Delete Button (only when editing in details tab) */}
                  {editingQuest && questModalTab === 'details' && (
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

                  {!editingQuest && <View style={{ height: 40 }} />}
                </>
              )}

              {/* History Tab */}
              {editingQuest && questModalTab === 'history' && (
                <>
                  <View style={styles.questHistoryHeader}>
                    <Text style={styles.questHistoryTitle}>Completion History</Text>
                    <Text style={styles.questHistorySubtitle}>
                      {questCompletionsHistory.length} total completion{questCompletionsHistory.length !== 1 ? 's' : ''}
                    </Text>
                  </View>

                  {questCompletionsHistory.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="time-outline" size={48} color={COLORS.textTertiary} />
                      <Text style={styles.emptyStateText}>No completions yet</Text>
                      <Text style={styles.emptyStateSubtext}>Complete this quest to see history</Text>
                    </View>
                  ) : (
                    <View style={styles.completionHistoryList}>
                      {questCompletionsHistory.map((completion, index) => {
                        const completionDate = new Date(completion.completedAt || completion.$createdAt);
                        const isToday = completionDate.toDateString() === new Date().toDateString();
                        const isYesterday = completionDate.toDateString() === new Date(Date.now() - 86400000).toDateString();
                        
                        let dateLabel = '';
                        if (isToday) {
                          dateLabel = 'Today';
                        } else if (isYesterday) {
                          dateLabel = 'Yesterday';
                        } else {
                          dateLabel = completionDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: completionDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                          });
                        }
                        
                        return (
                          <View key={completion.$id || index} style={styles.completionHistoryItem}>
                            <View style={styles.completionHistoryIndicator}>
                              <Ionicons name="checkmark-circle" size={20} color={COLORS.accent.success} />
                            </View>
                            <View style={styles.completionHistoryContent}>
                              <Text style={styles.completionHistoryDate}>{dateLabel}</Text>
                              <Text style={styles.completionHistoryTime}>
                                {completionDate.toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit' 
                                })}
                              </Text>
                            </View>
                            <View style={styles.completionHistoryMeta}>
                              {completion.streakCount > 0 && (
                                <View style={styles.completionStreakBadge}>
                                  <Ionicons name="flame" size={12} color={COLORS.accent.warning} />
                                  <Text style={styles.completionStreakText}>{completion.streakCount}</Text>
                                </View>
                              )}
                              <Text style={styles.completionHistoryXP}>
                                +{completion.xpEarned || editingQuest.xpPerCompletion || 10} XP
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                  <View style={{ height: 40 }} />
                </>
              )}

              {/* Stats Tab */}
              {editingQuest && questModalTab === 'stats' && questStats && (
                <>
                  <View style={styles.questStatsContainer}>
                    {/* Current Streak */}
                    <View style={styles.questStatCard}>
                      <View style={styles.questStatHeader}>
                        <Ionicons name="flame" size={24} color={COLORS.accent.warning} />
                        <Text style={styles.questStatLabel}>Current Streak</Text>
                      </View>
                      <Text style={styles.questStatValue}>{questStats.currentStreak}</Text>
                      <Text style={styles.questStatUnit}>days</Text>
                    </View>

                    {/* Best Streak */}
                    <View style={styles.questStatCard}>
                      <View style={styles.questStatHeader}>
                        <Ionicons name="trophy" size={24} color={COLORS.accent.primary} />
                        <Text style={styles.questStatLabel}>Best Streak</Text>
                      </View>
                      <Text style={styles.questStatValue}>{questStats.bestStreak}</Text>
                      <Text style={styles.questStatUnit}>days</Text>
                    </View>

                    {/* Total Completions */}
                    <View style={styles.questStatCard}>
                      <View style={styles.questStatHeader}>
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.accent.success} />
                        <Text style={styles.questStatLabel}>Total Completions</Text>
                      </View>
                      <Text style={styles.questStatValue}>{questStats.totalCompletions}</Text>
                      <Text style={styles.questStatUnit}>times</Text>
                    </View>

                    {/* Total XP Earned */}
                    <View style={styles.questStatCard}>
                      <View style={styles.questStatHeader}>
                        <Ionicons name="star" size={24} color={COLORS.accent.primary} />
                        <Text style={styles.questStatLabel}>Total XP Earned</Text>
                      </View>
                      <Text style={styles.questStatValue}>{questStats.totalXP}</Text>
                      <Text style={styles.questStatUnit}>XP</Text>
                    </View>
                  </View>

                  {/* Additional Stats */}
                  <View style={styles.questStatsDetails}>
                    {questStats.firstCompletion && (
                      <View style={styles.questStatDetailItem}>
                        <Text style={styles.questStatDetailLabel}>First Completion</Text>
                        <Text style={styles.questStatDetailValue}>
                          {questStats.firstCompletion.toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    )}
                    {questStats.lastCompletion && (
                      <View style={styles.questStatDetailItem}>
                        <Text style={styles.questStatDetailLabel}>Last Completion</Text>
                        <Text style={styles.questStatDetailValue}>
                          {questStats.lastCompletion.toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    )}
                    {questStats.firstCompletion && questStats.lastCompletion && (
                      <View style={styles.questStatDetailItem}>
                        <Text style={styles.questStatDetailLabel}>Quest Duration</Text>
                        <Text style={styles.questStatDetailValue}>
                          {Math.floor((questStats.lastCompletion - questStats.firstCompletion) / (1000 * 60 * 60 * 24))} days
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={{ height: 40 }} />
                </>
              )}
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

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Settings</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Progression Type */}
              <Text style={[styles.inputLabel, { marginTop: 0 }]}>Progression Type</Text>
              <Text style={styles.inputHint}>
                Choose how XP requirements scale as you level up
              </Text>
              
              <View style={styles.progressionTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.progressionTypeCard,
                    userProgress?.progressionType === ProgressionTypes.LINEAR && styles.progressionTypeCardSelected,
                  ]}
                  onPress={async () => {
                    try {
                      await updateProgressionType(user.$id, household.$id, ProgressionTypes.LINEAR);
                      await fetchData();
                      showAlert('Success', 'Progression type updated to Linear', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
                    } catch (error) {
                      console.error('Error updating progression type:', error);
                      showAlert('Error', 'Could not update progression type', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
                    }
                  }}
                >
                  <Text style={styles.progressionTypeTitle}>Linear</Text>
                  <Text style={styles.progressionTypeDescription}>
                    100 XP per level{'\n'}
                    Consistent progression
                  </Text>
                  {userProgress?.progressionType === ProgressionTypes.LINEAR && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.accent.primary} style={styles.progressionTypeCheck} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.progressionTypeCard,
                    (!userProgress?.progressionType || userProgress?.progressionType === ProgressionTypes.PROGRESSIVE) && styles.progressionTypeCardSelected,
                  ]}
                  onPress={async () => {
                    try {
                      await updateProgressionType(user.$id, household.$id, ProgressionTypes.PROGRESSIVE);
                      await fetchData();
                      showAlert('Success', 'Progression type updated to Progressive', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
                    } catch (error) {
                      console.error('Error updating progression type:', error);
                      showAlert('Error', 'Could not update progression type', [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
                    }
                  }}
                >
                  <Text style={styles.progressionTypeTitle}>Progressive</Text>
                  <Text style={styles.progressionTypeDescription}>
                    Exponential growth{'\n'}
                    Level 1: 50 XP, Level 2: 75 XP, etc.
                  </Text>
                  {(!userProgress?.progressionType || userProgress?.progressionType === ProgressionTypes.PROGRESSIVE) && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.accent.primary} style={styles.progressionTypeCheck} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Penalty System Toggle */}
              <View style={styles.settingsSection}>
                <Text style={[styles.inputLabel, { marginTop: 24 }]}>Penalty System</Text>
                <Text style={styles.inputHint}>
                  When active, missing quest recurrences will deduct XP (50% of quest XP per miss)
                </Text>
                
                <TouchableOpacity
                  style={styles.toggleContainer}
                  onPress={async () => {
                    try {
                      const newState = !userProgress?.penaltySystemActive;
                      await togglePenaltySystem(user.$id, household.$id, newState);
                      await fetchData();
                    } catch (error) {
                      console.error('Error toggling penalty system:', error);
                    }
                  }}
                >
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Enable Penalty System</Text>
                    <Text style={styles.toggleDescription}>
                      Track missed recurrences and apply XP penalties
                    </Text>
                  </View>
                  <View style={[
                    styles.toggleSwitch,
                    userProgress?.penaltySystemActive && styles.toggleSwitchActive
                  ]}>
                    <View style={[
                      styles.toggleThumb,
                      userProgress?.penaltySystemActive && styles.toggleThumbActive
                    ]} />
                  </View>
                </TouchableOpacity>
                
                {userProgress?.penaltySystemActive && (
                  <View style={styles.penaltyStats}>
                    <Text style={styles.penaltyStatsLabel}>Penalty Statistics</Text>
                    <View style={styles.penaltyStatsRow}>
                      <Text style={styles.penaltyStatsValue}>
                        Total Penalties: {userProgress?.totalPenalties || 0}
                      </Text>
                      <Text style={styles.penaltyStatsValue}>
                        Total XP Lost: -{userProgress?.totalPenaltyXP || 0}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal
        visible={alertModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAlertModalVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{alertData.title}</Text>
            <Text style={styles.alertMessage}>{alertData.message}</Text>
            <View style={styles.alertButtons}>
              {alertData.buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.alertButton,
                    index === alertData.buttons.length - 1 && alertData.buttons.length > 1 && styles.alertButtonPrimary,
                    button.text === 'Delete' && styles.alertButtonDanger,
                  ]}
                  onPress={() => {
                    if (button.onPress) button.onPress();
                    setAlertModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.alertButtonText,
                    index === alertData.buttons.length - 1 && alertData.buttons.length > 1 && styles.alertButtonTextPrimary,
                    button.text === 'Delete' && styles.alertButtonTextDanger,
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Level Up Modal */}
      <Modal
        visible={levelUpModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLevelUpModalVisible(false)}
      >
        <View style={styles.levelUpOverlay}>
          <View style={[
            styles.levelUpContent,
            levelUpData.arc && { borderColor: levelUpData.arc.color || COLORS.accent.primary },
          ]}>
            {/* Icon/Emoji */}
            <View style={[
              styles.levelUpIconContainer,
              levelUpData.arc && { backgroundColor: `${levelUpData.arc.color || COLORS.accent.primary}20` },
            ]}>
              {levelUpData.arc?.icon ? (
                <Ionicons 
                  name={levelUpData.arc.icon} 
                  size={40} 
                  color={levelUpData.arc.color || COLORS.accent.primary} 
                />
              ) : (
                <Text style={styles.levelUpEmoji}>
                  {levelUpData.type === 'global' ? '🎉' : '⭐'}
                </Text>
              )}
            </View>

            {/* Title */}
            <Text style={[
              styles.levelUpTitle,
              levelUpData.arc && { color: levelUpData.arc.color || COLORS.accent.primary },
            ]}>
              {levelUpData.type === 'global' ? 'Level Up!' : `${levelUpData.arc?.name || 'Arc'} Level Up!`}
            </Text>

            {/* Level Display */}
            <View style={styles.levelUpLevelContainer}>
              <Text style={styles.levelUpLevelLabel}>Level</Text>
              <Text style={[
                styles.levelUpLevelValue,
                levelUpData.arc && { color: levelUpData.arc.color || COLORS.accent.primary },
              ]}>
                {levelUpData.level}
              </Text>
            </View>

            {/* XP Earned */}
            <Text style={styles.levelUpXP}>
              +{levelUpData.xpEarned} XP earned
            </Text>

            {/* Close Button */}
            <TouchableOpacity
              style={[
                styles.levelUpButton,
                levelUpData.arc && { backgroundColor: levelUpData.arc.color || COLORS.accent.primary },
              ]}
              onPress={() => setLevelUpModalVisible(false)}
            >
              <Text style={styles.levelUpButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent.warning}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent.warning,
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
  // Statistics Styles
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  trendsContainer: {
    gap: 12,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    width: 80,
  },
  trendBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.elevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  trendBar: {
    height: '100%',
    borderRadius: 4,
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    width: 40,
    textAlign: 'right',
  },
  arcStatsList: {
    gap: 12,
  },
  arcStatItem: {
    marginBottom: 12,
  },
  arcStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  arcStatIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  arcStatName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  arcStatRate: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent.primary,
  },
  arcStatProgressBar: {
    height: 6,
    backgroundColor: COLORS.elevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  arcStatProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  arcStatDetails: {
    marginTop: 4,
  },
  arcStatDetailText: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  // Penalty Styles
  penaltyWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.accent.danger + '20',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  penaltyText: {
    fontSize: 11,
    color: COLORS.accent.danger,
    fontWeight: '600',
    flex: 1,
  },
  penaltyOverrideButton: {
    padding: 4,
    marginLeft: 4,
  },
  settingsSection: {
    marginTop: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.elevated,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.textTertiary,
  },
  toggleThumbActive: {
    backgroundColor: COLORS.textPrimary,
    alignSelf: 'flex-end',
  },
  penaltyStats: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  penaltyStatsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  penaltyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  penaltyStatsValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Quest Modal Tabs
  modalTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
  },
  modalTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modalTabActive: {
    borderBottomColor: COLORS.accent.primary,
  },
  modalTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  modalTabTextActive: {
    color: COLORS.accent.primary,
    fontWeight: '600',
  },
  // Quest History Styles
  questHistoryHeader: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  questHistoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  questHistorySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  completionHistoryList: {
    gap: 8,
  },
  completionHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  completionHistoryIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionHistoryContent: {
    flex: 1,
  },
  completionHistoryDate: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  completionHistoryTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  completionHistoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completionStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accent.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completionStreakText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent.warning,
  },
  completionHistoryXP: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent.primary,
  },
  // Quest Stats Styles
  questStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  questStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  questStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  questStatValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  questStatUnit: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  questStatsDetails: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questStatDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  questStatDetailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  questStatDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  saveButton: {
    backgroundColor: COLORS.accent.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
  // Progression Type Styles
  progressionTypeContainer: {
    gap: 12,
    marginTop: 8,
  },
  progressionTypeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  progressionTypeCardSelected: {
    borderColor: COLORS.accent.primary,
    backgroundColor: COLORS.accent.primary + '10',
  },
  progressionTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  progressionTypeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  progressionTypeCheck: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  // XP Notification Styles
  xpNotification: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  xpNotificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  xpNotificationText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent.primary,
    letterSpacing: 0.5,
  },
  // Alert Modal Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  alertButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 80,
    alignItems: 'center',
  },
  alertButtonPrimary: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
  },
  alertButtonDanger: {
    backgroundColor: COLORS.accent.danger,
    borderColor: COLORS.accent.danger,
  },
  alertButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  alertButtonTextPrimary: {
    color: COLORS.textPrimary,
  },
  alertButtonTextDanger: {
    color: COLORS.textPrimary,
  },
  // Level Up Modal Styles
  levelUpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  levelUpContent: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
  },
  levelUpIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.accent.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelUpEmoji: {
    fontSize: 48,
  },
  levelUpTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.accent.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  levelUpLevelContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  levelUpLevelLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  levelUpLevelValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.accent.primary,
    lineHeight: 56,
  },
  levelUpXP: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  levelUpButton: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  levelUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
