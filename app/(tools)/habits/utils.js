import { TITLES, ACHIEVEMENTS, COLORS } from './constants';
import { QuestFrequencies, TargetTypes } from '../../../lib/appwrite';

// Helper function to check and unlock titles/achievements
export const checkTitleUnlocks = (userProgress, tiersCompleted, questsCompleted, totalXP, bestStreak) => {
  const unlocked = [];
  const currentUnlocked = userProgress?.unlockedTitles || [];
  
  // Check tier-based titles
  Object.values(TITLES).forEach(title => {
    if (title.tierRequirement && tiersCompleted >= title.tierRequirement) {
      if (!currentUnlocked.includes(title.id)) {
        unlocked.push(title);
      }
    }
    if (title.questRequirement && questsCompleted >= title.questRequirement) {
      if (!currentUnlocked.includes(title.id)) {
        unlocked.push(title);
      }
    }
    if (title.xpRequirement && totalXP >= title.xpRequirement) {
      if (!currentUnlocked.includes(title.id)) {
        unlocked.push(title);
      }
    }
    if (title.streakRequirement && bestStreak >= title.streakRequirement) {
      if (!currentUnlocked.includes(title.id)) {
        unlocked.push(title);
      }
    }
  });
  
  // Check achievements
  const achievements = [];
  const currentAchievements = userProgress?.unlockedAchievements || [];
  
  if (questsCompleted >= 1 && !currentAchievements.includes(ACHIEVEMENTS.FIRST_QUEST.id)) {
    achievements.push(ACHIEVEMENTS.FIRST_QUEST);
  }
  if (tiersCompleted >= 1 && !currentAchievements.includes(ACHIEVEMENTS.FIRST_TIER.id)) {
    achievements.push(ACHIEVEMENTS.FIRST_TIER);
  }
  if (userProgress?.globalLevel >= 10 && !currentAchievements.includes(ACHIEVEMENTS.LEVEL_10.id)) {
    achievements.push(ACHIEVEMENTS.LEVEL_10);
  }
  if (userProgress?.globalLevel >= 25 && !currentAchievements.includes(ACHIEVEMENTS.LEVEL_25.id)) {
    achievements.push(ACHIEVEMENTS.LEVEL_25);
  }
  if (userProgress?.globalLevel >= 50 && !currentAchievements.includes(ACHIEVEMENTS.LEVEL_50.id)) {
    achievements.push(ACHIEVEMENTS.LEVEL_50);
  }
  
  return { titles: unlocked, achievements };
};

// Parse unlocked titles/achievements from userProgress
export const parseUnlockedData = (progressData) => {
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
  
  return { unlockedTitles: unlockedTitlesList, unlockedAchievements: unlockedAchievementsList };
};

// Get arc progress from userProgress
export const getArcProgress = (userProgress, arcId) => {
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

// Helper function to get week number
export const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Calculate streak for a quest based on completion history
export const calculateQuestStreak = async (quest, userId, getQuestCompletions) => {
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

// Get tier progress
export const getTierProgress = async (tier, quests, userId, getQuestCompletions) => {
  if (!tier || !userId || !quests.length) {
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
              userId, 
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
    } else if (tier.targetType === TargetTypes.COUNT || tier.targetType === TargetTypes.AMOUNT) {
      // Count total quest completions for all quests in the arc - fetch in parallel
      const questCompletionsData = await Promise.all(
        arcQuests.map(async (quest) => {
          try {
            return await getQuestCompletions(quest.$id, userId);
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

// Filter quests for today based on frequency
export const filterQuestsForToday = async (quests, userId, getQuestCompletions) => {
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
    if (frequency === QuestFrequencies.WEEKLY) {
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
        
        if (completions.length < repetitions) {
          filteredQuests.push(quest);
        }
      } catch (error) {
        filteredQuests.push(quest);
      }
      continue;
    }
    
    // Monthly: show on specific dates of the month
    if (frequency === QuestFrequencies.MONTHLY) {
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const showDates = [1, 15, lastDayOfMonth];
      
      if (showDates.includes(dayOfMonth)) {
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
          
          if (completions.length < repetitions) {
            filteredQuests.push(quest);
          }
        } catch (error) {
          filteredQuests.push(quest);
        }
      }
      continue;
    }
    
    // Annual: show on specific date each year
    if (frequency === QuestFrequencies.ANNUAL) {
      if (month === 0 && dayOfMonth === 1) {
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
          
          if (completions.length === 0) {
            filteredQuests.push(quest);
          }
        } catch (error) {
          filteredQuests.push(quest);
        }
      }
      continue;
    }
    
    // Unique: show until completed (once)
    if (frequency === QuestFrequencies.UNIQUE) {
      try {
        const completions = await getQuestCompletions(quest.$id, userId);
        
        if (completions.length === 0) {
          filteredQuests.push(quest);
        }
      } catch (error) {
        filteredQuests.push(quest);
      }
      continue;
    }
  }
  
  return filteredQuests;
};

