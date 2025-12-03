import { TITLES, ACHIEVEMENTS } from './constants';

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

