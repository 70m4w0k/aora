import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../../constants';

const Card = ({ 
  children, 
  variant = 'default', 
  onPress, 
  style, 
  noPadding = false,
  ...props 
}) => {
  const cardStyle = [
    styles.base,
    styles[variant],
    !noPadding && styles.padding,
    style,
  ];

  if (onPress) {
    return (
      <Pressable 
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && styles.pressed,
        ]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
  },
  padding: {
    padding: spacing.card.padding,
  },
  default: {
    backgroundColor: colors.background.tertiary,
  },
  elevated: {
    backgroundColor: colors.background.tertiary,
    ...shadows.md,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.surface.glassBorder,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

export default Card;

