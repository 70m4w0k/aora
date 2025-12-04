import { QuestFrequencies } from '../../../lib/appwrite';
import { getWeekNumber } from './utils';
import { COLORS } from './constants';

// Calculate statistics (optimized with parallel calls)
export const calculateStatistics = async (arcsData, questsData, userId, getQuestCompletions) => {
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

// Optimized helper to calculate streak from completions (no API call)
export const calculateStreakFromCompletions = (quest, completions) => {
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
export const calculateStreakStatistics = async (user, quests, arcs, getQuestCompletions, setStreakStatsLoading, setStreakStatistics) => {
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

// Detect missed quests (optimized - only check first 10 initially)
export const detectMissedQuests = async (user, quests, getQuestCompletions, setMissedQuests) => {
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

