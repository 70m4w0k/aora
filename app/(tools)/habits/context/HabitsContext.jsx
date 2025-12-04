import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useGlobalContext } from '../../../../context/GlobalProvider';
import { getHouseholdTiers } from '../../../../lib/appwrite';
import {
  getHouseholdArcs,
  getHouseholdQuests,
  getQuestCompletions,
  getUserProgress,
  QuestFrequencies,
} from '../../../../lib/appwrite';
import {
  parseUnlockedData,
  getArcProgress as getArcProgressUtil,
  calculateQuestStreak as calculateQuestStreakUtil,
  getTierProgress as getTierProgressUtil,
  filterQuestsForToday as filterQuestsForTodayUtil,
} from '../utils';
import {
  calculateStatistics as calculateStatisticsUtil,
  detectMissedQuests as detectMissedQuestsUtil,
} from '../statistics';

const HabitsContext = createContext(null);

export const useHabitsContext = () => {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error('useHabitsContext must be used within HabitsProvider');
  }
  return context;
};

export const HabitsProvider = ({ children }) => {
  const { user, household } = useGlobalContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data
  const [arcs, setArcs] = useState([]);
  const [quests, setQuests] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [tierCompletions, setTierCompletions] = useState({});
  const [tierProgress, setTierProgress] = useState({});
  const [userProgress, setUserProgress] = useState(null);
  const [todayQuests, setTodayQuests] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [questPenalties, setQuestPenalties] = useState({});
  const [unlockedTitles, setUnlockedTitles] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [missedQuests, setMissedQuests] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [questStreaks, setQuestStreaks] = useState({});
  const [questCompletions, setQuestCompletions] = useState({});
  const xpBarPulse = useRef(new Animated.Value(1)).current;

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

      const { unlockedTitles: unlockedTitlesList, unlockedAchievements: unlockedAchievementsList } =
        parseUnlockedData(progressData);
      setUnlockedTitles(unlockedTitlesList);
      setUnlockedAchievements(unlockedAchievementsList);

      // Initialize with default values
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
      setTodayQuests(questsData);

      setLoading(false);

      // Load detailed data in background
      setTimeout(() => {
        loadDetailedData(arcsData, questsData, tiersData, user.$id);
      }, 100);
    } catch (error) {
      console.error('Error fetching habits data:', error);
      setLoading(false);
    }
  };

  const loadDetailedData = async (arcsData, questsData, tiersData, userId) => {
    try {
      const [tierProgressResults, todayQuestsFiltered, questStreaksResults] = await Promise.all([
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
        filterQuestsForTodayUtil(questsData, userId, QuestFrequencies, getQuestCompletions),
        Promise.all(
          questsData.slice(0, 10).map(async (quest) => {
            try {
              const streak = await calculateQuestStreakUtil(quest, userId, getQuestCompletions);
              return { questId: quest.$id, streak };
            } catch (error) {
              return { questId: quest.$id, streak: 0 };
            }
          })
        ),
      ]);

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

      // Calculate statistics in background
      setTimeout(async () => {
        try {
          const stats = await calculateStatisticsUtil(
            arcsData,
            questsData,
            userId,
            QuestFrequencies,
            require('../constants').COLORS,
            getQuestCompletions
          );
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

  useEffect(() => {
    if (household?.$id && user?.$id) {
      fetchData();
    }
  }, [household?.$id, user?.$id]);

  // Detect missed quests
  useEffect(() => {
    if (quests.length > 0 && user && notificationsEnabled) {
      detectMissedQuestsUtil({
        quests,
        user,
        QuestFrequencies,
        getQuestCompletions,
        setMissedQuests,
      });
    } else if (!notificationsEnabled) {
      setMissedQuests([]);
    }
  }, [quests, user, notificationsEnabled]);

  const getArcProgress = (arcId) => {
    return getArcProgressUtil(userProgress, arcId);
  };

  const value = {
    // Data
    arcs,
    quests,
    tiers,
    tierCompletions,
    tierProgress,
    userProgress,
    todayQuests,
    statistics,
    questPenalties,
    unlockedTitles,
    unlockedAchievements,
    missedQuests,
    notificationsEnabled,
    questStreaks,
    questCompletions,
    xpBarPulse,
    // State
    loading,
    refreshing,
    // Methods
    fetchData,
    onRefresh,
    getArcProgress,
    setNotificationsEnabled,
    setQuestPenalties,
    setTierCompletions,
    setTierProgress,
    setUserProgress,
    setQuestStreaks,
    setTodayQuests,
    setUnlockedTitles,
    setUnlockedAchievements,
    // User & Household
    user,
    household,
  };

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
};

