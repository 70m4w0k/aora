import * as Haptics from 'expo-haptics';

/**
 * Haptic Feedback Utilities
 * Provides haptic feedback for different interaction types
 */

/**
 * Light haptic feedback for quest completion
 */
export const hapticQuestComplete = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Haptics not available, silently fail
  }
};

/**
 * Medium haptic feedback for general actions
 */
export const hapticAction = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    // Haptics not available, silently fail
  }
};

/**
 * Strong haptic feedback for level ups
 */
export const hapticLevelUp = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    // Haptics not available, silently fail
  }
};

/**
 * Double haptic feedback for achievements
 */
export const hapticAchievement = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 100);
  } catch (error) {
    // Haptics not available, silently fail
  }
};

/**
 * Error haptic feedback
 */
export const hapticError = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    // Haptics not available, silently fail
  }
};

/**
 * Success haptic feedback
 */
export const hapticSuccess = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    // Haptics not available, silently fail
  }
};

/**
 * Warning haptic feedback
 */
export const hapticWarning = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    // Haptics not available, silently fail
  }
};

