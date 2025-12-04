/**
 * Character Classes System
 * Defines available character classes with their properties
 */

export const CLASSES = {
  MERCHANT: {
    id: 'merchant',
    name: 'Merchant',
    description: 'Master of trade and commerce. Excels in financial and business quests.',
    icon: '💼',
    color: '#F59E0B', // Gold
    characteristics: [
      'Financial acumen',
      'Business strategy',
      'Negotiation skills',
      'Market analysis',
    ],
    bonuses: {
      finance: 1.1, // 10% bonus XP for finance quests
      business: 1.1,
    },
  },
  WARRIOR: {
    id: 'warrior',
    name: 'Warrior',
    description: 'Champion of physical strength and discipline. Excels in physical and health quests.',
    icon: '⚔️',
    color: '#EF4444', // Red
    characteristics: [
      'Physical strength',
      'Endurance',
      'Discipline',
      'Combat readiness',
    ],
    bonuses: {
      physical: 1.1,
      health: 1.1,
    },
  },
  SAGE: {
    id: 'sage',
    name: 'Sage',
    description: 'Seeker of knowledge and wisdom. Excels in mental and learning quests.',
    icon: '📚',
    color: '#6366F1', // Indigo
    characteristics: [
      'Intellectual prowess',
      'Meditation mastery',
      'Learning ability',
      'Mental clarity',
    ],
    bonuses: {
      mental: 1.1,
    },
  },
  GUARDIAN: {
    id: 'guardian',
    name: 'Guardian',
    description: 'Protector of relationships and family bonds. Excels in social and family quests.',
    icon: '🛡️',
    color: '#22C55E', // Green
    characteristics: [
      'Social connection',
      'Family bonds',
      'Relationship building',
      'Emotional intelligence',
    ],
    bonuses: {
      social: 1.1,
      couple: 1.1,
      family: 1.1,
    },
  },
  WANDERER: {
    id: 'wanderer',
    name: 'Wanderer',
    description: 'Jack of all trades. Balanced across all arc types.',
    icon: '🌍',
    color: '#8B5CF6', // Purple
    characteristics: [
      'Versatility',
      'Adaptability',
      'Balanced growth',
      'Exploration',
    ],
    bonuses: {
      // No specific bonuses, but balanced
    },
  },
};

/**
 * Get class by ID
 */
export const getClassById = (classId) => {
  return Object.values(CLASSES).find(cls => cls.id === classId) || CLASSES.WANDERER;
};

/**
 * Get class display name
 */
export const getClassName = (classId) => {
  return getClassById(classId).name;
};

/**
 * Get class icon
 */
export const getClassIcon = (classId) => {
  return getClassById(classId).icon;
};

/**
 * Get class color
 */
export const getClassColor = (classId) => {
  return getClassById(classId).color;
};

