import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import {
  updateHouseholdName,
  regenerateInviteCode,
  kickUserFromHousehold,
  promoteToAdmin,
  demoteFromAdmin,
  deleteHousehold,
  getHouseholdMembers,
} from '../lib/appwrite';
import { useGlobalContext } from '../context/GlobalProvider';
import { handleError } from '../lib/errorHandler';

const HouseholdManageModal = ({ visible, household, onClose, onUpdate }) => {
  const { user, refreshUser, refreshHousehold } = useGlobalContext();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberModalVisible, setMemberModalVisible] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchMembers = useCallback(async () => {
    if (!household?.$id) return;
    try {
      const fetchedMembers = await getHouseholdMembers(household.$id);
      setMembers(fetchedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      handleError(error, 'fetchMembers', false);
    } finally {
      setLoading(false);
    }
  }, [household?.$id]);

  useEffect(() => {
    if (visible && household) {
      setLoading(true);
      fetchMembers();
      if (household?.name) {
        setNewHouseholdName(household.name);
      }
    }
  }, [visible, fetchMembers, household?.name]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    await refreshHousehold();
    setRefreshing(false);
  };

  const handleUpdateName = async () => {
    if (!newHouseholdName.trim()) {
      Alert.alert('Error', 'Please enter a household name');
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
      Alert.alert('Success', 'Household name updated!');
      onUpdate();
    } catch (error) {
      handleError(error, 'updateHouseholdName', true);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateCode = async () => {
    Alert.alert(
      'Regenerate Invite Code?',
      'The old code will stop working. Share the new code with your household members.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            try {
              await regenerateInviteCode(household.$id);
              await refreshHousehold();
              Alert.alert('Success', 'New invite code generated!');
              onUpdate();
            } catch (error) {
              handleError(error, 'regenerateInviteCode', true);
            }
          },
        },
      ]
    );
  };

  const copyInviteCode = async () => {
    if (household?.inviteCode) {
      await Clipboard.setStringAsync(household.inviteCode);
      Alert.alert('Copied!', 'Invite code copied to clipboard');
    }
  };

  const shareInviteCode = async () => {
    if (household?.inviteCode) {
      try {
        await Share.share({
          message: `Join my household "${household.name}" on Tipi!\n\nInvite Code: ${household.inviteCode}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const openMemberModal = (member) => {
    if (member.$id === user?.$id) {
      Alert.alert('Info', 'You cannot modify your own role here. Use "Leave Household" on the profile page.');
      return;
    }
    setSelectedMember(member);
    setMemberModalVisible(true);
  };

  const handleKickMember = async () => {
    if (!selectedMember) return;
    
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${selectedMember.username} from the household?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await kickUserFromHousehold(selectedMember.$id);
              await fetchMembers();
              setMemberModalVisible(false);
              setSelectedMember(null);
              Alert.alert('Success', `${selectedMember.username} has been removed from the household.`);
              onUpdate();
            } catch (error) {
              handleError(error, 'kickMember', true);
            }
          },
        },
      ]
    );
  };

  const handlePromoteToAdmin = async () => {
    if (!selectedMember) return;
    
    Alert.alert(
      'Promote to Admin',
      `Make ${selectedMember.username} an admin? They will be able to manage the household.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            try {
              await promoteToAdmin(selectedMember.$id);
              await fetchMembers();
              setMemberModalVisible(false);
              setSelectedMember(null);
              Alert.alert('Success', `${selectedMember.username} is now an admin.`);
              onUpdate();
            } catch (error) {
              handleError(error, 'promoteToAdmin', true);
            }
          },
        },
      ]
    );
  };

  const handleDemoteFromAdmin = async () => {
    if (!selectedMember) return;
    
    Alert.alert(
      'Remove Admin',
      `Remove admin privileges from ${selectedMember.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Demote',
          style: 'destructive',
          onPress: async () => {
            try {
              await demoteFromAdmin(selectedMember.$id);
              await fetchMembers();
              setMemberModalVisible(false);
              setSelectedMember(null);
              Alert.alert('Success', `${selectedMember.username} is no longer an admin.`);
              onUpdate();
            } catch (error) {
              handleError(error, 'demoteFromAdmin', true);
            }
          },
        },
      ]
    );
  };

  const handleDeleteHousehold = async () => {
    Alert.alert(
      'Delete Household',
      'This action cannot be undone. All members will be removed and the household will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you ABSOLUTELY sure? This will delete all household data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteHousehold(household.$id);
                      await refreshUser();
                      onClose();
                      // Navigation will be handled by GlobalProvider
                    } catch (error) {
                      handleError(error, 'deleteHousehold', true);
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

  if (!isAdmin) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Household Settings</Text>
              <View style={{ width: 24 }} />
            </View>
            <View style={styles.noAccessContainer}>
              <Ionicons name="lock-closed" size={64} color="#71717A" />
              <Text style={styles.noAccessTitle}>Admin Access Required</Text>
              <Text style={styles.noAccessText}>
                Only household admins can manage household settings.
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  if (loading) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F43F5E" />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Manage Household</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F43F5E" />
              }
            >
              {/* Household Info Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>HOUSEHOLD INFO</Text>
                
                <View style={styles.card}>
                  {/* Household Name */}
                  <TouchableOpacity style={styles.settingRow} onPress={() => setEditNameModalVisible(true)}>
                    <View style={styles.settingLeft}>
                      <View style={[styles.settingIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                        <Ionicons name="home" size={20} color="#3B82F6" />
                      </View>
                      <View>
                        <Text style={styles.settingLabel}>Household Name</Text>
                        <Text style={styles.settingValue}>{household?.name}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#71717A" />
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  {/* Invite Code */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingLeft}>
                      <View style={[styles.settingIcon, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                        <Ionicons name="key" size={20} color="#22C55E" />
                      </View>
                      <View>
                        <Text style={styles.settingLabel}>Invite Code</Text>
                        <Text style={styles.settingValueCode}>{household?.inviteCode}</Text>
                      </View>
                    </View>
                    <View style={styles.codeActions}>
                      <TouchableOpacity style={styles.iconBtn} onPress={copyInviteCode}>
                        <Ionicons name="copy-outline" size={20} color="#F43F5E" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconBtn} onPress={shareInviteCode}>
                        <Ionicons name="share-outline" size={20} color="#F43F5E" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.regenerateBtn} onPress={handleRegenerateCode}>
                    <Ionicons name="refresh" size={16} color="#F59E0B" />
                    <Text style={styles.regenerateBtnText}>Regenerate Code</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Members Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>MEMBERS</Text>
                  <Text style={styles.memberCount}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>
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
                          <View style={[styles.memberAvatar, { backgroundColor: member.color || '#F43F5E' }]}>
                            <Text style={styles.memberAvatarText}>
                              {member.username?.[0]?.toUpperCase() || '?'}
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
                          {member.role === 'admin' && (
                            <View style={styles.adminBadge}>
                              <MaterialCommunityIcons name="crown" size={12} color="#F59E0B" />
                              <Text style={styles.adminBadgeText}>Admin</Text>
                            </View>
                          )}
                          {member.$id !== user?.$id && (
                            <Ionicons name="chevron-forward" size={20} color="#71717A" />
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              {/* Danger Zone */}
              <View style={styles.section}>
                <Text style={styles.sectionTitleDanger}>DANGER ZONE</Text>
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
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Name Modal */}
      <Modal
        visible={editNameModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditNameModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditNameModalVisible(false)}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Household Name</Text>
              <TouchableOpacity onPress={handleUpdateName} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#F43F5E" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Household Name</Text>
              <TextInput
                style={styles.input}
                value={newHouseholdName}
                onChangeText={setNewHouseholdName}
                placeholder="Enter household name"
                placeholderTextColor="#71717A"
                maxLength={50}
              />
              <Text style={styles.charCount}>{newHouseholdName.length}/50</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Member Actions Modal */}
      <Modal
        visible={memberModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMemberModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setMemberModalVisible(false)}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Manage Member</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedMember && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.selectedMemberInfo}>
                  <View style={[styles.memberAvatarLarge, { backgroundColor: selectedMember.color || '#F43F5E' }]}>
                    <Text style={styles.memberAvatarTextLarge}>
                      {selectedMember.username?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <Text style={styles.selectedMemberName}>{selectedMember.username}</Text>
                  <Text style={styles.selectedMemberEmail}>{selectedMember.email}</Text>
                  {selectedMember.role === 'admin' && (
                    <View style={styles.adminBadgeLarge}>
                      <MaterialCommunityIcons name="crown" size={14} color="#F59E0B" />
                      <Text style={styles.adminBadgeTextLarge}>Admin</Text>
                    </View>
                  )}
                </View>

                <View style={styles.memberActions}>
                  {selectedMember.role === 'admin' ? (
                    <TouchableOpacity style={styles.actionBtn} onPress={handleDemoteFromAdmin}>
                      <Ionicons name="arrow-down-circle" size={22} color="#F59E0B" />
                      <Text style={styles.actionBtnText}>Remove Admin</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.actionBtn} onPress={handlePromoteToAdmin}>
                      <MaterialCommunityIcons name="crown" size={22} color="#F59E0B" />
                      <Text style={styles.actionBtnText}>Make Admin</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleKickMember}>
                    <Ionicons name="person-remove" size={22} color="#EF4444" />
                    <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>Remove from Household</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F43F5E',
  },
  modalBody: {
    padding: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
    marginBottom: 12,
    marginTop: 0,
  },
  sectionTitleDanger: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 12,
    marginTop: 0,
  },
  memberCount: {
    fontSize: 13,
    color: '#71717A',
  },
  card: {
    backgroundColor: '#111114',
    borderRadius: 16,
    padding: 4,
  },
  dangerCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 12,
    color: '#71717A',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  settingValueCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#222228',
    justifyContent: 'center',
    alignItems: 'center',
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  regenerateBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F59E0B',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  memberEmail: {
    fontSize: 13,
    color: '#71717A',
    marginTop: 2,
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  youBadge: {
    backgroundColor: '#222228',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  youBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  dangerDescription: {
    fontSize: 14,
    color: '#A1A1AA',
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  noAccessContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAccessTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  noAccessText: {
    fontSize: 15,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
    marginBottom: 8,
    marginTop: 0,
  },
  input: {
    backgroundColor: '#111114',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  charCount: {
    fontSize: 12,
    color: '#71717A',
    textAlign: 'right',
    marginTop: 4,
  },
  selectedMemberInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  memberAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberAvatarTextLarge: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFF',
  },
  selectedMemberName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  selectedMemberEmail: {
    fontSize: 14,
    color: '#71717A',
    marginBottom: 8,
  },
  adminBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  adminBadgeTextLarge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  memberActions: {
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#111114',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionBtnDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  actionBtnTextDanger: {
    color: '#EF4444',
  },
});

export default HouseholdManageModal;

