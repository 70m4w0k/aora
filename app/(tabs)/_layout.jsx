import { StatusBar } from "expo-status-bar";
import { Redirect, Tabs } from "expo-router";
import { Image, Text, View, Animated } from "react-native";
import { useRef, useState } from "react";

import { icons } from "../../constants";
import Loader from "../../components/Loader";
import { useGlobalContext } from "../../context/GlobalProvider";

const TabIcon = ({ icon, color, name, focused, focusAnim }) => {
  // Width animation
  const containerWidth = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 85], // Width range from 50px to 85px
  });

  // Reverse the scale animation (bigger when unfocused)
  const iconScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.25, 1], // 25% larger when unfocused
  });

  // Move the icon up when unfocused (center it vertically)
  const iconTranslateY = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, -2], // Increased from 0 to 8 to move it down more when unfocused
  });

  return (
    <View style={{ width: 85,alignItems: 'center'}}>
      <Animated.View 
        className="items-center justify-center"
        style={{
          backgroundColor: focused ? '#f0f0f0' : 'transparent',
          borderRadius: 12,
          width: '100%',
          height: focused ? 85 : 'auto', // Full height when focused
          paddingVertical: focused ? 12 : 8, // Adjusted padding for better spacing
          marginBottom: 0, // Adjusted margin for better spacing
          marginTop: 11,
        }}
      >
        <Animated.View
          style={{
            transform: [
              { scale: iconScale },
              { translateY: iconTranslateY }
            ]
          }}
        >
          <Image
            source={icon}
            resizeMode="contain"
            tintColor={color}
            className="w-6 h-6 mb-1"
          />
        </Animated.View>
        <Animated.Text
          className="font-psemibold text-[14px] text-center"
          style={{ 
            color,
            opacity: focusAnim,
            width: '100%',
          }}
          numberOfLines={1}
        >
          {name}
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

const TabLayout = () => {
  const { loading, isLogged, user } = useGlobalContext();
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
      tension: 50,
      friction: 7,
    }).start();
  };

  if (!loading && !isLogged) return <Redirect href="/sign-in" />;
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#4F86C6",
          tabBarInactiveTintColor: "#666666",
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#E0E0E0",
            height: 65, // Reduced height
            paddingHorizontal: 10,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            shadowOpacity: 0,
            marginBottom: 0,
            paddingBottom: 0,
            borderBottomWidth: 0,
          },
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
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.tipi}
                color={color}
                name="Home"
                focused={focused}
                focusAnim={focusAnims.home}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.calendar}
                color={color}
                name="Calendar"
                focused={focused}
                focusAnim={focusAnims.calendar}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="shopping"
          options={{
            title: "Shopping",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.list}
                color={color}
                name="Shopping"
                focused={focused}
                focusAnim={focusAnims.shopping}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: "Expenses",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.calculator}
                color={color}
                name="Expenses"
                focused={focused}
                focusAnim={focusAnims.expenses}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Profile"
                focused={focused}
                focusAnim={focusAnims.profile}
              />
            ),
          }}
        />
      </Tabs>

      <Loader isLoading={loading} />
      <StatusBar backgroundColor="#FFFFFF" style="dark" />
    </View>
  );
};

export default TabLayout;
