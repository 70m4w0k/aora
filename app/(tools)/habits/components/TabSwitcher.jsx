import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '../constants';
import { createGlow } from '../utils/visualEffects';
import { hapticAction } from '../utils/haptics';

/**
 * Custom Tab Switcher Component
 * RPG-style tab navigation within a single screen
 */
export default function TabSwitcher({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'quests', label: 'Quests', icon: 'list' },
    { id: 'arcs', label: 'Arcs', icon: 'layers' },
    { id: 'progress', label: 'Progress', icon: 'stats-chart' },
    { id: 'character', label: 'Character', icon: 'person' },
  ];

  const [tabBarWidth, setTabBarWidth] = useState(0);
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (tabBarWidth > 0) {
      Animated.spring(indicatorAnim, {
        toValue: activeIndex,
        tension: 100,
        friction: 8,
        useNativeDriver: false,
      }).start();
    }
  }, [activeTab, tabBarWidth]);

  const handleTabPress = (tabId) => {
    hapticAction();
    onTabChange(tabId);
  };

  const handleTabBarLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setTabBarWidth(width);
    }
  };

  const tabWidth = tabBarWidth / tabs.length;
  const indicatorLeft = indicatorAnim.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => i * tabWidth),
  });

  return (
    <View style={styles.tabSwitcher}>
      <View style={styles.tabBar} onLayout={handleTabBarLayout}>
        {/* Animated Indicator */}
        {tabBarWidth > 0 && (
          <Animated.View
            style={[
              styles.indicator,
              {
                left: indicatorLeft,
                width: tabWidth,
              },
            ]}
          >
            <LinearGradient
              colors={COLORS.gradients?.xp || ['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}

        {/* Tab Buttons */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <Ionicons
                  name={isActive ? tab.icon : `${tab.icon}-outline`}
                  size={20}
                  color={isActive ? COLORS.textPrimary : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? COLORS.textPrimary : COLORS.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabSwitcher: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...createGlow(COLORS.glows.primary, 0.1),
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    borderRadius: 2,
    ...createGlow(COLORS.glows.primary, 0.6),
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    fontWeight: '600',
  },
});

