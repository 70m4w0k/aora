// Dark theme colors - consistent with app
export const COLORS = {
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

// Titles & Achievements System
export const TITLES = {
  // Tier-based titles (unlocked by completing tiers)
  NOVICE: { id: 'novice', name: 'Novice', description: 'Completed your first tier', icon: '🌱', tierRequirement: 1 },
  APPRENTICE: { id: 'apprentice', name: 'Apprentice', description: 'Completed 3 tiers', icon: '📚', tierRequirement: 3 },
  JOURNEYMAN: { id: 'journeyman', name: 'Journeyman', description: 'Completed 5 tiers', icon: '⚒️', tierRequirement: 5 },
  EXPERT: { id: 'expert', name: 'Expert', description: 'Completed 10 tiers', icon: '🎓', tierRequirement: 10 },
  MASTER: { id: 'master', name: 'Master', description: 'Completed 20 tiers', icon: '👑', tierRequirement: 20 },
  GRANDMASTER: { id: 'grandmaster', name: 'Grandmaster', description: 'Completed 50 tiers', icon: '🌟', tierRequirement: 50 },
  
  // Quest-based achievements
  QUEST_STARTER: { id: 'quest_starter', name: 'Quest Starter', description: 'Completed 10 quests', icon: '⭐', questRequirement: 10 },
  QUEST_MASTER: { id: 'quest_master', name: 'Quest Master', description: 'Completed 100 quests', icon: '🏆', questRequirement: 100 },
  STREAK_KEEPER: { id: 'streak_keeper', name: 'Streak Keeper', description: 'Maintained a 7-day streak', icon: '🔥', streakRequirement: 7 },
  STREAK_LEGEND: { id: 'streak_legend', name: 'Streak Legend', description: 'Maintained a 30-day streak', icon: '💫', streakRequirement: 30 },
  
  // XP-based achievements
  XP_COLLECTOR: { id: 'xp_collector', name: 'XP Collector', description: 'Earned 1000 XP', icon: '💎', xpRequirement: 1000 },
  XP_HUNTER: { id: 'xp_hunter', name: 'XP Hunter', description: 'Earned 5000 XP', icon: '🎯', xpRequirement: 5000 },
  XP_LEGEND: { id: 'xp_legend', name: 'XP Legend', description: 'Earned 10000 XP', icon: '✨', xpRequirement: 10000 },
};

export const ACHIEVEMENTS = {
  FIRST_QUEST: { id: 'first_quest', name: 'First Steps', description: 'Completed your first quest', icon: '🎯', type: 'quest' },
  FIRST_TIER: { id: 'first_tier', name: 'Milestone', description: 'Completed your first tier', icon: '🏅', type: 'tier' },
  LEVEL_10: { id: 'level_10', name: 'Rising Star', description: 'Reached level 10', icon: '⭐', type: 'level', requirement: 10 },
  LEVEL_25: { id: 'level_25', name: 'Veteran', description: 'Reached level 25', icon: '🌟', type: 'level', requirement: 25 },
  LEVEL_50: { id: 'level_50', name: 'Elite', description: 'Reached level 50', icon: '💫', type: 'level', requirement: 50 },
  PERFECT_WEEK: { id: 'perfect_week', name: 'Perfect Week', description: 'Completed all daily quests for a week', icon: '📅', type: 'streak' },
};

