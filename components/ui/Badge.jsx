import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '../../constants';

const Badge = ({ label, variant = 'default', size = 'md', dot = false, style, ...props }) => {
  if (dot) {
    return <View style={[styles.dot, styles[`${variant}Bg`], size === 'sm' && styles.dotSm, style]} {...props} />;
  }
  return (
    <View style={[styles.badge, styles[`${variant}Bg`], size === 'sm' && styles.badgeSm, style]} {...props}>
      <Text style={[styles.text, styles[`${variant}Text`], size === 'sm' && styles.textSm]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.chip, alignSelf: 'flex-start' },
  badgeSm: { paddingHorizontal: spacing.xs + 2, paddingVertical: 2 },
  text: { fontSize: 12, fontWeight: '600' },
  textSm: { fontSize: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotSm: { width: 6, height: 6, borderRadius: 3 },
  defaultBg: { backgroundColor: colors.background.elevated },
  successBg: { backgroundColor: `${colors.semantic.success}20` },
  warningBg: { backgroundColor: `${colors.semantic.warning}20` },
  errorBg: { backgroundColor: `${colors.semantic.error}20` },
  infoBg: { backgroundColor: `${colors.semantic.info}20` },
  primaryBg: { backgroundColor: `${colors.accent.primary}20` },
  defaultText: { color: colors.text.secondary },
  successText: { color: colors.semantic.success },
  warningText: { color: colors.semantic.warning },
  errorText: { color: colors.semantic.error },
  infoText: { color: colors.semantic.info },
  primaryText: { color: colors.accent.primary },
});

export default Badge;

