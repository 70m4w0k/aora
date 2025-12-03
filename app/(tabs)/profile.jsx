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
  Modal,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';

import { Avatar, Badge } from "../../components/ui";
import { getAllTasksDone, signOut, leaveHousehold, regenerateInviteCode } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import ProfileEditModal from "../../components/ProfileEditModal";
import HouseholdManageModal from "../../components/HouseholdManageModal";

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

// Accent color options
const ACCENT_COLORS = [
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Blue', value: '#3B82F6' },
];

// Theme options
const THEME_OPTIONS = [
  { name: 'Dark', value: 'dark', icon: 'moon' },
  { name: 'Light', value: 'light', icon: 'sunny', disabled: true },
  { name: 'System', value: 'system', icon: 'phone-portrait-outline', disabled: true },
];

const Profile = () => {
  const { user, setUser, setIsLogged, household, householdMembers, refreshUser, refreshHousehold } = useGlobalContext();
  const [stats, setStats] = useState({ completedTasks: 0, tasksPerWeek: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [appearanceModalVisible, setAppearanceModalVisible] = useState(false);
  const [profileEditModalVisible, setProfileEditModalVisible] = useState(false);
  const [householdManageModalVisible, setHouseholdManageModalVisible] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [selectedAccent, setSelectedAccent] = useState('#8B5CF6');

  const isAdmin = user?.role === 'admin';

  // Calculate seniority (time since joining household)
  const getSeniorityText = (user) => {
    if (!user || !user.householdId) return '';
    
    // Try to get join date from user document or use $createdAt as fallback
    const joinDate = user.householdJoinDate ? new Date(user.householdJoinDate) : (user.$createdAt ? new Date(user.$createdAt) : null);
    
    if (!joinDate || isNaN(joinDate.getTime())) {
      return 'Member since recently';
    }

    const now = new Date();
    const diffTime = Math.abs(now - joinDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);

    if (diffYears > 0) {
      return `Member since ${diffYears} year${diffYears > 1 ? 's' : ''}`;
    } else if (diffMonths > 0) {
      return `Member since ${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    } else {
      return `Member since ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  };

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
          message: `Join my household "${household.name}" on Tipi!\n\nInvite Code: ${household.inviteCode}`,
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
  const handleAppearance = () => setAppearanceModalVisible(true);

  const renderAppearanceModal = () => (
    <Modal
      visible={appearanceModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setAppearanceModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Appearance</Text>
            <TouchableOpacity onPress={() => setAppearanceModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Theme Selection */}
          <Text style={styles.modalSectionTitle}>THEME</Text>
          <View style={styles.themeOptions}>
            {THEME_OPTIONS.map((theme) => (
              <TouchableOpacity
                key={theme.value}
                style={[
                  styles.themeOption,
                  selectedTheme === theme.value && styles.themeOptionActive,
                  theme.disabled && styles.themeOptionDisabled,
                ]}
                onPress={() => !theme.disabled && setSelectedTheme(theme.value)}
                disabled={theme.disabled}
              >
                <Ionicons 
                  name={theme.icon} 
                  size={24} 
                  color={selectedTheme === theme.value ? selectedAccent : theme.disabled ? COLORS.textTertiary : COLORS.textSecondary} 
                />
                <Text style={[
                  styles.themeOptionText,
                  selectedTheme === theme.value && { color: selectedAccent },
                  theme.disabled && styles.themeOptionTextDisabled,
                ]}>
                  {theme.name}
                </Text>
                {selectedTheme === theme.value && (
                  <View style={[styles.checkBadge, { backgroundColor: selectedAccent }]}>
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  </View>
                )}
                {theme.disabled && (
                  <Text style={styles.comingSoonBadge}>Soon</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Accent Color Selection */}
          <Text style={styles.modalSectionTitle}>ACCENT COLOR</Text>
          <View style={styles.accentOptions}>
            {ACCENT_COLORS.map((color) => (
              <TouchableOpacity
                key={color.value}
                style={[
                  styles.accentOption,
                  { backgroundColor: color.value },
                  selectedAccent === color.value && styles.accentOptionActive,
                ]}
                onPress={() => setSelectedAccent(color.value)}
              >
                {selectedAccent === color.value && (
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.accentNote}>
            Accent color customization coming in a future update
          </Text>

          {/* Preview */}
          <Text style={styles.modalSectionTitle}>PREVIEW</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewRow}>
              <View style={[styles.previewDot, { backgroundColor: selectedAccent }]} />
              <Text style={styles.previewText}>Primary buttons & links</Text>
            </View>
            <View style={styles.previewRow}>
              <View style={[styles.previewDot, { backgroundColor: selectedAccent, opacity: 0.5 }]} />
              <Text style={styles.previewText}>Highlights & badges</Text>
            </View>
            <View style={[styles.previewButton, { backgroundColor: selectedAccent }]}>
              <Text style={styles.previewButtonText}>Sample Button</Text>
            </View>
          </View>

          {/* Close Button */}
          <TouchableOpacity 
            style={[styles.modalDoneBtn, { backgroundColor: selectedAccent }]}
            onPress={() => setAppearanceModalVisible(false)}
          >
            <Text style={styles.modalDoneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
        <TouchableOpacity 
          style={styles.profileCard}
          onPress={() => setProfileEditModalVisible(true)}
          activeOpacity={0.8}
        >
          <Avatar source={user?.avatar} name={user?.username} size="lg" color={user?.color} />
          <Text style={styles.username}>{user?.username}</Text>
          {user?.householdId && (
            <Text style={styles.seniority}>{getSeniorityText(user)}</Text>
          )}
          
          <View style={styles.statsRow}>
            <StatCard icon="checkmark-circle" value={stats.completedTasks} label="Tasks Done" color={COLORS.accent.chores} />
            <View style={styles.statDivider} />
            <StatCard icon="trending-up" value={stats.tasksPerWeek} label="Per Week" color={COLORS.accent.primary} />
          </View>
        </TouchableOpacity>

        {/* Household Section */}
        {household && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HOUSEHOLD</Text>
            <TouchableOpacity 
              style={styles.householdCard}
              onPress={() => setHouseholdManageModalVisible(true)}
              activeOpacity={0.8}
            >
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
            </TouchableOpacity>
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

      {/* Appearance Modal */}
      {renderAppearanceModal()}
      
      {/* Profile Edit Modal */}
      <ProfileEditModal
        visible={profileEditModalVisible}
        user={user}
        onClose={() => setProfileEditModalVisible(false)}
        onUpdate={async () => {
          // Refresh user data to get updated color
          const updatedUser = await refreshUser();
          await fetchUserStats();
          // Force re-render by updating state
          if (updatedUser) {
            setUser(updatedUser);
          }
        }}
      />
      
      {/* Household Manage Modal */}
      <HouseholdManageModal
        visible={householdManageModalVisible}
        household={household}
        onClose={() => setHouseholdManageModalVisible(false)}
        onUpdate={async () => {
          await refreshHousehold();
        }}
      />
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
  profileCard: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 20, marginBottom: 24 },
  username: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, marginTop: 12 },
  seniority: { fontSize: 13, color: COLORS.textTertiary, marginTop: 4 },
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
  actionChipPrimary: { backgroundColor: `${COLORS.accent.primary}15` },
  actionChipDanger: { backgroundColor: `${COLORS.accent.danger}15` },
  actionChipText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  actionChipTextPrimary: { color: COLORS.accent.primary },
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },

  // Theme Options
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  themeOption: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  themeOptionActive: {
    borderColor: COLORS.accent.primary,
    backgroundColor: `${COLORS.accent.primary}10`,
  },
  themeOptionDisabled: {
    opacity: 0.5,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  themeOptionTextDisabled: {
    color: COLORS.textTertiary,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textTertiary,
    backgroundColor: COLORS.elevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  // Accent Colors
  accentOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  accentOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentOptionActive: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  accentNote: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginBottom: 16,
  },

  // Preview
  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  previewText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  previewButton: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  previewButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // Done Button
  modalDoneBtn: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default Profile;
