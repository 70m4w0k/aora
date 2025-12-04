import { QuestFrequencies } from '../../../lib/appwrite';
import { 
  checkTitleUnlocks, 
  parseUnlockedData,
  calculateQuestStreak as calculateQuestStreakUtil,
  getTierProgress as getTierProgressUtil
} from './utils';
import {
  getUserProgress,
  completeQuest,
  completeTier,
  calculateMissedRecurrences,
  calculatePenaltyXP,
} from '../../../lib/appwrite';

// Handle completing a quest
export const handleCompleteQuest = async ({
  quest,
  user,
  household,
  quests,
  arcs,
  tiers,
  getQuestCompletions,
  // State setters
  setQuestCompletions,
  setUserProgress,
  setQuestStreaks,
  setTodayQuests,
  setUnlockedTitles,
  setUnlockedAchievements,
  setTierProgress,
  // UI callbacks
  showXPNotification,
  showTitleUnlock,
  showLevelUp,
  showAlert,
  setAlertModalVisible,
}) => {
  try {
    const arcId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
    const xpEarned = quest.xpPerCompletion || 10;
    
    // Calculate current streak before completion
    const currentStreak = await calculateQuestStreakUtil(quest, user.$id, getQuestCompletions);
    
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
      for (const completions of allQuestCompletions) {
        if (completions.length > 0) {
          const streak = await calculateQuestStreakUtil({ frequency: quest.frequency, $id: quest.$id }, user.$id, async () => completions);
          bestStreak = Math.max(bestStreak, streak);
        }
      }
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
      const arc = arcs.find(a => a.$id === arcId);
      setTimeout(() => {
        showLevelUp('arc', newArcLevel, xpEarned, arc);
      }, 500);
    }
    
    // Update unlocked titles/achievements in state
    if (newTitles.length > 0 || newAchievements.length > 0) {
      const { unlockedTitles: unlockedTitlesList, unlockedAchievements: unlockedAchievementsList } = parseUnlockedData(updatedProgress);
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
          const progress = await getTierProgressUtil(tier, quests, user.$id, getQuestCompletions);
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

// Handle completing a tier
export const handleCompleteTier = async ({
  tier,
  user,
  household,
  arcs,
  getUserProgress,
  completeTier,
  // UI callbacks
  showXPNotification,
  showTitleUnlock,
  showLevelUp,
  showAlert,
  setAlertModalVisible,
  fetchData,
}) => {
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
      const arc = arcs.find(a => a.$id === arcId);
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

