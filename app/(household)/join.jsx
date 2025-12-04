import { useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { joinHousehold } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { useTranslation } from "../../hooks/useTranslation";

const JoinHousehold = () => {
  const { user, loading, refreshUser } = useGlobalContext();
  const t = useTranslation();
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show loading while user data is being fetched
  if (loading || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F86C6" />
          <Text style={styles.loadingText}>{t("common.loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleJoin = async () => {
    if (inviteCode.trim().length !== 6) {
      return Alert.alert(t("common.error"), t("household.enterValidCode"));
    }

    setIsSubmitting(true);

    try {
      const household = await joinHousehold(inviteCode.trim(), user.$id);
      
      // Refresh user data to get updated householdId
      await refreshUser();
      
      Alert.alert(
        t("household.welcomeTitle"),
        t("household.joinMessage").replace("{{name}}", household.name),
        [
          {
            text: t("household.letsGo"),
            onPress: () => router.replace("/(tabs)/home"),
          },
        ]
      );
    } catch (error) {
      Alert.alert(t("common.error"), error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format invite code as user types (uppercase, no spaces)
  const handleCodeChange = (text) => {
    const formatted = text.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setInviteCode(formatted);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="account-group" size={48} color="#3B82F6" />
            </View>
            <Text style={styles.title}>{t("household.joinTitle")}</Text>
            <Text style={styles.subtitle}>
              {t("household.joinSubtitle")}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.inputLabel}>{t("household.inviteCode")}</Text>
            <TextInput
              style={styles.codeInput}
              value={inviteCode}
              onChangeText={handleCodeChange}
              placeholder="ABC123"
              placeholderTextColor="#CCCCCC"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Text style={styles.helperText}>
              {inviteCode.length}/6 {t("household.characters")}
            </Text>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="help-circle-outline" size={20} color="#F59E0B" />
              <Text style={styles.infoText}>
                {t("household.joinInfo")}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.joinButton,
              (isSubmitting || inviteCode.length !== 6) && styles.joinButtonDisabled,
            ]}
            onPress={handleJoin}
            disabled={isSubmitting || inviteCode.length !== 6}
          >
            <Text style={styles.joinButtonText}>
              {isSubmitting ? t("household.joining") : t("household.joinHousehold")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const COLORS = {
  bg: '#0A0A0C',
  card: '#18181B',
  elevated: '#27272A',
  border: '#3F3F46',
  accent: '#3B82F6',
  warning: '#F59E0B',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: `${COLORS.accent}20`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    letterSpacing: 8,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: `${COLORS.warning}15`,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.warning,
    lineHeight: 20,
  },
  joinButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default JoinHousehold;
