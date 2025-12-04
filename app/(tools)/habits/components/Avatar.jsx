import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow, getRarityColor } from '../utils/visualEffects';
import { getClassColor } from '../constants/classes';

/**
 * Avatar Component
 * Displays user avatar with progression support
 * - Initials (default)
 * - Icon (unlocked)
 * - Custom image (future)
 */
export default function Avatar({
  user,
  level = 1,
  classId = null,
  size = 80,
  showLevel = true,
  showGlow = true,
  customImage = null,
  icon = null,
}) {
  const rarityColor = getRarityColor(level);
  const classColor = classId ? getClassColor(classId) : COLORS.accent.primary;
  
  // Determine avatar content
  const getAvatarContent = () => {
    if (customImage) {
      return (
        <Image
          source={{ uri: customImage }}
          style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
        />
      );
    }
    
    if (icon) {
      return (
        <Text style={[styles.icon, { fontSize: size * 0.5 }]}>
          {icon}
        </Text>
      );
    }
    
    // Default: Initials
    const initials = user?.name
      ? user.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : user?.email?.[0]?.toUpperCase() || '?';
    
    return (
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
        {initials}
      </Text>
    );
  };

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatarContainer,
          avatarStyle,
          showGlow && createGlow(rarityColor, 0.6),
        ]}
      >
        <LinearGradient
          colors={[classColor, rarityColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, avatarStyle]}
        >
          <View style={styles.avatarContent}>
            {getAvatarContent()}
          </View>
        </LinearGradient>
      </View>
      
      {showLevel && (
        <View style={[styles.levelBadge, { backgroundColor: rarityColor }]}>
          <Text style={styles.levelText}>{level}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    borderWidth: 3,
    borderColor: COLORS.card,
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Subtle overlay
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  initials: {
    ...TYPOGRAPHY.title,
    color: COLORS.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  icon: {
    textAlign: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...createGlow(COLORS.glows.primary, 0.5),
  },
  levelText: {
    ...TYPOGRAPHY.stat,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
});

