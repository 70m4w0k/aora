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

import { createHousehold } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";

const CreateHousehold = () => {
  const { user, loading, refreshUser } = useGlobalContext();
  const [householdName, setHouseholdName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCreate = async () => {
    if (householdName.trim() === "") {
      return Alert.alert("Error", "Please enter a household name");
    }

    setIsSubmitting(true);

    try {
      const newHousehold = await createHousehold(householdName.trim(), user.$id);
      
      // Refresh user data to get updated householdId
      await refreshUser();
      
      Alert.alert(
        "Household Created! 🏠",
        `Your household "${newHousehold.name}" has been created!\n\nInvite Code: ${newHousehold.inviteCode}\n\nShare this code with your roommates so they can join.`,
        [
          {
            text: "Got it!",
            onPress: () => router.replace("/(tabs)/home"),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
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
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333333" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="home-plus" size={48} color="#4CAF50" />
            </View>
            <Text style={styles.title}>Create Your Household</Text>
            <Text style={styles.subtitle}>
              Give your household a name. You can change this later.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.inputLabel}>Household Name</Text>
            <TextInput
              style={styles.input}
              value={householdName}
              onChangeText={setHouseholdName}
              placeholder="e.g., Apartment 4B, The Cozy House"
              placeholderTextColor="#999999"
              maxLength={50}
            />
            <Text style={styles.charCount}>{householdName.length}/50</Text>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#2196F3" />
              <Text style={styles.infoText}>
                After creating your household, you'll receive an invite code to share with your roommates.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.createButton,
              isSubmitting && styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={isSubmitting}
          >
            <Text style={styles.createButtonText}>
              {isSubmitting ? "Creating..." : "Create Household"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    borderRadius: 48,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
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
  form: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333333",
  },
  charCount: {
    fontSize: 12,
    color: "#999999",
    textAlign: "right",
    marginTop: 4,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1565C0",
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  createButtonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CreateHousehold;
