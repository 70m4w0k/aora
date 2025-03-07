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
  Alert 
} from "react-native";

import { icons } from "../../constants";
import { getChores, getAllTasksDone, signOut } from "../../lib/appwrite";
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
  const { user, setUser, setIsLogged } = useGlobalContext();
  const [stats, setStats] = useState({
    completedChores: 0,
    completedTasks: 0,
    tasksPerWeek: 0,
    completionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get tasks done by this user
      const tasksDone = await getAllTasksDone();
      const userTasksDone = tasksDone.filter(
        task => task.userId && task.userId.$id === user.$id
      );

      // Get chores done by this user
      const chores = await getChores();
      
      // Calculate tasks per week (assuming tasks are tracked for 52 weeks)
      const tasksPerWeek = userTasksDone.length > 0 
        ? (userTasksDone.length / 52).toFixed(1) 
        : 0;
      
      // Calculate completion rate (placeholder logic)
      const totalPossibleTasks = 52 * 10; // Assuming 10 possible tasks per week
      const completionRate = userTasksDone.length > 0 
        ? Math.min(100, Math.round((userTasksDone.length / totalPossibleTasks) * 100)) 
        : 0;
      
      setStats({
        completedTasks: userTasksDone.length,
        completedChores: chores.filter(chore => 
          chore.assignedTo && chore.assignedTo.$id === user.$id && chore.isDone
        ).length,
        tasksPerWeek,
        completionRate
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
              title="Completed Chores" 
              value={stats.completedChores}
              bgColor="#E8F5E9"
              icon={<Text style={styles.iconText}>✓</Text>}
            />
          </View>
          
          <View style={styles.statsContainer}>
            <ProfileCard 
              title="Tasks Per Week" 
              value={stats.tasksPerWeek}
              bgColor="#FFF3E0"
              icon={<Text style={styles.iconText}>📊</Text>}
            />
            <ProfileCard 
              title="Completion Rate" 
              value={`${stats.completionRate}%`}
              bgColor="#E1F5FE"
              icon={<Text style={styles.iconText}>🎯</Text>}
            />
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Overall Progress</Text>
              <Text style={styles.progressValue}>{stats.completionRate}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${stats.completionRate}%` }]} />
            </View>
          </View>
        </View>
        
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Text style={styles.settingIcon}>🔒</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Privacy & Security</Text>
              <Text style={styles.settingDescription}>Password, data sharing</Text>
            </View>
          </TouchableOpacity>
          
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
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            Version 1.0.0
          </Text>
          <TouchableOpacity style={styles.supportButton}>
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
    marginBottom: 24,
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
  settingsSection: {
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 16,
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
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  aboutText: {
    color: "#666666",
    marginBottom: 16,
  },
  supportButton: {
    backgroundColor: "#F0F0F0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  supportButtonText: {
    color: "#4F86C6",
    fontWeight: "600",
  },
});

export default Profile;
