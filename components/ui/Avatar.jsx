import React from 'react';
import { View, Image, Text, StyleSheet, Pressable } from 'react-native';
import { colors, layout } from '../../constants';

const Avatar = ({ source, name = '', size = 'md', color, onPress, showBadge = false, style, ...props }) => {
  const sizeValue = layout.avatar[size] || layout.avatar.md;
  const initials = getInitials(name);
  const backgroundColor = color || getColorFromName(name);

  const containerStyle = [styles.container, { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 }, style];

  const content = source ? (
    <Image source={{ uri: source }} style={[styles.image, { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 }]} />
  ) : (
    <View style={[styles.fallback, { backgroundColor, width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 }]}>
      <Text style={[styles.initials, { fontSize: sizeValue * 0.4 }]}>{initials}</Text>
    </View>
  );

  const badge = showBadge && (
    <View style={[styles.badge, { width: sizeValue * 0.3, height: sizeValue * 0.3, borderRadius: sizeValue * 0.15, right: 0, bottom: 0 }]} />
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [containerStyle, pressed && styles.pressed]} {...props}>
        {content}{badge}
      </Pressable>
    );
  }
  return <View style={containerStyle} {...props}>{content}{badge}</View>;
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
};

const getColorFromName = (name) => {
  const avatarColors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E', '#3B82F6', '#EC4899', '#84CC16'];
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const styles = StyleSheet.create({
  container: { position: 'relative' },
  image: { resizeMode: 'cover' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.text.primary, fontWeight: '600' },
  badge: { position: 'absolute', backgroundColor: colors.semantic.success, borderWidth: 2, borderColor: colors.background.primary },
  pressed: { opacity: 0.8 },
});

export default Avatar;

