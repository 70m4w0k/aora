import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";

import {
  updateHouseholdName,
  regenerateInviteCode,
  kickUserFromHousehold,
  promoteToAdmin,
  demoteFromAdmin,
  deleteHousehold,
  getHouseholdMembers,
} from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";

const COLORS = {
  bg: "#0A0A0C",
  card: "#18181B",
  elevated: "#27272A",
  border: "#3F3F46",
  textPrimary: "#FAFAFA",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",
  accent: {
    primary: "#F43F5E",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
  },
};

const ManageHousehold = () => {
  const { user, household, refreshUser, refreshHousehold, householdMembers } = useGlobalContext();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberModalVisible, setMemberModalVisible] = useState(false);

  const isAdmin = user?.role === "admin";

  const fetchMembers = useCallback(async () => {
    if (!household?.$id) return;
    try {
      const fetchedMembers = await getHouseholdMembers(household.$id);
      setMembers(fetchedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  }, [household?.$id]);

  useEffect(() => {
    fetchMembers();
    if (household?.name) {
      setNewHouseholdName(household.name);
    }
  }, [fetchMembers, household?.name]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    await refreshHousehold();
    setRefreshing(false);
  };

  const handleUpdateName = async () => {
    if (!newHouseholdName.trim()) {
      Alert.alert("Error", "Please enter a household name");
      return;
    }
    if (newHouseholdName.trim() === household?.name) {
      setEditNameModalVisible(false);
      return;
    }

    setSaving(true);
    try {
      await updateHouseholdName(household.$id, newHouseholdName.trim());
      await refreshHousehold();
      setEditNameModalVisible(false);
      Alert.alert("Success", "Household name updated!");
    } catch (error) {
      Alert.alert("Error", "Failed to update household name");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateCode = async () => {
    Alert.alert(
      "Regenerate Invite Code?",
      "The old code will stop working. Share the new code with your household members.",
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

  const openMemberModal = (member) => {
    if (member.$id === user?.$id) {
      Alert.alert("Info", "You cannot modify your own role here. Use 'Leave Household' on the profile page.");
      return;
    }
    setSelectedMember(member);
    setMemberModalVisible(true);
  };

  const handleKickMember = async () => {
    if (!selectedMember) return;
    
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${selectedMember.username} from the household?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await kickUserFromHousehold(selectedMember.$id);
              await fetchMembers();
              setMemberModalVisible(false);
              setSelectedMember(null);
              Alert.alert("Success", `${selectedMember.username} has been removed from the household.`);
            } catch (error) {
              Alert.alert("Error", "Failed to remove member");
            }
          },
        },
      ]
    );
  };

  const handlePromoteToAdmin = async () => {
    if (!selectedMember) return;
    
    Alert.alert(
      "Promote to Admin",
      `Make ${selectedMember.username} an admin? They will be able to manage the household.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Promote",
          onPress: async () => {
            try {
              await promoteToAdmin(selectedMember.$id);
              await fetchMembers();
              setMemberModalVisible(false);
              setSelectedMember(null);
              Alert.alert("Success", `${selectedMember.username} is now an admin.`);
            } catch (error) {
              Alert.alert("Error", "Failed to promote member");
            }
          },
        },
      ]
    );
  };

  const handleDemoteFromAdmin = async () => {
    if (!selectedMember) return;
    
    Alert.alert(
      "Remove Admin",
      `Remove admin privileges from ${selectedMember.username}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Demote",
          style: "destructive",
          onPress: async () => {
            try {
              await demoteFromAdmin(selectedMember.$id);
              await fetchMembers();
              setMemberModalVisible(false);
              setSelectedMember(null);
              Alert.alert("Success", `${selectedMember.username} is no longer an admin.`);
            } catch (error) {
              Alert.alert("Error", "Failed to demote member");
            }
          },
        },
      ]
    );
  };

  const handleDeleteHousehold = async () => {
    Alert.alert(
      "Delete Household",
      "This action cannot be undone. All members will be removed and the household will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Final Confirmation",
              "Are you ABSOLUTELY sure? This will delete all household data.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await deleteHousehold(household.$id);
                      await refreshUser();
                      router.replace("/(household)/onboarding");
                    } catch (error) {
                      Alert.alert("Error", "Failed to delete household");
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Household Settings</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.noAccessContainer}>
          <Ionicons name="lock-closed" size={64} color={COLORS.textMuted} />
          <Text style={styles.noAccessTitle}>Admin Access Required</Text>
          <Text style={styles.noAccessText}>
            Only household admins can manage household settings.
          </Text>
          <TouchableOpacity style={styles.backButtonFull} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Household</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent.primary} />
        }
      >
        {/* Household Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Household Info</Text>
          
          <View style={styles.card}>
            {/* Household Name */}
            <TouchableOpacity style={styles.settingRow} onPress={() => setEditNameModalVisible(true)}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: `${COLORS.accent.info}20` }]}>
                  <Ionicons name="home" size={20} color={COLORS.accent.info} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Household Name</Text>
                  <Text style={styles.settingValue}>{household?.name}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Invite Code */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: `${COLORS.accent.success}20` }]}>
                  <Ionicons name="key" size={20} color={COLORS.accent.success} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Invite Code</Text>
                  <Text style={styles.settingValueCode}>{household?.inviteCode}</Text>
                </View>
              </View>
              <View style={styles.codeActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={copyInviteCode}>
                  <Ionicons name="copy-outline" size={20} color={COLORS.accent.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={shareInviteCode}>
                  <Ionicons name="share-outline" size={20} color={COLORS.accent.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.regenerateBtn} onPress={handleRegenerateCode}>
              <Ionicons name="refresh" size={16} color={COLORS.accent.warning} />
              <Text style={styles.regenerateBtnText}>Regenerate Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            <Text style={styles.memberCount}>{members.length} member{members.length !== 1 ? "s" : ""}</Text>
          </View>

          <View style={styles.card}>
            {members.map((member, index) => (
              <View key={member.$id}>
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.memberRow}
                  onPress={() => openMemberModal(member)}
                  disabled={member.$id === user?.$id}
                >
                  <View style={styles.memberLeft}>
                    <View style={[styles.memberAvatar, { backgroundColor: member.color || COLORS.accent.primary }]}>
                      <Text style={styles.memberAvatarText}>
                        {member.username?.[0]?.toUpperCase() || "?"}
                      </Text>
                    </View>
                    <View>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{member.username}</Text>
                        {member.$id === user?.$id && (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>You</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    </View>
                  </View>
                  <View style={styles.memberRight}>
                    {member.role === "admin" && (
                      <View style={styles.adminBadge}>
                        <MaterialCommunityIcons name="crown" size={12} color={COLORS.accent.warning} />
                        <Text style={styles.adminBadgeText}>Admin</Text>
                      </View>
                    )}
                    {member.$id !== user?.$id && (
                      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleDanger}>Danger Zone</Text>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerDescription}>
              Deleting the household will remove all members and permanently delete all associated data.
            </Text>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteHousehold}>
              <Ionicons name="trash" size={18} color="#FFF" />
              <Text style={styles.deleteBtnText}>Delete Household</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={editNameModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Household Name</Text>
              <TouchableOpacity onPress={() => setEditNameModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              value={newHouseholdName}
              onChangeText={setNewHouseholdName}
              placeholder="Household name"
              placeholderTextColor={COLORS.textMuted}
              maxLength={50}
            />
            <Text style={styles.charCount}>{newHouseholdName.length}/50</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditNameModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleUpdateName}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Member Actions Modal */}
      <Modal
        visible={memberModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMemberModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Member</Text>
              <TouchableOpacity onPress={() => setMemberModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedMember && (
              <>
                <View style={styles.selectedMemberInfo}>
                  <View style={[styles.memberAvatarLarge, { backgroundColor: selectedMember.color || COLORS.accent.primary }]}>
                    <Text style={styles.memberAvatarTextLarge}>
                      {selectedMember.username?.[0]?.toUpperCase() || "?"}
                    </Text>
                  </View>
                  <Text style={styles.selectedMemberName}>{selectedMember.username}</Text>
                  <Text style={styles.selectedMemberEmail}>{selectedMember.email}</Text>
                  {selectedMember.role === "admin" && (
                    <View style={styles.adminBadgeLarge}>
                      <MaterialCommunityIcons name="crown" size={14} color={COLORS.accent.warning} />
                      <Text style={styles.adminBadgeTextLarge}>Admin</Text>
                    </View>
                  )}
                </View>

                <View style={styles.memberActions}>
                  {selectedMember.role === "admin" ? (
                    <TouchableOpacity style={styles.actionBtn} onPress={handleDemoteFromAdmin}>
                      <Ionicons name="arrow-down-circle" size={22} color={COLORS.accent.warning} />
                      <Text style={styles.actionBtnText}>Remove Admin</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.actionBtn} onPress={handlePromoteToAdmin}>
                      <MaterialCommunityIcons name="crown" size={22} color={COLORS.accent.warning} />
                      <Text style={styles.actionBtnText}>Make Admin</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleKickMember}>
                    <Ionicons name="person-remove" size={22} color={COLORS.accent.danger} />
                    <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>Remove from Household</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionTitleDanger: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.accent.danger,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  memberCount: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 4,
  },
  dangerCard: {
    backgroundColor: `${COLORS.accent.danger}10`,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${COLORS.accent.danger}30`,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  settingValueCode: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.accent.success,
    fontFamily: "monospace",
    letterSpacing: 2,
  },
  codeActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.elevated,
    justifyContent: "center",
    alignItems: "center",
  },
  regenerateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  regenerateBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.accent.warning,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  memberEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  memberRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  youBadge: {
    backgroundColor: COLORS.elevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  youBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${COLORS.accent.warning}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.accent.warning,
  },
  dangerDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.accent.danger,
    paddingVertical: 14,
    borderRadius: 12,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  // No access styles
  noAccessContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  noAccessTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  noAccessText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  backButtonFull: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  modalInput: {
    backgroundColor: COLORS.elevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.elevated,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.accent.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  // Selected member modal
  selectedMemberInfo: {
    alignItems: "center",
    paddingVertical: 20,
  },
  memberAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  memberAvatarTextLarge: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFF",
  },
  selectedMemberName: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  selectedMemberEmail: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  adminBadgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${COLORS.accent.warning}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  adminBadgeTextLarge: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.accent.warning,
  },
  memberActions: {
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.elevated,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  actionBtnDanger: {
    backgroundColor: `${COLORS.accent.danger}15`,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  actionBtnTextDanger: {
    color: COLORS.accent.danger,
  },
});

export default ManageHousehold;

