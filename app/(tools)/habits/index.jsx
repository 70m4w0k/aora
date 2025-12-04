import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useGlobalContext } from '../../../context/GlobalProvider';
import {
  getHouseholdArcs,
  getHouseholdQuests,
  getQuestCompletions,
  getUserProgress,
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
  updateProgressionType,
  togglePenaltySystem,
  overridePenalty,
  getXpHistory,
} from '../../../lib/appwrite';

// Import constants, components, and utilities
import { COLORS } from './constants';
import { 
  parseUnlockedData, 
  getArcProgress as getArcProgressUtil,
  calculateQuestStreak as calculateQuestStreakUtil,
  getTierProgress as getTierProgressUtil,
  filterQuestsForToday as filterQuestsForTodayUtil
} from './utils';
import { 
  calculateStatistics as calculateStatisticsUtil,
  calculateStreakStatistics as calculateStreakStatisticsUtil,
  detectMissedQuests as detectMissedQuestsUtil
} from './statistics';
import { 
  handleCompleteQuest as handleCompleteQuestUtil,
  handleCompleteTier as handleCompleteTierUtil
} from './handlers';
import GlobalProgressCard from './components/GlobalProgressCard';
import CharacterProfileCard from './components/CharacterProfileCard';
import MissedQuestsBanner from './components/MissedQuestsBanner';
import ArcsSection from './components/ArcsSection';
import TodaysQuestsSection from './components/TodaysQuestsSection';
import QuestBoard from './components/QuestBoard';
import TiersSection from './components/TiersSection';
import StatisticsSection from './components/StatisticsSection';
import StreakStatisticsSection from './components/StreakStatisticsSection';
import StreakCalendarSection from './components/StreakCalendarSection';
import ArcModal from './components/ArcModal';
import TierModal from './components/TierModal';
import QuestModal from './components/QuestModal';
import ArcDetailModal from './components/ArcDetailModal';
import CustomAlertModal from './components/CustomAlertModal';
import TitleUnlockModal from './components/TitleUnlockModal';
import LevelUpModal from './components/LevelUpModal';
import SettingsModal from './components/SettingsModal';
import MissedQuestsModal from './components/MissedQuestsModal';
import XpHistoryModal from './components/XpHistoryModal';
import StreakStatisticsModal from './components/StreakStatisticsModal';
import StreakCalendarModal from './components/StreakCalendarModal';
import TitlesAchievementsModal from './components/TitlesAchievementsModal';
import XpNotification from './components/XpNotification';
import Header from './components/Header';


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
  const [unlockedTitles, setUnlockedTitles] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [titleUnlockModalVisible, setTitleUnlockModalVisible] = useState(false);
  const [newlyUnlockedTitle, setNewlyUnlockedTitle] = useState(null);
  const [titlesAchievementsModalVisible, setTitlesAchievementsModalVisible] = useState(false);
  const [streakCalendarModalVisible, setStreakCalendarModalVisible] = useState(false);
  const [selectedQuestForStreak, setSelectedQuestForStreak] = useState(null); // null = all quests
  const [streakCalendarData, setStreakCalendarData] = useState({}); // { date: { questId: streakCount } }
  const [xpHistoryModalVisible, setXpHistoryModalVisible] = useState(false);
  const [xpHistory, setXpHistory] = useState([]);
  const [xpHistoryLoading, setXpHistoryLoading] = useState(false);
  const [xpHistoryFilters, setXpHistoryFilters] = useState({
    arcId: null,
    sourceType: null, // 'quest' or 'tier'
    startDate: null,
    endDate: null,
  });
  const [missedQuests, setMissedQuests] = useState([]); // Array of { quest, missedCount, lastCompleted }
  const [missedQuestsModalVisible, setMissedQuestsModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Default enabled
  const [streakStatsModalVisible, setStreakStatsModalVisible] = useState(false);
  const [streakStatistics, setStreakStatistics] = useState(null); // Detailed streak statistics
  const [streakStatsLoading, setStreakStatsLoading] = useState(false);
  
  // Arc Modal
  const [arcModalVisible, setArcModalVisible] = useState(false);
  const [editingArc, setEditingArc] = useState(null);
  const [arcForm, setArcForm] = useState({
    name: '',
    color: '#8B5CF6',
    icon: '',
    description: '',
  });
  
  // Arc Detail Modal
  const [arcDetailModalVisible, setArcDetailModalVisible] = useState(false);
  const [selectedArc, setSelectedArc] = useState(null);
  const [arcDetailTab, setArcDetailTab] = useState('overview'); // 'overview', 'quests', 'tiers'
  const [arcQuests, setArcQuests] = useState([]);
  const [arcTiers, setArcTiers] = useState([]);
  const [arcProgress, setArcProgress] = useState(null);

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
      
      // Load unlocked titles and achievements
      const { unlockedTitles: unlockedTitlesList, unlockedAchievements: unlockedAchievementsList } = parseUnlockedData(progressData);
      setUnlockedTitles(unlockedTitlesList);
      setUnlockedAchievements(unlockedAchievementsList);
      
      // Debug logging
      console.log('Unlocked Titles:', unlockedTitlesList);
      console.log('Unlocked Achievements:', unlockedAchievementsList);
      
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
      
      // Load detailed data in background (non-blocking) - delay to let UI render first
      setTimeout(() => {
        loadDetailedData(arcsData, questsData, tiersData, user.$id);
      }, 100);
      
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
              const progress = await getTierProgressUtil(tier, questsData, userId, getQuestCompletions);
              return { tierId: tier.$id, progress };
            } catch (error) {
              return { tierId: tier.$id, progress: { current: 0, target: tier.targetValue || 100, percentage: 0 } };
            }
          })
        ),
        // Filter today's quests
        filterQuestsForTodayUtil(questsData, userId, getQuestCompletions),
        // Calculate streaks in parallel (limit to first 10 for initial load, rest in background)
        (async () => {
          const initialQuests = questsData.slice(0, 10);
          const remainingQuests = questsData.slice(10);
          
          // Load first 10 immediately
          const initialStreaks = await Promise.all(
            initialQuests.map(async (quest) => {
              try {
                const streak = await calculateQuestStreakUtil(quest, userId, getQuestCompletions);
                return { questId: quest.$id, streak };
              } catch (error) {
                return { questId: quest.$id, streak: 0 };
              }
            })
          );
          
          // Load remaining in background
          if (remainingQuests.length > 0) {
            setTimeout(async () => {
              const remainingStreaks = await Promise.all(
                remainingQuests.map(async (quest) => {
                  try {
                    const streak = await calculateQuestStreakUtil(quest, userId, getQuestCompletions);
                    return { questId: quest.$id, streak };
                  } catch (error) {
                    return { questId: quest.$id, streak: 0 };
                  }
                })
              );
              const allStreaks = [...initialStreaks, ...remainingStreaks];
              const streaksMap = {};
              allStreaks.forEach(({ questId, streak }) => {
                streaksMap[questId] = streak;
              });
              setQuestStreaks(streaksMap);
            }, 500);
          }
          
          return initialStreaks;
        })(),
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
          const stats = await calculateStatisticsUtil(arcsData, questsData, userId, getQuestCompletions);
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

  const showTitleUnlock = (titleOrAchievement) => {
    setNewlyUnlockedTitle(titleOrAchievement);
    setTitleUnlockModalVisible(true);
  };

  // Show XP Notification
  const showXPNotification = (xp, arcColor = null) => {
    setXpNotification({ xp, arcColor });
    
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
    return handleCompleteQuestUtil({
      quest,
      user,
      household,
      quests,
      arcs,
      tiers,
      getQuestCompletions,
      setQuestCompletions,
      setUserProgress,
      setQuestStreaks,
      setTodayQuests,
      setUnlockedTitles,
      setUnlockedAchievements,
      setTierProgress,
      showXPNotification,
      showTitleUnlock,
      showLevelUp,
      showAlert,
      setAlertModalVisible,
    });
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

  const openArcDetailModal = async (arc) => {
    setSelectedArc(arc);
    setArcDetailTab('overview');
    
    // Filter quests and tiers for this arc
    const arcId = arc.$id;
    const filteredQuests = quests.filter(q => {
      const qArcId = typeof q.arcId === 'object' ? q.arcId.$id : q.arcId;
      return qArcId === arcId;
    });
    const filteredTiers = tiers.filter(t => {
      const tArcId = typeof t.arcId === 'object' ? t.arcId.$id : t.arcId;
      return tArcId === arcId;
    });
    
    setArcQuests(filteredQuests);
    setArcTiers(filteredTiers);
    
    // Get arc progress from user progress
    if (userProgress) {
      let arcProgressData = {};
      try {
        arcProgressData = userProgress.arcProgress ? 
          (typeof userProgress.arcProgress === 'string' ? JSON.parse(userProgress.arcProgress) : userProgress.arcProgress) : {};
      } catch (e) {
        arcProgressData = {};
      }
      
      const progress = arcProgressData[arcId] || {
        totalXP: 0,
        level: 1,
        questsCompleted: 0,
        tiersCompleted: 0,
        missedRecurrences: 0,
        penaltyXP: 0,
      };
      
      setArcProgress(progress);
    }
    
    setArcDetailModalVisible(true);
  };

  const closeArcDetailModal = () => {
    setArcDetailModalVisible(false);
    setSelectedArc(null);
    setArcDetailTab('overview');
    setArcQuests([]);
    setArcTiers([]);
    setArcProgress(null);
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
    // Open modal immediately
    setQuestModalTab('details');
    setQuestModalVisible(true);
    
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
      
      // Initialize with empty data for immediate display
      setQuestCompletionsHistory([]);
      setQuestStats(null);
      
      // Load completion history and stats in background
      setTimeout(async () => {
        try {
          const completions = await getQuestCompletions(quest.$id, user.$id);
          setQuestCompletionsHistory(completions.sort((a, b) => {
            const dateA = new Date(a.completedAt || a.$createdAt);
            const dateB = new Date(b.completedAt || b.$createdAt);
            return dateB - dateA;
          }));
          
          // Calculate stats
          const currentStreak = await calculateQuestStreakUtil(quest, user.$id, getQuestCompletions);
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
      }, 100);
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
    return handleCompleteTierUtil({
      tier,
      user,
      household,
      arcs,
      getUserProgress,
      completeTier,
      showXPNotification,
      showTitleUnlock,
      showLevelUp,
      showAlert,
      setAlertModalVisible,
      fetchData,
    });
  };

  // Calculate tier progress based on quest completions
  const getArcProgress = (arcId) => {
    return getArcProgressUtil(userProgress, arcId);
  };

  // Load XP History
  const loadXpHistory = async () => {
    if (!user || !household) return;
    
    setXpHistoryLoading(true);
    try {
      const filters = {
        arcId: xpHistoryFilters.arcId,
        sourceType: xpHistoryFilters.sourceType,
        startDate: xpHistoryFilters.startDate,
        endDate: xpHistoryFilters.endDate,
      };
      
      const history = await getXpHistory(user.$id, household.$id, filters);
      setXpHistory(history);
    } catch (error) {
      console.error('Error loading XP history:', error);
    } finally {
      setXpHistoryLoading(false);
    }
  };

  // Load XP history when modal opens
  useEffect(() => {
    if (xpHistoryModalVisible && user && household) {
      loadXpHistory();
    }
  }, [xpHistoryModalVisible]);

  // Detect missed quests (optimized - only check first 10 initially)
  const detectMissedQuests = async () => {
    return detectMissedQuestsUtil(user, quests, getQuestCompletions, setMissedQuests);
  };
  
  // Detect missed quests when data loads
  useEffect(() => {
    if (quests.length > 0 && user && notificationsEnabled) {
      detectMissedQuests();
    } else if (!notificationsEnabled) {
      setMissedQuests([]);
    }
  }, [quests, user, notificationsEnabled]);

  // Calculate detailed streak statistics (OPTIMIZED)
  const calculateStreakStatistics = async () => {
    return calculateStreakStatisticsUtil(user, quests, arcs, getQuestCompletions, setStreakStatsLoading, setStreakStatistics);
  };
  
  // Load streak statistics when modal opens
  useEffect(() => {
    if (streakStatsModalVisible && user && quests.length > 0) {
      calculateStreakStatistics();
    }
  }, [streakStatsModalVisible]);


  const [questCompletions, setQuestCompletions] = useState({});
  const [questStreaks, setQuestStreaks] = useState({}); // { questId: streakCount }


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
        <Header
          onBackPress={() => router.back()}
          onSettingsPress={() => setSettingsModalVisible(true)}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* XP Notification */}
      <XpNotification 
        xpNotification={xpNotification}
        onAnimationComplete={() => setXpNotification(null)}
      />

      {/* Header */}
      <Header
        onBackPress={() => router.back()}
        onSettingsPress={() => setSettingsModalVisible(true)}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent.primary} />
        }
      >
        {/* Character Profile Card */}
        <CharacterProfileCard
          user={user}
          userProgress={userProgress}
          unlockedTitles={unlockedTitles}
          unlockedAchievements={unlockedAchievements}
          questStreaks={questStreaks}
          arcs={arcs}
          xpBarPulse={xpBarPulse}
          onPressTitles={() => setTitlesAchievementsModalVisible(true)}
          onPressXpHistory={() => setXpHistoryModalVisible(true)}
          onPressCharacter={() => setTitlesAchievementsModalVisible(true)}
        />

        {/* Missed Quests Notification Banner */}
        {notificationsEnabled && (
          <MissedQuestsBanner
            missedQuests={missedQuests}
            onPress={() => setMissedQuestsModalVisible(true)}
          />
        )}

        {/* Arcs Section */}
        <ArcsSection
          arcs={arcs}
          quests={quests}
          userProgress={userProgress}
          getArcProgress={getArcProgress}
          onAddArc={() => openArcModal()}
          onArcPress={(arc) => openArcDetailModal(arc)}
          onArcLongPress={(arc) => handleDeleteArc(arc)}
        />

        {/* Today's Quest Board */}
        <QuestBoard
          todayQuests={todayQuests}
          arcs={arcs}
          questStreaks={questStreaks}
          questCompletions={questCompletions}
          questPenalties={questPenalties}
          userProgress={userProgress}
          notificationsEnabled={notificationsEnabled}
          missedQuests={missedQuests}
          onAddQuest={() => openQuestModal()}
          onQuestPress={(quest) => openQuestModal(quest)}
          onQuestLongPress={(quest) => handleDeleteQuest(quest)}
          onCompleteQuest={handleCompleteQuest}
          onOverridePenalty={overridePenalty}
          showAlert={showAlert}
          setAlertModalVisible={setAlertModalVisible}
          user={user}
          household={household}
          fetchData={fetchData}
          overridePenalty={overridePenalty}
        />

        {/* Streak Statistics Section */}
        <StreakStatisticsSection
          questStreaks={questStreaks}
          onViewDetails={() => setStreakStatsModalVisible(true)}
        />

        {/* Streak Calendar Section */}
        <StreakCalendarSection
          onView={() => setStreakCalendarModalVisible(true)}
        />

        {/* Tiers Section */}
        <TiersSection
          tiers={tiers}
          arcs={arcs}
          tierProgress={tierProgress}
          tierCompletions={tierCompletions}
          onAddTier={() => openTierModal()}
          onTierPress={(tier) => openTierModal(tier)}
          onTierLongPress={(tier) => handleDeleteTier(tier)}
          onCompleteTier={handleCompleteTier}
        />

        {/* Statistics Section */}
        <StatisticsSection statistics={statistics} />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Arc Management Modal */}
      <ArcModal
        visible={arcModalVisible}
        editingArc={editingArc}
        arcForm={arcForm}
        setArcForm={setArcForm}
        onClose={closeArcModal}
        onSave={handleSaveArc}
        onDelete={handleDeleteArc}
      />

      {/* Quest Management Modal */}
      <QuestModal
        visible={questModalVisible}
        editingQuest={editingQuest}
        questForm={questForm}
        setQuestForm={setQuestForm}
        questModalTab={questModalTab}
        setQuestModalTab={setQuestModalTab}
        questCompletionsHistory={questCompletionsHistory}
        questStats={questStats}
        arcs={arcs}
        onClose={closeQuestModal}
        onSave={handleSaveQuest}
        onDelete={handleDeleteQuest}
      />

      {/* Tier Management Modal */}
      <TierModal
        visible={tierModalVisible}
        editingTier={editingTier}
        tierForm={tierForm}
        setTierForm={setTierForm}
        arcs={arcs}
        onClose={closeTierModal}
        onSave={handleSaveTier}
        onDelete={handleDeleteTier}
      />

      {/* Arc Detail Modal */}
      <ArcDetailModal
        visible={arcDetailModalVisible}
        selectedArc={selectedArc}
        arcDetailTab={arcDetailTab}
        setArcDetailTab={setArcDetailTab}
        arcQuests={arcQuests}
        arcTiers={arcTiers}
        arcProgress={arcProgress}
        questCompletions={questCompletions}
        questStreaks={questStreaks}
        tierProgress={tierProgress}
        tierCompletions={tierCompletions}
        userProgress={userProgress}
        onClose={closeArcDetailModal}
        onEdit={() => {
          closeArcDetailModal();
          if (selectedArc) {
            setTimeout(() => openArcModal(selectedArc), 300);
          }
        }}
        onAddQuest={() => {
          closeArcDetailModal();
          if (selectedArc) {
            setTimeout(() => {
              setQuestForm({
                ...questForm,
                arcId: selectedArc.$id,
              });
              openQuestModal();
            }, 300);
          }
        }}
        onAddTier={() => {
          closeArcDetailModal();
          if (selectedArc) {
            setTimeout(() => {
              setTierForm({
                ...tierForm,
                arcId: selectedArc.$id,
              });
              openTierModal();
            }, 300);
          }
        }}
        onQuestPress={(quest) => {
          closeArcDetailModal();
          setTimeout(() => openQuestModal(quest), 300);
        }}
        onTierPress={(tier) => {
          closeArcDetailModal();
          setTimeout(() => openTierModal(tier), 300);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsModalVisible}
        userProgress={userProgress}
        notificationsEnabled={notificationsEnabled}
        user={user}
        household={household}
        onClose={() => setSettingsModalVisible(false)}
        onUpdateProgressionType={updateProgressionType}
        onToggleNotifications={() => {
          setNotificationsEnabled(!notificationsEnabled);
          if (!notificationsEnabled) {
            setTimeout(() => detectMissedQuests(), 500);
          }
        }}
        onTogglePenaltySystem={togglePenaltySystem}
        showAlert={showAlert}
        setAlertModalVisible={setAlertModalVisible}
        fetchData={fetchData}
      />

      {/* Missed Quests Modal */}
      <MissedQuestsModal
        visible={missedQuestsModalVisible}
        missedQuests={missedQuests}
        arcs={arcs}
        onClose={() => setMissedQuestsModalVisible(false)}
        onQuestPress={(quest) => {
          setMissedQuestsModalVisible(false);
          setTimeout(() => openQuestModal(quest), 300);
        }}
        onCompleteQuest={handleCompleteQuest}
      />

      {/* XP History Modal */}
      <XpHistoryModal
        visible={xpHistoryModalVisible}
        xpHistory={xpHistory}
        xpHistoryLoading={xpHistoryLoading}
        xpHistoryFilters={xpHistoryFilters}
        arcs={arcs}
        onClose={() => setXpHistoryModalVisible(false)}
        onFilterChange={setXpHistoryFilters}
        onLoadHistory={loadXpHistory}
      />

      {/* Streak Statistics Modal */}
      <StreakStatisticsModal
        visible={streakStatsModalVisible}
        streakStatistics={streakStatistics}
        streakStatsLoading={streakStatsLoading}
        onClose={() => setStreakStatsModalVisible(false)}
      />

      {/* Streak Calendar Modal */}
      <StreakCalendarModal
        visible={streakCalendarModalVisible}
        quests={quests}
        arcs={arcs}
        user={user}
        selectedQuestForStreak={selectedQuestForStreak}
        onClose={() => setStreakCalendarModalVisible(false)}
        onQuestFilterChange={setSelectedQuestForStreak}
      />

      {/* Title Unlock Modal */}
      <TitleUnlockModal
        visible={titleUnlockModalVisible}
        title={newlyUnlockedTitle}
        onClose={() => {
          setTitleUnlockModalVisible(false);
          setNewlyUnlockedTitle(null);
        }}
      />

      {/* Titles & Achievements Modal */}
      <TitlesAchievementsModal
        visible={titlesAchievementsModalVisible}
        userProgress={userProgress}
        unlockedTitles={unlockedTitles}
        unlockedAchievements={unlockedAchievements}
        onClose={() => setTitlesAchievementsModalVisible(false)}
      />

      {/* Custom Alert Modal */}
      <CustomAlertModal
        visible={alertModalVisible}
        alertData={alertData}
        onClose={() => setAlertModalVisible(false)}
      />

      {/* Level Up Modal */}
      <LevelUpModal
        visible={levelUpModalVisible}
        levelUpData={levelUpData}
        onClose={() => setLevelUpModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
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
  // XP History Styles
  xpHistoryFilters: {
    marginBottom: 24,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  filterChipActive: {
    borderWidth: 2,
    backgroundColor: COLORS.card,
  },
  filterChipIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  applyFiltersButton: {
    backgroundColor: COLORS.accent.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  applyFiltersButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  xpHistoryLoading: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  xpHistoryLoadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  xpHistoryTimeline: {
    marginTop: 8,
  },
  xpHistoryEntry: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  xpHistoryTimelineLine: {
    alignItems: 'center',
    marginRight: 16,
    width: 20,
  },
  xpHistoryTimelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  xpHistoryTimelineLineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
    minHeight: 40,
  },
  xpHistoryEntryContent: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  xpHistoryEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  xpHistoryEntryInfo: {
    flex: 1,
    marginRight: 12,
  },
  xpHistoryEntrySource: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  xpHistoryEntryArc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  xpHistoryEntryXP: {
    alignItems: 'flex-end',
  },
  xpHistoryEntryXPAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent.primary,
    marginBottom: 2,
  },
  xpHistoryEntryXPLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xpHistoryEntryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  xpHistoryEntrySourceType: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  xpHistoryEntrySourceTypeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xpHistoryEntryDate: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  xpHistoryEntryPenalty: {
    fontSize: 11,
    color: COLORS.accent.danger,
    fontWeight: '500',
  },
  // Missed Quests Styles
  missedQuestsBanner: {
    backgroundColor: `${COLORS.accent.warning}15`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${COLORS.accent.warning}30`,
  },
  missedQuestsBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  missedQuestsBannerText: {
    flex: 1,
  },
  missedQuestsBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  missedQuestsBannerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  missedQuestsBadge: {
    backgroundColor: COLORS.accent.warning,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  missedQuestsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  missedQuestsSectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent.warning}20`,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  missedQuestsSectionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent.warning,
  },
  missedQuestIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: `${COLORS.accent.danger}20`,
  },
  missedQuestIndicatorLarge: {
    padding: 8,
    borderRadius: 8,
  },
  missedQuestIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.accent.danger,
    textTransform: 'uppercase',
  },
  missedQuestsList: {
    gap: 12,
  },
  missedQuestCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: `${COLORS.accent.danger}30`,
    alignItems: 'center',
    gap: 12,
  },
  missedQuestContent: {
    flex: 1,
  },
  missedQuestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  missedQuestName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  missedQuestCountBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  missedQuestCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  missedQuestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 6,
  },
  missedQuestMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  missedQuestMetaIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  missedQuestMetaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  missedQuestFrequency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  missedQuestFrequencyText: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  missedQuestCompleteButton: {
    padding: 8,
  },
});

export default HabitsTracker;
