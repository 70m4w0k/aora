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
  
  // RPG-inspired gradients
  gradients: {
    xp: ['#8B5CF6', '#EC4899', '#F59E0B'], // Purple → Pink → Gold
    levelUp: ['#F59E0B', '#EF4444'], // Gold → Red
    arc: {
      mental: ['#6366F1', '#8B5CF6'],
      physical: ['#22C55E', '#10B981'],
      finance: ['#F59E0B', '#F97316'],
      business: ['#3B82F6', '#2563EB'],
      social: ['#EC4899', '#DB2777'],
      couple: ['#F472B6', '#EC4899'],
      family: ['#A855F7', '#9333EA'],
      health: ['#10B981', '#059669'],
    },
    success: ['#22C55E', '#16A34A'],
    warning: ['#F59E0B', '#D97706'],
    danger: ['#EF4444', '#DC2626'],
  },
  
  // Glow effects for shadows
  glows: {
    primary: 'rgba(139, 92, 246, 0.3)',
    success: 'rgba(34, 197, 94, 0.3)',
    warning: 'rgba(245, 158, 11, 0.3)',
    danger: 'rgba(239, 68, 68, 0.3)',
    xp: 'rgba(139, 92, 246, 0.4)',
    levelUp: 'rgba(245, 158, 11, 0.5)',
  },
  
  // Rarity system colors
  rarity: {
    common: '#71717A',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
  },
  
  // Shadow colors for depth
  shadows: {
    sm: 'rgba(0, 0, 0, 0.1)',
    md: 'rgba(0, 0, 0, 0.2)',
    lg: 'rgba(0, 0, 0, 0.3)',
    glow: 'rgba(139, 92, 246, 0.2)',
  },
};

// RPG-inspired Typography System
// Using Poppins (already loaded) with system fallbacks
// Note: Can be enhanced with Orbitron/Cinzel fonts later if desired
export const TYPOGRAPHY = {
  // Hero text - Large, bold, for main titles
  hero: {
    fontFamily: 'Poppins-Black',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 56,
  },
  
  // Title - Section headers, card titles
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  
  // Subtitle - Secondary headers
  subtitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 26,
  },
  
  // Body - Main content text
  body: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 20,
  },
  
  // Stat - Numbers, XP, levels (monospace for alignment)
  stat: {
    fontFamily: 'Courier', // System monospace
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  
  // Label - Small labels, captions
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  
  // Button - Button text
  button: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  
  // Special - Achievement names, titles
  special: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 28,
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

// Export classes
export { CLASSES, getClassById, getClassName, getClassIcon, getClassColor } from './constants/classes';

