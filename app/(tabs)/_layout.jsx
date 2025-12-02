import { StatusBar } from "expo-status-bar";
import { Redirect, Tabs } from "expo-router";
import { Text, View, Animated, StyleSheet, Image } from "react-native";
import { useRef, useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

import Loader from "../../components/Loader";
import { useGlobalContext } from "../../context/GlobalProvider";
import { icons } from "../../constants";

// Dark theme colors
const COLORS = {
  background: '#0A0A0C',
  surface: '#111114',
  card: '#1A1A1F',
  border: 'rgba(255,255,255,0.1)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  accent: {
    primary: '#8B5CF6',
    home: '#8B5CF6',
    chores: '#06B6D4',
    shopping: '#10B981',
    expenses: '#F43F5E',
    profile: '#8B5CF6',
  },
};

// Tab configuration
const TAB_CONFIG = {
  home: { icon: 'home', label: 'Home', color: COLORS.accent.home, useCustomIcon: true },
  calendar: { icon: 'calendar', label: 'Calendar', color: COLORS.accent.chores },
  shopping: { icon: 'cart', label: 'Shopping', color: COLORS.accent.shopping },
  expenses: { icon: 'wallet', label: 'Expenses', color: COLORS.accent.expenses },
  profile: { icon: 'person', label: 'Profile', color: COLORS.accent.profile },
};

const TabIcon = ({ name, focused, focusAnim }) => {
  const config = TAB_CONFIG[name];
  const flashAnim = useRef(new Animated.Value(0)).current;
  
  // Flash effect on focus
  useEffect(() => {
    if (focused) {
      flashAnim.setValue(0.3);
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [focused]);
  
  const iconScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <View style={styles.tabIconContainer}>
      <Animated.View style={[styles.tabGlow, { backgroundColor: config.color, opacity: flashAnim }]} />
      <Animated.View style={[styles.tabIconWrapper, { transform: [{ scale: iconScale }] }]}>
        {config.useCustomIcon ? (
          <Image 
            source={icons.tipi}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
            tintColor={focused ? config.color : COLORS.textTertiary}
          />
        ) : (
          <Ionicons 
            name={focused ? config.icon : `${config.icon}-outline`}
            size={24}
            color={focused ? config.color : COLORS.textTertiary}
          />
        )}
      </Animated.View>
      <Text 
        style={[
          styles.tabLabel,
          { color: focused ? config.color : COLORS.textTertiary }
        ]}
        numberOfLines={1}
      >
        {config.label}
      </Text>
    </View>
  );
};

const TabLayout = () => {
  const { loading, isLogged, user, hasHousehold } = useGlobalContext();
  const [activeTab, setActiveTab] = useState('home');
  
  const focusAnims = {
    home: useRef(new Animated.Value(1)).current,
    calendar: useRef(new Animated.Value(0)).current,
    shopping: useRef(new Animated.Value(0)).current,
    expenses: useRef(new Animated.Value(0)).current,
    profile: useRef(new Animated.Value(0)).current,
  };

  const animateTab = (tabName, focused) => {
    Animated.spring(focusAnims[tabName], {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  if (!loading && !isLogged) return <Redirect href="/sign-in" />;
  if (!loading && isLogged && !hasHousehold) return <Redirect href="/(household)/onboarding" />;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: COLORS.accent.primary,
          tabBarInactiveTintColor: COLORS.textTertiary,
          tabBarShowLabel: false,
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarBackground: () => (
            <View style={styles.tabBarBackground}>
              <View style={styles.tabBarInner} />
            </View>
          ),
        }}
        screenListeners={{
          tabPress: (e) => {
            const tabName = e.target.split('-')[0];
            setActiveTab(tabName);
            Object.keys(focusAnims).forEach((key) => {
              animateTab(key, key === tabName);
            });
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => (
              <TabIcon name="home" focused={focused} focusAnim={focusAnims.home} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ focused }) => (
              <TabIcon name="calendar" focused={focused} focusAnim={focusAnims.calendar} />
            ),
          }}
        />
        <Tabs.Screen
          name="shopping"
          options={{
            title: "Shopping",
            tabBarIcon: ({ focused }) => (
              <TabIcon name="shopping" focused={focused} focusAnim={focusAnims.shopping} />
            ),
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: "Expenses",
            tabBarIcon: ({ focused }) => (
              <TabIcon name="expenses" focused={focused} focusAnim={focusAnims.expenses} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => (
              <TabIcon name="profile" focused={focused} focusAnim={focusAnims.profile} />
            ),
          }}
        />
      </Tabs>

      <Loader isLoading={loading} />
      <StatusBar backgroundColor={COLORS.background} style="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  tabBarInner: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 56,
    position: 'relative',
  },
  tabGlow: {
    position: 'absolute',
    top: 4,
    left: 12,
    right: 12,
    height: 32,
    borderRadius: 16,
    opacity: 0.15,
  },
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default TabLayout;
