import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { images } from "../../constants";
import { useGlobalContext } from "../../context/GlobalProvider";

const HouseholdOnboarding = () => {
  const { user, loading } = useGlobalContext();

  // Show loading while user data is being fetched
  if (loading || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F86C6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={images.logo}
            resizeMode="contain"
            style={styles.logo}
          />
          <Text style={styles.title}>Welcome, {user.username}!</Text>
          <Text style={styles.subtitle}>
            Let's get you set up with your household
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.push("/(household)/create")}
          >
            <View style={[styles.iconContainer, { backgroundColor: "#E8F5E9" }]}>
              <MaterialCommunityIcons name="home-plus" size={40} color="#4CAF50" />
            </View>
            <Text style={styles.optionTitle}>Create a Household</Text>
            <Text style={styles.optionDescription}>
              Start a new household and invite your roommates to join
            </Text>
            <View style={styles.arrowContainer}>
              <MaterialCommunityIcons name="arrow-right" size={24} color="#4CAF50" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.push("/(household)/join")}
          >
            <View style={[styles.iconContainer, { backgroundColor: "#E3F2FD" }]}>
              <MaterialCommunityIcons name="account-group" size={40} color="#2196F3" />
            </View>
            <Text style={styles.optionTitle}>Join a Household</Text>
            <Text style={styles.optionDescription}>
              Enter an invite code to join an existing household
            </Text>
            <View style={styles.arrowContainer}>
              <MaterialCommunityIcons name="arrow-right" size={24} color="#2196F3" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
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
    width: 120,
    height: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
  },
  optionsContainer: {
    flex: 1,
    gap: 20,
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 16,
  },
  arrowContainer: {
    position: "absolute",
    right: 24,
    top: "50%",
    marginTop: -12,
  },
});

export default HouseholdOnboarding;
