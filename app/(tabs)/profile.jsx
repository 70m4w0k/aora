import { router } from "expo-router";
import { useCallback, useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';

import { Avatar, Badge } from "../../components/ui";
import { getAllTasksDone, signOut, leaveHousehold, regenerateInviteCode } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";

// Dark theme colors - consistent across app
const COLORS = {
  background: '#0A0A0C',
  surface: '#111114',
  card: '#1A1A1F',
  elevated: '#222228',
  border: 'rgba(255,255,255,0.1)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  accent: {
    primary: '#8B5CF6',
    chores: '#06B6D4',
    household: '#F59E0B',
    danger: '#EF4444',
  },
};

// Stat Card component
const StatCard = ({ icon, value, label, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// Setting Item component
const SettingItem = ({ icon, title, subtitle, onPress, showArrow = true, danger = false }) => (
  <Pressable 
    style={({ pressed }) => [styles.settingItem, pressed && styles.settingItemPressed]}
    onPress={onPress}
  >
    <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
      <Ionicons name={icon} size={20} color={danger ? COLORS.accent.danger : COLORS.textSecondary} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {showArrow && <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />}
  </Pressable>
);

// Member Avatar
const MemberAvatar = ({ member, index }) => (
  <View style={[styles.memberAvatarContainer, { marginLeft: index > 0 ? -8 : 0, zIndex: 10 - index }]}>
    <Avatar source={member.avatar} name={member.username} size="sm" />
    {member.role === 'admin' && (
      <View style={styles.crownBadge}>
        <MaterialCommunityIcons name="crown" size={10} color="#FFC107" />
      </View>
    )}
  </View>
);

const Profile = () => {
  const { user, setUser, setIsLogged, household, householdMembers, refreshUser, refreshHousehold } = useGlobalContext();
  const [stats, setStats] = useState({ completedTasks: 0, tasksPerWeek: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  const fetchUserStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const tasksDone = await getAllTasksDone();
      const userTasksDone = tasksDone.filter(task => task.userId && task.userId.$id === user.$id);
      const tasksPerWeek = userTasksDone.length > 0 ? (userTasksDone.length / 52).toFixed(1) : 0;
      setStats({ completedTasks: userTasksDone.length, tasksPerWeek });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchUserStats();
  }, [fetchUserStats, user]);

  const logout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            setUser(null);
            setIsLogged(false);
            router.replace("/sign-in");
          } catch (error) {
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
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
    Alert.alert("Regenerate Invite Code?", "This will invalidate the current invite code.", [
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
    ]);
  };

  const handleLeaveHousehold = () => {
    const warningMessage = isAdmin 
      ? "You are the admin. If you leave, the household will remain without an admin."
      : "Are you sure you want to leave this household?";

    Alert.alert("Leave Household?", warningMessage, [
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
    ]);
  };

  const handleNotifications = () => Alert.alert("Coming Soon", "Notification settings will be available in a future update.");
  const handleAppearance = () => Alert.alert("Coming Soon", "Theme settings will be available soon.\n\nCurrently using dark mode.");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Avatar source={user?.avatar} name={user?.username} size="xl" />
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          <View style={styles.statsRow}>
            <StatCard icon="checkmark-circle" value={stats.completedTasks} label="Tasks Done" color={COLORS.accent.chores} />
            <View style={styles.statDivider} />
            <StatCard icon="trending-up" value={stats.tasksPerWeek} label="Per Week" color={COLORS.accent.primary} />
          </View>
        </View>

        {/* Household Section */}
        {household && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HOUSEHOLD</Text>
            <View style={styles.householdCard}>
              <View style={styles.householdHeader}>
                <View style={styles.householdInfo}>
                  <View style={styles.householdNameRow}>
                    <Ionicons name="home" size={18} color={COLORS.accent.household} />
                    <Text style={styles.householdName}>{household.name}</Text>
                  </View>
                  {isAdmin && <Badge label="Admin" variant="warning" size="sm" />}
                </View>
                
                <View style={styles.membersRow}>
                  {householdMembers?.slice(0, 5).map((member, index) => (
                    <MemberAvatar key={member.$id} member={member} index={index} />
                  ))}
                  {householdMembers?.length > 5 && (
                    <View style={styles.moreMembers}>
                      <Text style={styles.moreMembersText}>+{householdMembers.length - 5}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Invite Code */}
              <View style={styles.inviteSection}>
                <Text style={styles.inviteLabel}>Invite Code</Text>
                <View style={styles.inviteCodeRow}>
                  <Text style={styles.inviteCode}>{household.inviteCode}</Text>
                  <Pressable style={styles.iconButton} onPress={copyInviteCode}>
                    <Ionicons name="copy-outline" size={20} color={COLORS.accent.primary} />
                  </Pressable>
                  <Pressable style={styles.iconButton} onPress={shareInviteCode}>
                    <Ionicons name="share-outline" size={20} color={COLORS.accent.primary} />
                  </Pressable>
                </View>
              </View>

              {/* Household Actions */}
              <View style={styles.householdActions}>
                {isAdmin && (
                  <Pressable style={styles.actionChip} onPress={handleRegenerateCode}>
                    <Ionicons name="refresh" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.actionChipText}>New Code</Text>
                  </Pressable>
                )}
                <Pressable style={[styles.actionChip, styles.actionChipDanger]} onPress={handleLeaveHousehold}>
                  <Ionicons name="exit-outline" size={16} color={COLORS.accent.danger} />
                  <Text style={[styles.actionChipText, styles.actionChipTextDanger]}>Leave</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={styles.settingsCard}>
            <SettingItem icon="notifications-outline" title="Notifications" subtitle="Task reminders, updates" onPress={handleNotifications} />
            <SettingItem icon="color-palette-outline" title="Appearance" subtitle="Dark mode enabled" onPress={handleAppearance} />
          </View>
        </View>

        <Text style={styles.versionText}>Version 1.0.0</Text>
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary },
  logoutButton: { padding: 8 },

  // Profile Card
  profileCard: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 20, marginBottom: 24 },
  username: { fontSize: 22, fontWeight: '600', color: COLORS.textPrimary, marginTop: 12 },
  email: { fontSize: 15, color: COLORS.textTertiary, marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 24, alignItems: 'center' },
  statCard: { alignItems: 'center', flex: 1 },
  statIconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '600', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textTertiary, marginTop: 2 },
  statDivider: { width: 1, height: 50, backgroundColor: COLORS.border, marginHorizontal: 20 },

  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '500', letterSpacing: 0.3, color: COLORS.textTertiary, marginBottom: 12, marginLeft: 4 },

  // Household Card
  householdCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16 },
  householdHeader: { marginBottom: 16 },
  householdInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  householdNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  householdName: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  membersRow: { flexDirection: 'row', alignItems: 'center' },
  memberAvatarContainer: { position: 'relative' },
  crownBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.card, borderRadius: 8, padding: 2 },
  moreMembers: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.elevated, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  moreMembersText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },

  // Invite Section
  inviteSection: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, marginBottom: 12 },
  inviteLabel: { fontSize: 11, color: COLORS.textTertiary, marginBottom: 4 },
  inviteCodeRow: { flexDirection: 'row', alignItems: 'center' },
  inviteCode: { flex: 1, fontSize: 22, fontWeight: '600', color: COLORS.accent.primary, letterSpacing: 3 },
  iconButton: { padding: 8 },

  // Household Actions
  householdActions: { flexDirection: 'row', gap: 8 },
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: COLORS.elevated, borderRadius: 20 },
  actionChipDanger: { backgroundColor: `${COLORS.accent.danger}15` },
  actionChipText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  actionChipTextDanger: { color: COLORS.accent.danger },

  // Settings
  settingsCard: { backgroundColor: COLORS.card, borderRadius: 16, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingItemPressed: { backgroundColor: COLORS.elevated },
  settingIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.elevated, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingIconDanger: { backgroundColor: `${COLORS.accent.danger}15` },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  settingTitleDanger: { color: COLORS.accent.danger },
  settingSubtitle: { fontSize: 11, color: COLORS.textTertiary, marginTop: 2 },

  // Version
  versionText: { fontSize: 11, color: COLORS.textTertiary, textAlign: 'center', marginTop: 16 },
});

export default Profile;
