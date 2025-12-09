import { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { Redirect, router } from "expo-router";
import { NativeWindStyleSheet } from "nativewind";
import { 
  Text, 
  View, 
  ScrollView, 
  StyleSheet, 
  Animated, 
  Dimensions,
  TouchableOpacity,
  Image 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import Loader from "../components/Loader";
import { useGlobalContext } from "../context/GlobalProvider";
import { useTranslation } from "../hooks/useTranslation";
import { images } from "../constants";

NativeWindStyleSheet.setOutput({
  default: "native",
});

const { width } = Dimensions.get("window");

const COLORS = {
  bg: '#0A0A0C',
  card: '#18181B',
  accent: '#F43F5E',
  accentSecondary: '#8B5CF6',
  cyan: '#06B6D4',
  green: '#10B981',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
};

// Feature item for the landing page
const FeatureItem = ({ icon, color, title, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <Animated.View 
      style={[
        styles.featureItem,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={[styles.featureIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.featureText}>{title}</Text>
    </Animated.View>
  );
};

export default function App() {
  const { loading, isLogged } = useGlobalContext();
  const t = useTranslation();
  
  // Animations
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    // Staggered animation sequence
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(buttonSlide, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  if (!loading && isLogged) return <Redirect href="/home" />;

  return (
    <SafeAreaView style={styles.container}>
      <Loader isLoading={loading} />
      
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(244, 63, 94, 0.1)', 'transparent', 'rgba(139, 92, 246, 0.05)']}
        style={styles.backgroundGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <Animated.View 
          style={[
            styles.logoContainer,
            { 
              opacity: logoOpacity,
              transform: [{ scale: logoScale }]
            }
          ]}
        >
          <Image
            source={images.logo}
            style={styles.logo}
            resizeMode="cover"
          />
          
          <Text style={styles.appName}>{t("landing.appName")}</Text>
          <Text style={styles.tagline}>{t("landing.tagline")}</Text>
        </Animated.View>

        {/* Features */}
        <Animated.View style={[styles.featuresContainer, { opacity: contentOpacity }]}>
          <FeatureItem 
            icon="checkbox-outline" 
            color={COLORS.cyan} 
            title={t("landing.featureChores")} 
            delay={200}
          />
          <FeatureItem 
            icon="cart-outline" 
            color={COLORS.green} 
            title={t("landing.featureShopping")} 
            delay={300}
          />
          <FeatureItem 
            icon="wallet-outline" 
            color={COLORS.accent} 
            title={t("landing.featureExpenses")} 
            delay={400}
          />
          <FeatureItem 
            icon="document-text-outline" 
            color={COLORS.accentSecondary} 
            title={t("landing.featureDocuments")} 
            delay={500}
          />
        </Animated.View>

        {/* CTA Buttons */}
        <Animated.View 
          style={[
            styles.ctaContainer,
            { 
              opacity: contentOpacity,
              transform: [{ translateY: buttonSlide }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push("/sign-up")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.accent, '#E11D48']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="person-add" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>{t("landing.getStarted")}</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push("/sign-in")}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>{t("landing.alreadyHaveAccount")}</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.accent} />
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t("landing.termsAndPrivacy")}
          </Text>
        </View>
      </ScrollView>

      <StatusBar backgroundColor={COLORS.bg} style="light" />
    </SafeAreaView>
  );
}

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
    height: '60%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
    marginBottom: 20,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  featuresContainer: {
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  ctaContainer: {
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
