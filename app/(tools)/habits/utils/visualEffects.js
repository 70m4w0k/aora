import { StyleSheet } from 'react-native';
import { COLORS } from '../constants';

/**
 * Visual Effects Utility Functions
 * Provides reusable styles and utilities for RPG-style visual effects
 */

/**
 * Creates glow shadow styles for elements
 * @param {string} color - Color of the glow (from COLORS.glows)
 * @param {number} intensity - Intensity multiplier (default: 1)
 * @returns {object} StyleSheet shadow properties
 */
export const createGlow = (color = COLORS.glows.primary, intensity = 1) => {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5 * intensity,
    shadowRadius: 10 * intensity,
    elevation: 8 * intensity, // Android
  };
};

/**
 * Creates multiple shadow layers for depth
 * @param {string} color - Shadow color
 * @param {number} layers - Number of shadow layers
 * @returns {object} Combined shadow styles
 */
export const createLayeredShadow = (color = COLORS.shadows.md, layers = 2) => {
  const shadows = [];
  for (let i = 0; i < layers; i++) {
    shadows.push({
      shadowColor: color,
      shadowOffset: { width: 0, height: i * 2 },
      shadowOpacity: 0.1 + (i * 0.05),
      shadowRadius: 5 + (i * 3),
    });
  }
  // Combine shadows (React Native doesn't support multiple shadows natively)
  // Return the strongest shadow
  return shadows[layers - 1];
};

/**
 * Creates border glow effect
 * @param {string} color - Border glow color
 * @param {number} width - Border width
 * @returns {object} Border styles
 */
export const createBorderGlow = (color = COLORS.accent.primary, width = 2) => {
  return {
    borderWidth: width,
    borderColor: color,
    ...createGlow(color, 0.8),
  };
};

/**
 * Creates gradient overlay style
 * @param {string[]} colors - Array of gradient colors
 * @param {string} direction - 'horizontal' or 'vertical'
 * @returns {object} Style properties
 */
export const createGradientOverlay = (colors, direction = 'vertical') => {
  // Note: Actual gradient rendering requires LinearGradient component
  // This returns style properties for use with LinearGradient
  return {
    colors,
    start: direction === 'horizontal' ? { x: 0, y: 0 } : { x: 0, y: 0 },
    end: direction === 'horizontal' ? { x: 1, y: 0 } : { x: 0, y: 1 },
  };
};

/**
 * Creates pulsing animation style
 * @param {number} minScale - Minimum scale (default: 0.95)
 * @param {number} maxScale - Maximum scale (default: 1.05)
 * @returns {object} Style properties for animated transform
 */
export const createPulseStyle = (minScale = 0.95, maxScale = 1.05) => {
  return {
    transform: [{ scale: maxScale }],
  };
};

/**
 * Creates shimmer effect style
 * @param {string} baseColor - Base color
 * @param {string} highlightColor - Highlight color
 * @returns {object} Style properties
 */
export const createShimmerStyle = (baseColor = COLORS.elevated, highlightColor = COLORS.card) => {
  return {
    backgroundColor: baseColor,
    // Shimmer animation requires Animated component
    // This is a placeholder for shimmer implementation
  };
};

/**
 * Gets rarity color based on tier/level
 * @param {number} level - Level or tier number
 * @returns {string} Rarity color
 */
export const getRarityColor = (level) => {
  if (level >= 50) return COLORS.rarity.legendary;
  if (level >= 25) return COLORS.rarity.epic;
  if (level >= 10) return COLORS.rarity.rare;
  return COLORS.rarity.common;
};

/**
 * Gets arc gradient colors
 * @param {string} arcName - Name of the arc
 * @returns {string[]} Array of gradient colors
 */
export const getArcGradient = (arcName) => {
  const normalizedName = arcName?.toLowerCase() || '';
  
  if (normalizedName.includes('mental') || normalizedName.includes('mind')) {
    return COLORS.gradients.arc.mental;
  }
  if (normalizedName.includes('physical') || normalizedName.includes('sport') || normalizedName.includes('fitness')) {
    return COLORS.gradients.arc.physical;
  }
  if (normalizedName.includes('finance') || normalizedName.includes('money')) {
    return COLORS.gradients.arc.finance;
  }
  if (normalizedName.includes('business') || normalizedName.includes('work')) {
    return COLORS.gradients.arc.business;
  }
  if (normalizedName.includes('social')) {
    return COLORS.gradients.arc.social;
  }
  if (normalizedName.includes('couple')) {
    return COLORS.gradients.arc.couple;
  }
  if (normalizedName.includes('family')) {
    return COLORS.gradients.arc.family;
  }
  if (normalizedName.includes('health')) {
    return COLORS.gradients.arc.health;
  }
  
  // Default gradient
  return COLORS.gradients.xp;
};

/**
 * Creates card style with glow effect
 * @param {string} glowColor - Glow color
 * @param {boolean} elevated - Whether card is elevated
 * @returns {object} Card style
 */
export const createCardStyle = (glowColor = null, elevated = false) => {
  return StyleSheet.create({
    card: {
      backgroundColor: COLORS.card,
      borderRadius: 16,
      padding: 16,
      ...(glowColor ? createGlow(glowColor, 0.5) : {}),
      ...(elevated ? {
        shadowColor: COLORS.shadows.md,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      } : {}),
    },
  }).card;
};

/**
 * Creates button style with RPG aesthetics
 * @param {string} type - Button type: 'primary', 'success', 'warning', 'danger'
 * @param {boolean} glowing - Whether button should glow
 * @returns {object} Button style
 */
export const createButtonStyle = (type = 'primary', glowing = false) => {
  const colors = {
    primary: COLORS.accent.primary,
    success: COLORS.accent.success,
    warning: COLORS.accent.warning,
    danger: COLORS.accent.danger,
  };
  
  const color = colors[type] || colors.primary;
  
  return StyleSheet.create({
    button: {
      backgroundColor: color,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
      ...(glowing ? createGlow(color, 0.8) : {}),
    },
  }).button;
};

/**
 * Creates XP bar style with gradient
 * @param {number} progress - Progress percentage (0-100)
 * @param {boolean} animated - Whether bar should have glow
 * @returns {object} XP bar style
 */
export const createXPBarStyle = (progress = 0, animated = false) => {
  return StyleSheet.create({
    container: {
      height: 8,
      backgroundColor: COLORS.elevated,
      borderRadius: 4,
      overflow: 'hidden',
      ...(animated ? createGlow(COLORS.glows.xp, 0.6) : {}),
    },
    fill: {
      height: '100%',
      width: `${Math.min(100, Math.max(0, progress))}%`,
      borderRadius: 4,
    },
  });
};

/**
 * Creates level badge style
 * @param {number} level - Level number
 * @param {boolean} glowing - Whether badge should glow
 * @returns {object} Badge style
 */
export const createLevelBadgeStyle = (level, glowing = false) => {
  const rarityColor = getRarityColor(level);
  
  return StyleSheet.create({
    badge: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: COLORS.card,
      borderWidth: 3,
      borderColor: rarityColor,
      alignItems: 'center',
      justifyContent: 'center',
      ...(glowing ? createGlow(rarityColor, 0.8) : {}),
    },
    text: {
      ...TYPOGRAPHY.stat,
      color: rarityColor,
    },
  });
};

// Note: TYPOGRAPHY is exported from constants.js

