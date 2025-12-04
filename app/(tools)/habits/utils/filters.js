import { COLORS } from '../constants';

/**
 * Filter and Sort Utilities
 * Functions for filtering and sorting quests
 */

/**
 * Filter quests based on filter criteria
 */
export function filterQuests(quests, filters, arcs) {
  let filtered = [...quests];

  // Filter by arc
  if (filters.arcId) {
    filtered = filtered.filter((quest) => {
      const questArcId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
      return questArcId === filters.arcId;
    });
  }

  // Filter by status
  if (filters.status) {
    // Note: This requires quest completions data, which should be passed separately
    // For now, we'll return all quests and let the component handle status filtering
  }

  // Filter by rarity
  if (filters.rarity) {
    filtered = filtered.filter((quest) => {
      const xpReward = quest.xpPerCompletion || 10;
      const questRarity = getQuestRarity(xpReward);
      return questRarity === filters.rarity;
    });
  }

  return filtered;
}

/**
 * Sort quests based on sort criteria
 */
export function sortQuests(quests, sortBy, questStreaks = {}) {
  const sorted = [...quests];

  switch (sortBy) {
    case 'streak':
      sorted.sort((a, b) => {
        const streakA = questStreaks[a.$id] || 0;
        const streakB = questStreaks[b.$id] || 0;
        return streakB - streakA; // Descending
      });
      break;

    case 'xp':
      sorted.sort((a, b) => {
        const xpA = a.xpPerCompletion || 0;
        const xpB = b.xpPerCompletion || 0;
        return xpB - xpA; // Descending
      });
      break;

    case 'name':
      sorted.sort((a, b) => {
        return (a.name || '').localeCompare(b.name || '');
      });
      break;

    default:
      // Default: keep original order
      break;
  }

  return sorted;
}

/**
 * Get quest rarity based on XP reward
 */
export function getQuestRarity(xpReward) {
  if (xpReward >= 50) return 'legendary';
  if (xpReward >= 30) return 'epic';
  if (xpReward >= 20) return 'rare';
  return 'common';
}

/**
 * Filter quests by status
 */
export function filterQuestsByStatus(quests, status, questCompletions = {}, today = new Date()) {
  if (!status) return quests;

  const todayStr = today.toISOString().split('T')[0];

  switch (status) {
    case 'active':
      return quests.filter((quest) => !questCompletions[quest.$id]);

    case 'completed':
      return quests.filter((quest) => questCompletions[quest.$id]);

    case 'missed':
      // This would require more complex logic to determine missed quests
      // For now, return empty array
      return [];

    default:
      return quests;
  }
}

/**
 * Apply all filters and sorting to quests
 */
export function applyFiltersAndSort(quests, filters, options = {}) {
  const {
    arcs = [],
    questStreaks = {},
    questCompletions = {},
    today = new Date(),
  } = options;

  let result = filterQuests(quests, filters, arcs);

  // Apply status filter if needed
  if (filters.status) {
    result = filterQuestsByStatus(result, filters.status, questCompletions, today);
  }

  // Apply sorting
  if (filters.sortBy) {
    result = sortQuests(result, filters.sortBy, questStreaks);
  }

  return result;
}

