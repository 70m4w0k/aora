import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow } from '../utils/visualEffects';

/**
 * RPG-Style Button Component
 * Supports multiple variants: primary, secondary, danger, success
 */
export default function RPGButton({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'danger', 'success', 'outline'
  size = 'medium', // 'small', 'medium', 'large'
  icon = null,
  iconPosition = 'left', // 'left', 'right'
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          gradient: COLORS.gradients.xp,
          glowColor: COLORS.glows.primary,
          textColor: COLORS.textPrimary,
        };
      case 'secondary':
        return {
          gradient: [COLORS.card, COLORS.elevated],
          glowColor: COLORS.glows.primary,
          textColor: COLORS.textSecondary,
        };
      case 'danger':
        return {
          gradient: COLORS.gradients.danger,
          glowColor: COLORS.glows.danger,
          textColor: COLORS.textPrimary,
        };
      case 'success':
        return {
          gradient: COLORS.gradients.success,
          glowColor: COLORS.glows.success,
          textColor: COLORS.textPrimary,
        };
      case 'outline':
        return {
          gradient: null,
          glowColor: COLORS.glows.primary,
          textColor: COLORS.accent.primary,
        };
      default:
        return {
          gradient: COLORS.gradients.xp,
          glowColor: COLORS.glows.primary,
          textColor: COLORS.textPrimary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 13,
          iconSize: 16,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
          fontSize: 18,
          iconSize: 24,
        };
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
          fontSize: 16,
          iconSize: 20,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const ButtonContent = (
    <Animated.View
      style={[
        styles.button,
        variant === 'outline' && styles.buttonOutline,
        {
          transform: [{ scale: scaleAnim }],
          opacity: disabled || loading ? 0.5 : 1,
          width: fullWidth ? '100%' : 'auto',
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          ...(variant !== 'outline' && variantStyles.gradient
            ? createGlow(variantStyles.glowColor, 0.4)
            : {}),
        },
        style,
      ]}
    >
      {variant === 'outline' ? (
        <View
          style={[
            styles.buttonOutlineContent,
            {
              borderColor: variantStyles.textColor,
              ...createGlow(variantStyles.glowColor, 0.2),
            },
          ]}
        >
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={sizeStyles.iconSize}
              color={variantStyles.textColor}
              style={styles.iconLeft}
            />
          )}
          {loading ? (
            <Text style={[styles.buttonText, { fontSize: sizeStyles.fontSize, color: variantStyles.textColor }, textStyle]}>
              Loading...
            </Text>
          ) : (
            <Text style={[styles.buttonText, { fontSize: sizeStyles.fontSize, color: variantStyles.textColor }, textStyle]}>
              {title}
            </Text>
          )}
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={sizeStyles.iconSize}
              color={variantStyles.textColor}
              style={styles.iconRight}
            />
          )}
        </View>
      ) : variantStyles.gradient ? (
        <LinearGradient
          colors={variantStyles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContent}
        >
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={sizeStyles.iconSize}
              color={variantStyles.textColor}
              style={styles.iconLeft}
            />
          )}
          {loading ? (
            <Text style={[styles.buttonText, { fontSize: sizeStyles.fontSize, color: variantStyles.textColor }, textStyle]}>
              Loading...
            </Text>
          ) : (
            <Text style={[styles.buttonText, { fontSize: sizeStyles.fontSize, color: variantStyles.textColor }, textStyle]}>
              {title}
            </Text>
          )}
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={sizeStyles.iconSize}
              color={variantStyles.textColor}
              style={styles.iconRight}
            />
          )}
        </LinearGradient>
      ) : null}
    </Animated.View>
  );

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      {ButtonContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
  },
  buttonOutlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  gradientContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

