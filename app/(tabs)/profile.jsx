import { router } from "expo-router";
import { useCallback, useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  View, 
  Image, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Share,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';

import { icons } from "../../constants";
import { getAllTasksDone, signOut, leaveHousehold, regenerateInviteCode } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";

const ProfileCard = ({ title, value, icon, bgColor }) => (
  <View style={[styles.profileCard, { backgroundColor: bgColor || "#F0F0F0" }]}>
    <View style={styles.profileCardContent}>
      <Text style={styles.profileCardValue}>{value}</Text>
      <Text style={styles.profileCardTitle}>{title}</Text>
    </View>
    {icon && (
      <View style={styles.profileCardIcon}>
        {icon}
      </View>
    )}
  </View>
);

const Profile = () => {
  const { user, setUser, setIsLogged, household, householdMembers, refreshUser, refreshHousehold } = useGlobalContext();
  const [stats, setStats] = useState({
    completedTasks: 0,
    tasksPerWeek: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  const fetchUserStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const tasksDone = await getAllTasksDone();
      const userTasksDone = tasksDone.filter(
        task => task.userId && task.userId.$id === user.$id
      );
      
      const tasksPerWeek = userTasksDone.length > 0 
        ? (userTasksDone.length / 52).toFixed(1) 
        : 0;
      
      setStats({
        completedTasks: userTasksDone.length,
        tasksPerWeek,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [fetchUserStats, user]);

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setIsLogged(false);
      router.replace("/sign-in");
    } catch (error) {
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const copyInviteCode = async () => {
    if (household?.inviteCode) {
      await Clipboard.setStringAsync(household.inviteCode);
      Alert.alert("Copied!", "Invite code copied to clipboard");
    }
  };

  const shareInviteCode = async () => {
    if (household?.inviteCode) {
      try {
        await Share.share({
          message: `Join my household "${household.name}" on the Roommate app!\n\nInvite Code: ${household.inviteCode}`,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
  };

  const handleRegenerateCode = () => {
    Alert.alert(
      "Regenerate Invite Code?",
      "This will invalidate the current invite code. Anyone with the old code won't be able to join.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          style: "destructive",
          onPress: async () => {
            try {
              await regenerateInviteCode(household.$id);
              await refreshHousehold();
              Alert.alert("Success", "New invite code generated!");
            } catch (error) {
              Alert.alert("Error", "Failed to regenerate code");
            }
          },
        },
      ]
    );
  };

  const handleLeaveHousehold = () => {
    const warningMessage = isAdmin 
      ? "You are the admin of this household. If you leave, the household will remain but without an admin. Are you sure?"
      : "Are you sure you want to leave this household?";

    Alert.alert(
      "Leave Household?",
      warningMessage,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveHousehold(user.$id);
              await refreshUser();
              router.replace("/(household)/onboarding");
            } catch (error) {
              Alert.alert("Error", "Failed to leave household");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Image
              source={icons.logout}
              style={styles.logoutIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user?.avatar }}
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>
          
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          <View style={styles.statsContainer}>
            <ProfileCard 
              title="Completed Tasks" 
              value={stats.completedTasks}
              bgColor="#E3F2FD"
              icon={<Text style={styles.iconText}>📅</Text>}
            />
            <ProfileCard 
              title="Tasks Per Week" 
              value={stats.tasksPerWeek}
              bgColor="#FFF3E0"
              icon={<Text style={styles.iconText}>📊</Text>}
            />
          </View>
        </View>

        {/* Household Section */}
        <View style={styles.householdSection}>
          <Text style={styles.sectionTitle}>🏠 Household</Text>
          
          {household ? (
            <>
              <View style={styles.householdCard}>
                <View style={styles.householdHeader}>
                  <Text style={styles.householdName}>{household.name}</Text>
                  {isAdmin && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.inviteCodeContainer}>
                  <Text style={styles.inviteCodeLabel}>Invite Code</Text>
                  <View style={styles.inviteCodeRow}>
                    <Text style={styles.inviteCode}>{household.inviteCode}</Text>
                    <TouchableOpacity style={styles.copyButton} onPress={copyInviteCode}>
                      <MaterialCommunityIcons name="content-copy" size={20} color="#4F86C6" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shareButton} onPress={shareInviteCode}>
                      <MaterialCommunityIcons name="share-variant" size={20} color="#4F86C6" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.membersContainer}>
                  <Text style={styles.membersLabel}>Members ({householdMembers.length})</Text>
                  <View style={styles.membersList}>
                    {householdMembers.map((member) => (
                      <View key={member.$id} style={styles.memberItem}>
                        <Image
                          source={{ uri: member.avatar }}
                          style={styles.memberAvatar}
                        />
                        <Text style={styles.memberName}>{member.username}</Text>
                        {member.role === 'admin' && (
                          <MaterialCommunityIcons name="crown" size={14} color="#FFC107" />
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.householdActions}>
                {isAdmin && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={handleRegenerateCode}
                  >
                    <MaterialCommunityIcons name="refresh" size={20} color="#666666" />
                    <Text style={styles.actionButtonText}>New Invite Code</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.leaveButton]}
                  onPress={handleLeaveHousehold}
                >
                  <MaterialCommunityIcons name="exit-run" size={20} color="#F44336" />
                  <Text style={[styles.actionButtonText, styles.leaveButtonText]}>Leave Household</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.noHouseholdText}>No household found</Text>
          )}
        </View>
        
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Text style={styles.settingIcon}>🔔</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingDescription}>Task reminders, updates</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Text style={styles.settingIcon}>🎨</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Appearance</Text>
              <Text style={styles.settingDescription}>Theme, color preferences</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.aboutSection}>
          <Text style={styles.aboutText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333333",
  },
  logoutButton: {
    padding: 8,
  },
  logoutIcon: {
    width: 24,
    height: 24,
    tintColor: "#666666",
  },
  profileSection: {
    padding: 20,
    alignItems: "center",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#4F86C6",
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  username: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  profileCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileCardContent: {
    flex: 1,
  },
  profileCardValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 4,
  },
  profileCardTitle: {
    fontSize: 12,
    color: "#666666",
  },
  profileCardIcon: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 20,
  },
  householdSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 16,
  },
  householdCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  householdHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  householdName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
  },
  adminBadge: {
    backgroundColor: "#FFC107",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333333",
  },
  inviteCodeContainer: {
    marginBottom: 16,
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
  },
  inviteCodeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4F86C6",
    letterSpacing: 4,
    flex: 1,
  },
  copyButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  membersContainer: {
    marginTop: 8,
  },
  membersLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 8,
  },
  membersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  memberName: {
    fontSize: 14,
    color: "#333333",
  },
  householdActions: {
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
  },
  leaveButton: {
    backgroundColor: "#FFEBEE",
  },
  leaveButtonText: {
    color: "#F44336",
  },
  noHouseholdText: {
    color: "#999999",
    textAlign: "center",
    padding: 20,
  },
  settingsSection: {
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingIcon: {
    fontSize: 20,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
  },
  settingDescription: {
    fontSize: 12,
    color: "#999999",
  },
  aboutSection: {
    padding: 20,
    paddingBottom: 100,
    alignItems: "center",
  },
  aboutText: {
    color: "#999999",
    fontSize: 12,
  },
});

export default Profile;
