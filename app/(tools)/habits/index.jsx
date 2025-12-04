import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Animated,
  Alert,
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
  getXpHistory,
} from '../../../lib/appwrite';

// Import constants, components, and utilities
import { COLORS, TITLES, ACHIEVEMENTS } from './constants';
import { checkTitleUnlocks } from './utils';
import GlobalProgressCard from './components/GlobalProgressCard';
import MissedQuestsBanner from './components/MissedQuestsBanner';
import ArcsSection from './components/ArcsSection';
import TodaysQuestsSection from './components/TodaysQuestsSection';
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
      // Handle both array and string formats from Appwrite
      let titlesArray = progressData?.unlockedTitles || [];
      if (typeof titlesArray === 'string') {
        try {
          titlesArray = JSON.parse(titlesArray);
        } catch (e) {
          titlesArray = [];
        }
      }
      const unlockedTitlesList = (Array.isArray(titlesArray) ? titlesArray : []).map(titleId => 
        Object.values(TITLES).find(t => t.id === titleId)
      ).filter(Boolean);
      
      let achievementsArray = progressData?.unlockedAchievements || [];
      if (typeof achievementsArray === 'string') {
        try {
          achievementsArray = JSON.parse(achievementsArray);
        } catch (e) {
          achievementsArray = [];
        }
      }
      const unlockedAchievementsList = (Array.isArray(achievementsArray) ? achievementsArray : []).map(achId => 
        Object.values(ACHIEVEMENTS).find(a => a.id === achId)
      ).filter(Boolean);
      
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
              const progress = await getTierProgress(tier, questsData, userId);
              return { tierId: tier.$id, progress };
            } catch (error) {
              return { tierId: tier.$id, progress: { current: 0, target: tier.targetValue || 100, percentage: 0 } };
            }
          })
        ),
        // Filter today's quests
        filterQuestsForToday(questsData, userId),
        // Calculate streaks in parallel (limit to first 10 for initial load, rest in background)
        (async () => {
          const initialQuests = questsData.slice(0, 10);
          const remainingQuests = questsData.slice(10);
          
          // Load first 10 immediately
          const initialStreaks = await Promise.all(
            initialQuests.map(async (quest) => {
              try {
                const streak = await calculateQuestStreak(quest, userId);
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
                    const streak = await calculateQuestStreak(quest, userId);
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
      
      // Calculate total quests and tiers completed for achievement checks
      let totalQuestsCompleted = 0;
      let totalTiersCompleted = 0;
      Object.values(oldArcProgress).forEach(arc => {
        totalQuestsCompleted += arc.questsCompleted || 0;
        totalTiersCompleted += arc.tiersCompleted || 0;
      });
      totalQuestsCompleted += 1; // This quest being completed
      
      // Calculate best streak from all quests
      let bestStreak = 0;
      try {
        const allQuestCompletions = await Promise.all(
          quests.map(q => getQuestCompletions(q.$id, user.$id).catch(() => []))
        );
        allQuestCompletions.forEach(completions => {
          if (completions.length > 0) {
            const streak = calculateQuestStreak({ frequency: quest.frequency }, user.$id, completions);
            bestStreak = Math.max(bestStreak, streak);
          }
        });
      } catch (error) {
        // If error, use current streak
        bestStreak = newStreak;
      }
      
      // Check for title/achievement unlocks
      const titleUnlocks = checkTitleUnlocks(
        currentProgress,
        totalTiersCompleted,
        totalQuestsCompleted,
        (currentProgress?.totalXP || 0) + xpEarned,
        bestStreak
      );
      
      const newTitles = titleUnlocks.titles.map(t => t.id);
      const newAchievements = titleUnlocks.achievements.map(a => a.id);
      
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
      
      const questArcForLog = arcs.find(a => a.$id === arcId);
      await completeQuest({
        questId: quest.$id,
        userId: user.$id,
        householdId: household.$id,
        xpEarned: xpEarned,
        arcId: arcId,
        streakCount: newStreak,
        penaltyXP: penaltyXP,
        newTitles: newTitles,
        newAchievements: newAchievements,
        questName: quest.name,
        arcName: questArcForLog?.name,
      });
      
      // Fetch updated progress (optimized - only fetch progress, not all data)
      const updatedProgress = await getUserProgress(user.$id, household.$id);
      const newLevel = updatedProgress?.globalLevel || 1;
      const newArcProgress = updatedProgress?.arcProgress ? 
        (typeof updatedProgress.arcProgress === 'string' ? JSON.parse(updatedProgress.arcProgress) : updatedProgress.arcProgress) : {};
      const newArcLevel = arcId && newArcProgress[arcId] ? newArcProgress[arcId].level : 1;
      
      // Update local state immediately (optimistic update - no full reload!)
      setQuestCompletions(prev => ({ ...prev, [quest.$id]: true }));
      setUserProgress(updatedProgress);
      
      // Update quest streaks
      setQuestStreaks(prev => ({ ...prev, [quest.$id]: newStreak }));
      
      // Update today's quests list (remove completed quest if it's daily)
      if (quest.frequency === QuestFrequencies.DAILY) {
        setTodayQuests(prev => prev.filter(q => q.$id !== quest.$id));
      }
      
      // Show XP notification
      showXPNotification(xpEarned, questArcForLog?.color);
      
      // Check for title/achievement unlocks and show celebration
      if (titleUnlocks.titles.length > 0) {
        setTimeout(() => {
          showTitleUnlock(titleUnlocks.titles[0]);
        }, 800);
      }
      if (titleUnlocks.achievements.length > 0) {
        setTimeout(() => {
          showTitleUnlock(titleUnlocks.achievements[0]);
        }, titleUnlocks.titles.length > 0 ? 2000 : 800);
      }
      
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
      
      // Update unlocked titles/achievements in state
      if (newTitles.length > 0 || newAchievements.length > 0) {
        let titlesArray = updatedProgress?.unlockedTitles || [];
        if (typeof titlesArray === 'string') {
          try {
            titlesArray = JSON.parse(titlesArray);
          } catch (e) {
            titlesArray = [];
          }
        }
        let achievementsArray = updatedProgress?.unlockedAchievements || [];
        if (typeof achievementsArray === 'string') {
          try {
            achievementsArray = JSON.parse(achievementsArray);
          } catch (e) {
            achievementsArray = [];
          }
        }
        const unlockedTitlesList = (Array.isArray(titlesArray) ? titlesArray : []).map(titleId => 
          Object.values(TITLES).find(t => t.id === titleId)
        ).filter(Boolean);
        const unlockedAchievementsList = (Array.isArray(achievementsArray) ? achievementsArray : []).map(achId => 
          Object.values(ACHIEVEMENTS).find(a => a.id === achId)
        ).filter(Boolean);
        setUnlockedTitles(unlockedTitlesList);
        setUnlockedAchievements(unlockedAchievementsList);
      }
      
      // Only refresh tier progress for affected tiers (background, non-blocking)
      const affectedTiers = tiers.filter(t => {
        const tArcId = typeof t.arcId === 'object' ? t.arcId.$id : t.arcId;
        return tArcId === arcId;
      });
      
      // Update tier progress in background (non-blocking)
      Promise.all(
        affectedTiers.map(async (tier) => {
          try {
            const progress = await getTierProgress(tier, quests, user.$id);
            setTierProgress(prev => ({ ...prev, [tier.$id]: progress }));
          } catch (error) {
            // Silent fail for background updates
          }
        })
      ).catch(() => {}); // Ignore errors in background updates
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
    try {
      const arcId = typeof tier.arcId === 'object' ? tier.arcId.$id : tier.arcId;
      const xpEarned = tier.xpReward || 100;
      
      // Get current progress before completion
      const currentProgress = await getUserProgress(user.$id, household.$id);
      const oldLevel = currentProgress?.globalLevel || 1;
      const oldArcProgress = currentProgress?.arcProgress ? 
        (typeof currentProgress.arcProgress === 'string' ? JSON.parse(currentProgress.arcProgress) : currentProgress.arcProgress) : {};
      const oldArcLevel = arcId && oldArcProgress[arcId] ? oldArcProgress[arcId].level : 1;
      
      // Calculate total tiers and quests completed
      let totalTiersCompleted = 0;
      let totalQuestsCompleted = 0;
      Object.values(oldArcProgress).forEach(arc => {
        totalTiersCompleted += arc.tiersCompleted || 0;
        totalQuestsCompleted += arc.questsCompleted || 0;
      });
      totalTiersCompleted += 1; // This tier being completed
      
      // Check for title/achievement unlocks
      const titleUnlocks = checkTitleUnlocks(
        currentProgress,
        totalTiersCompleted,
        totalQuestsCompleted,
        (currentProgress?.totalXP || 0) + xpEarned,
        0 // bestStreak - would need to calculate from quest completions
      );
      
      // Unlock tier-specific title if provided
      const newTitles = [...titleUnlocks.titles.map(t => t.id)];
      if (tier.titleReward && !currentProgress?.unlockedTitles?.includes(tier.titleReward)) {
        newTitles.push(tier.titleReward);
      }
      const newAchievements = titleUnlocks.achievements.map(a => a.id);
      
      const tierArc = arcs.find(a => a.$id === arcId);
      await completeTier({
        tierId: tier.$id,
        userId: user.$id,
        householdId: household.$id,
        xpEarned: xpEarned,
        arcId: arcId,
        newTitles: newTitles,
        newAchievements: newAchievements,
        tierName: tier.name,
        arcName: tierArc?.name,
      });
      
      // Fetch updated progress
      const updatedProgress = await getUserProgress(user.$id, household.$id);
      const newLevel = updatedProgress?.globalLevel || 1;
      const newArcProgress = updatedProgress?.arcProgress ? 
        (typeof updatedProgress.arcProgress === 'string' ? JSON.parse(updatedProgress.arcProgress) : updatedProgress.arcProgress) : {};
      const newArcLevel = arcId && newArcProgress[arcId] ? newArcProgress[arcId].level : 1;
      
      // Show XP notification
      showXPNotification(xpEarned, tierArc?.color);
      
      // Check for title unlocks and show celebration
      if (titleUnlocks.titles.length > 0) {
        setTimeout(() => {
          showTitleUnlock(titleUnlocks.titles[0]);
        }, 800);
      }
      
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
      if (!quest || !quest.$id || !userId) {
        return 0;
      }
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
    if (!user || !quests.length) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const missed = [];
    
    // Check first 10 quests immediately, rest in background
    const initialQuests = quests.slice(0, 10);
    const remainingQuests = quests.slice(10);
    
    for (const quest of initialQuests) {
      try {
        const frequency = quest.frequency || QuestFrequencies.DAILY;
        const repetitions = quest.repetitionPerPeriod || 1;
        const allCompletions = await getQuestCompletions(quest.$id, user.$id);
        
        let isMissed = false;
        let missedCount = 0;
        let lastCompleted = null;
        
        if (allCompletions.length > 0) {
          const sortedCompletions = [...allCompletions].sort((a, b) => {
            const dateA = new Date(a.completedAt || a.$createdAt);
            const dateB = new Date(b.completedAt || b.$createdAt);
            return dateB - dateA; // Most recent first
          });
          lastCompleted = new Date(sortedCompletions[0].completedAt || sortedCompletions[0].$createdAt);
        }
        
        // Daily quests: missed if not completed today
        if (frequency === QuestFrequencies.DAILY) {
          const todayCompletions = allCompletions.filter(c => {
            const completionDate = new Date(c.completedAt || c.$createdAt);
            completionDate.setHours(0, 0, 0, 0);
            return completionDate.getTime() === today.getTime();
          });
          
          if (todayCompletions.length < repetitions) {
            isMissed = true;
            missedCount = repetitions - todayCompletions.length;
          }
        }
        
        // Weekly quests: missed if not completed enough times this week
        else if (frequency === QuestFrequencies.WEEKLY) {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          
          const weekCompletions = allCompletions.filter(c => {
            const completionDate = new Date(c.completedAt || c.$createdAt);
            return completionDate >= startOfWeek;
          });
          
          if (weekCompletions.length < repetitions) {
            isMissed = true;
            missedCount = repetitions - weekCompletions.length;
          }
        }
        
        // Monthly quests: missed if not completed enough times this month
        else if (frequency === QuestFrequencies.MONTHLY) {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          startOfMonth.setHours(0, 0, 0, 0);
          
          const monthCompletions = allCompletions.filter(c => {
            const completionDate = new Date(c.completedAt || c.$createdAt);
            return completionDate >= startOfMonth;
          });
          
          if (monthCompletions.length < repetitions) {
            isMissed = true;
            missedCount = repetitions - monthCompletions.length;
          }
        }
        
        // Annual quests: missed if not completed this year
        else if (frequency === QuestFrequencies.ANNUAL) {
          const startOfYear = new Date(today.getFullYear(), 0, 1);
          startOfYear.setHours(0, 0, 0, 0);
          
          const yearCompletions = allCompletions.filter(c => {
            const completionDate = new Date(c.completedAt || c.$createdAt);
            return completionDate >= startOfYear;
          });
          
          if (yearCompletions.length === 0) {
            isMissed = true;
            missedCount = 1;
          }
        }
        
        if (isMissed) {
          missed.push({
            quest,
            missedCount,
            lastCompleted,
            daysSinceLastCompletion: lastCompleted 
              ? Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24))
              : null,
          });
        }
      } catch (error) {
        console.error(`Error detecting missed quest ${quest.$id}:`, error);
      }
    }
    
    setMissedQuests(missed);
    
    // Check remaining quests in background
    if (remainingQuests.length > 0) {
      setTimeout(async () => {
        const additionalMissed = [];
        for (const quest of remainingQuests) {
          try {
            const frequency = quest.frequency || QuestFrequencies.DAILY;
            const repetitions = quest.repetitionPerPeriod || 1;
            const allCompletions = await getQuestCompletions(quest.$id, user.$id);
            
            let isMissed = false;
            let missedCount = 0;
            let lastCompleted = null;
            
            if (allCompletions.length > 0) {
              const sortedCompletions = [...allCompletions].sort((a, b) => {
                const dateA = new Date(a.completedAt || a.$createdAt);
                const dateB = new Date(b.completedAt || b.$createdAt);
                return dateB - dateA;
              });
              lastCompleted = new Date(sortedCompletions[0].completedAt || sortedCompletions[0].$createdAt);
            }
            
            if (frequency === QuestFrequencies.DAILY) {
              const todayCompletions = allCompletions.filter(c => {
                const completionDate = new Date(c.completedAt || c.$createdAt);
                completionDate.setHours(0, 0, 0, 0);
                return completionDate.getTime() === today.getTime();
              });
              if (todayCompletions.length < repetitions) {
                isMissed = true;
                missedCount = repetitions - todayCompletions.length;
              }
            } else if (frequency === QuestFrequencies.WEEKLY) {
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - today.getDay());
              startOfWeek.setHours(0, 0, 0, 0);
              const weekCompletions = allCompletions.filter(c => {
                const completionDate = new Date(c.completedAt || c.$createdAt);
                return completionDate >= startOfWeek;
              });
              if (weekCompletions.length < repetitions) {
                isMissed = true;
                missedCount = repetitions - weekCompletions.length;
              }
            } else if (frequency === QuestFrequencies.MONTHLY) {
              const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
              startOfMonth.setHours(0, 0, 0, 0);
              const monthCompletions = allCompletions.filter(c => {
                const completionDate = new Date(c.completedAt || c.$createdAt);
                return completionDate >= startOfMonth;
              });
              if (monthCompletions.length < repetitions) {
                isMissed = true;
                missedCount = repetitions - monthCompletions.length;
              }
            }
            
            if (isMissed) {
              additionalMissed.push({
                quest,
                missedCount,
                lastCompleted,
                daysSinceLastCompletion: lastCompleted 
                  ? Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24))
                  : null,
              });
            }
          } catch (error) {
            console.error(`Error detecting missed quest ${quest.$id}:`, error);
          }
        }
        setMissedQuests(prev => [...prev, ...additionalMissed]);
      }, 1000);
    }
  };
  
  // Detect missed quests when data loads
  useEffect(() => {
    if (quests.length > 0 && user && notificationsEnabled) {
      detectMissedQuests();
    } else if (!notificationsEnabled) {
      setMissedQuests([]);
    }
  }, [quests, user, notificationsEnabled]);

  // Optimized helper to calculate streak from completions (no API call)
  const calculateStreakFromCompletions = (quest, completions) => {
    if (!completions || completions.length === 0) {
      return { current: 0, longest: 0 };
    }
    
    const frequency = quest.frequency || QuestFrequencies.DAILY;
    const sortedCompletions = completions
      .map(c => new Date(c.completedAt || c.$createdAt))
      .sort((a, b) => b - a);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate current streak
    let currentStreak = 0;
    let expectedDate = new Date(today);
    expectedDate.setHours(0, 0, 0, 0);
    
    if (frequency === QuestFrequencies.DAILY) {
      // Check if today was completed
      const todayCompleted = sortedCompletions.some(c => {
        const completionDate = new Date(c);
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === expectedDate.getTime();
      });
      
      if (!todayCompleted) {
        expectedDate.setDate(expectedDate.getDate() - 1);
      }
      
      for (const completion of sortedCompletions) {
        const completionDate = new Date(completion);
        completionDate.setHours(0, 0, 0, 0);
        
        if (completionDate.getTime() === expectedDate.getTime()) {
          currentStreak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else if (completionDate < expectedDate) {
          break;
        }
      }
    } else if (frequency === QuestFrequencies.WEEKLY) {
      const currentWeek = getWeekNumber(new Date());
      let expectedWeek = currentWeek;
      
      for (const completion of sortedCompletions) {
        const completionDate = new Date(completion);
        const completionWeek = getWeekNumber(completionDate);
        
        if (completionWeek === expectedWeek) {
          currentStreak++;
          expectedWeek--;
          if (expectedWeek < 1) expectedWeek = 52;
        } else if (completionWeek < expectedWeek) {
          break;
        }
      }
    } else if (frequency === QuestFrequencies.MONTHLY) {
      let expectedMonth = today.getMonth();
      let expectedYear = today.getFullYear();
      
      for (const completion of sortedCompletions) {
        const completionDate = new Date(completion);
        const completionMonth = completionDate.getMonth();
        const completionYear = completionDate.getFullYear();
        
        if (completionMonth === expectedMonth && completionYear === expectedYear) {
          currentStreak++;
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
    } else {
      // For other frequencies, use the streak from the most recent completion
      currentStreak = sortedCompletions[0]?.streakCount || 0;
    }
    
    // Calculate longest streak from all completions
    let longestStreak = 0;
    if (sortedCompletions.length > 0) {
      let currentStreakCount = 1;
      
      for (let i = 0; i < sortedCompletions.length - 1; i++) {
        const date1 = new Date(sortedCompletions[i]);
        const date2 = new Date(sortedCompletions[i + 1]);
        
        let isConsecutive = false;
        
        if (frequency === QuestFrequencies.DAILY) {
          date1.setHours(0, 0, 0, 0);
          date2.setHours(0, 0, 0, 0);
          const daysDiff = Math.floor((date1 - date2) / (1000 * 60 * 60 * 24));
          isConsecutive = daysDiff === 1;
        } else if (frequency === QuestFrequencies.WEEKLY) {
          const week1 = getWeekNumber(date1);
          const week2 = getWeekNumber(date2);
          const year1 = date1.getFullYear();
          const year2 = date2.getFullYear();
          isConsecutive = (week1 === week2 + 1 && year1 === year2) || 
                         (week1 === 1 && week2 === 52 && year1 === year2 + 1);
        } else if (frequency === QuestFrequencies.MONTHLY) {
          const month1 = date1.getMonth();
          const month2 = date2.getMonth();
          const year1 = date1.getFullYear();
          const year2 = date2.getFullYear();
          isConsecutive = (month1 === month2 + 1 && year1 === year2) ||
                         (month1 === 0 && month2 === 11 && year1 === year2 + 1);
        }
        
        if (isConsecutive) {
          currentStreakCount++;
        } else {
          if (currentStreakCount > longestStreak) {
            longestStreak = currentStreakCount;
          }
          currentStreakCount = 1;
        }
      }
      
      if (currentStreakCount > longestStreak) {
        longestStreak = currentStreakCount;
      }
      
      // If no streaks found but has completions, longest is 1
      if (longestStreak === 0 && sortedCompletions.length > 0) {
        longestStreak = 1;
      }
    }
    
    return { current: currentStreak, longest: longestStreak };
  };

  // Calculate detailed streak statistics (OPTIMIZED)
  const calculateStreakStatistics = async () => {
    if (!user || !quests.length || !arcs.length) return null;
    
    setStreakStatsLoading(true);
    try {
      const stats = {
        longestStreaksPerQuest: [],
        streakBreakdownByArc: {},
        bestStreakOverall: 0,
        totalActiveStreaks: 0,
        streakMilestones: [],
        averageStreak: 0,
      };
      
      let totalStreak = 0;
      let activeStreakCount = 0;
      const arcStreaks = {}; // { arcId: { total: 0, count: 0, longest: 0, quests: [] } }
      
      // Initialize arc streaks
      arcs.forEach(arc => {
        arcStreaks[arc.$id] = {
          arcName: arc.name,
          arcColor: arc.color || COLORS.accent.primary,
          total: 0,
          count: 0,
          longest: 0,
          quests: [],
        };
      });
      
      // OPTIMIZATION: Fetch all completions in parallel first
      const completionPromises = quests.map(quest => 
        getQuestCompletions(quest.$id, user.$id).catch(() => [])
      );
      const allCompletions = await Promise.all(completionPromises);
      
      // OPTIMIZATION: Calculate streaks in parallel using the fetched completions
      const streakCalculations = quests.map((quest, index) => {
        const completions = allCompletions[index];
        const { current, longest } = calculateStreakFromCompletions(quest, completions);
        
        const arcId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
        const arc = arcs.find(a => a.$id === arcId);
        
        return {
          questId: quest.$id,
          questName: quest.name,
          currentStreak: current,
          longestStreak: longest,
          arcId,
          arcName: arc?.name || 'Unassigned',
          arcColor: arc?.color || COLORS.accent.primary,
          frequency: quest.frequency,
          totalCompletions: completions.length,
        };
      });
      
      // Process all calculated streaks
      for (const questData of streakCalculations) {
        stats.longestStreaksPerQuest.push(questData);
        
        // Update arc statistics
        if (questData.arcId && arcStreaks[questData.arcId]) {
          arcStreaks[questData.arcId].total += questData.currentStreak;
          arcStreaks[questData.arcId].count++;
          if (questData.currentStreak > arcStreaks[questData.arcId].longest) {
            arcStreaks[questData.arcId].longest = questData.currentStreak;
          }
          arcStreaks[questData.arcId].quests.push({
            questName: questData.questName,
            currentStreak: questData.currentStreak,
            longestStreak: questData.longestStreak,
          });
        }
        
        if (questData.currentStreak > 0) {
          activeStreakCount++;
          totalStreak += questData.currentStreak;
        }
        
        if (questData.currentStreak > stats.bestStreakOverall) {
          stats.bestStreakOverall = questData.currentStreak;
        }
      }
      
      // Sort longest streaks per quest
      stats.longestStreaksPerQuest.sort((a, b) => b.longestStreak - a.longestStreak);
      
      // Convert arc streaks to array
      stats.streakBreakdownByArc = Object.values(arcStreaks)
        .filter(arc => arc.count > 0)
        .sort((a, b) => b.longest - a.longest);
      
      // Calculate average streak
      stats.averageStreak = activeStreakCount > 0 ? Math.round((totalStreak / activeStreakCount) * 10) / 10 : 0;
      stats.totalActiveStreaks = activeStreakCount;
      
      // Calculate streak milestones
      const milestoneThresholds = [1, 3, 7, 14, 30, 60, 90, 100, 180, 365];
      stats.streakMilestones = milestoneThresholds.map(threshold => {
        const questsReached = stats.longestStreaksPerQuest.filter(q => q.longestStreak >= threshold);
        return {
          threshold,
          questsReached: questsReached.length,
          quests: questsReached.map(q => q.questName),
        };
      });
      
      setStreakStatistics(stats);
      return stats;
    } catch (error) {
      console.error('Error calculating streak statistics:', error);
      return null;
    } finally {
      setStreakStatsLoading(false);
    }
  };
  
  // Load streak statistics when modal opens
  useEffect(() => {
    if (streakStatsModalVisible && user && quests.length > 0) {
      calculateStreakStatistics();
    }
  }, [streakStatsModalVisible]);

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
        {/* Global Progress Card */}
        <GlobalProgressCard
          userProgress={userProgress}
          unlockedTitles={unlockedTitles}
          unlockedAchievements={unlockedAchievements}
          xpBarPulse={xpBarPulse}
          onPressTitles={() => setTitlesAchievementsModalVisible(true)}
          onPressXpHistory={() => setXpHistoryModalVisible(true)}
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

        {/* Today's Quests Section */}
        <TodaysQuestsSection
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
