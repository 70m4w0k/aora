import { useRef, useEffect } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useGlobalContext } from "../../context/GlobalProvider";
import Loader from "../../components/Loader";
import { images } from "../../constants";

const COLORS = {
  bg: '#0A0A0C',
  card: '#18181B',
  elevated: '#222228',
  accent: '#F43F5E',
  green: '#10B981',
  blue: '#3B82F6',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
};

const HouseholdOnboarding = () => {
  const { user, loading } = useGlobalContext();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(150, [
        Animated.spring(card1Anim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(card2Anim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <Loader isLoading={true} />
      </SafeAreaView>
    );
  }

  const cardStyle = (anim) => ({
    opacity: anim,
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['rgba(244, 63, 94, 0.1)', 'transparent']}
        style={styles.backgroundGradient}
      />
      
      <View style={styles.content}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Image
            source={images.logo}
            style={styles.logo}
            resizeMode="cover"
          />
          
          <Text style={styles.greeting}>Hey, {user.username}! 👋</Text>
          <Text style={styles.title}>Let's set up your home</Text>
          <Text style={styles.subtitle}>
            Create a new household or join an existing one with an invite code
          </Text>
        </Animated.View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <Animated.View style={cardStyle(card1Anim)}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => router.push("/(household)/create")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[`${COLORS.green}20`, 'transparent']}
                style={styles.cardGradient}
              />
              <View style={[styles.iconContainer, { backgroundColor: `${COLORS.green}20` }]}>
                <Ionicons name="home" size={28} color={COLORS.green} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.optionTitle}>Create a Household</Text>
                <Text style={styles.optionDescription}>
                  Start fresh and invite your housemates
                </Text>
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward-circle" size={32} color={COLORS.green} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={cardStyle(card2Anim)}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => router.push("/(household)/join")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[`${COLORS.blue}20`, 'transparent']}
                style={styles.cardGradient}
              />
              <View style={[styles.iconContainer, { backgroundColor: `${COLORS.blue}20` }]}>
                <Ionicons name="people" size={28} color={COLORS.blue} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.optionTitle}>Join a Household</Text>
                <Text style={styles.optionDescription}>
                  Enter an invite code from your housemate
                </Text>
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward-circle" size={32} color={COLORS.blue} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Footer hint */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.footerText}>
            You can always change or leave your household later
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 22,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  optionsContainer: {
    flex: 1,
    gap: 16,
  },
  optionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  arrowContainer: {
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});

export default HouseholdOnboarding;
