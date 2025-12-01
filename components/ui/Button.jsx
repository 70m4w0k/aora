import React from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography, shadows } from '../../constants';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight = false,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const buttonStyle = [
    styles.base,
    styles[`${variant}Button`],
    styles[`${size}Size`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
  ];

  const iconColor = {
    primary: colors.text.primary,
    secondary: colors.accent.primary,
    ghost: colors.text.secondary,
    danger: colors.text.primary,
  }[variant];

  const iconSize = { sm: 16, md: 20, lg: 24 }[size];

  const renderContent = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'danger' ? colors.text.primary : colors.accent.primary} 
        />
      ) : (
        <>
          {icon && !iconRight && (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.iconLeft} />
          )}
          <Text style={textStyle}>{title}</Text>
          {icon && iconRight && (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.iconRight} />
          )}
        </>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [buttonStyle, pressed && !isDisabled && styles.pressed]}
      {...props}
    >
      {renderContent()}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: { borderRadius: borderRadius.button, alignItems: 'center', justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  text: { ...typography.styles.button },
  fullWidth: { width: '100%' },
  primaryButton: { backgroundColor: colors.accent.primary, ...shadows.sm },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.accent.primary },
  ghostButton: { backgroundColor: 'transparent' },
  dangerButton: { backgroundColor: colors.semantic.error },
  primaryText: { color: colors.text.primary },
  secondaryText: { color: colors.accent.primary },
  ghostText: { color: colors.text.secondary },
  dangerText: { color: colors.text.primary },
  smSize: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 36 },
  mdSize: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 48 },
  lgSize: { paddingVertical: spacing.base, paddingHorizontal: spacing.xl, minHeight: 56 },
  smText: { fontSize: 13 },
  mdText: { fontSize: 15 },
  lgText: { fontSize: 17 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
});

export default Button;

