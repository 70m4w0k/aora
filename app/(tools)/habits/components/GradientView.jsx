import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import { getArcGradient } from '../utils/visualEffects';

/**
 * GradientView Component
 * A wrapper component that adds gradient backgrounds
 */
export default function GradientView({ 
  children,
  colors,
  arcName = null,
  gradientType = 'xp', // 'xp', 'levelUp', 'success', 'warning', 'danger', or 'arc'
  direction = 'vertical', // 'vertical' or 'horizontal'
  style,
  ...props 
}) {
  // Determine gradient colors
  let gradientColors = colors;
  
  if (!gradientColors) {
    if (arcName) {
      gradientColors = getArcGradient(arcName);
    } else {
      switch (gradientType) {
        case 'xp':
          gradientColors = COLORS.gradients.xp;
          break;
        case 'levelUp':
          gradientColors = COLORS.gradients.levelUp;
          break;
        case 'success':
          gradientColors = COLORS.gradients.success;
          break;
        case 'warning':
          gradientColors = COLORS.gradients.warning;
          break;
        case 'danger':
          gradientColors = COLORS.gradients.danger;
          break;
        default:
          gradientColors = COLORS.gradients.xp;
      }
    }
  }

  const start = direction === 'horizontal' ? { x: 0, y: 0 } : { x: 0, y: 0 };
  const end = direction === 'horizontal' ? { x: 1, y: 0 } : { x: 0, y: 1 };

  return (
    <LinearGradient
      colors={gradientColors}
      start={start}
      end={end}
      style={[styles.gradient, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    // Gradient styles
  },
});

