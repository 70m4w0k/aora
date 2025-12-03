import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from './ui';
import {
  updateUserProfile,
  updateAccountEmail,
  updateAccountPassword,
  updateAccountName,
  uploadProfilePicture,
} from '../lib/appwrite';
import { handleError } from '../lib/errorHandler';

const COLORS = {
  bg: '#0A0A0C',
  card: '#1A1A1F',
  surface: '#111114',
  border: 'rgba(255,255,255,0.1)',
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  accent: '#8B5CF6',
  danger: '#EF4444',
};

// Color options for user color
const USER_COLORS = [
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F43F5E', // Rose
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#22C55E', // Green
  '#EF4444', // Red
  '#6366F1', // Indigo
];

const ProfileEditModal = ({ visible, user, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'account', 'password'
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    color: '',
    avatar: null,
    avatarUrl: null,
  });
  
  // Account form state
  const [accountForm, setAccountForm] = useState({
    email: '',
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        color: user.color || USER_COLORS[0],
        avatar: null,
        avatarUrl: user.avatar || null,
      });
      setAccountForm({
        email: user.email || '',
      });
    }
  }, [user, visible]); // Re-initialize when modal opens

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileForm(prev => ({
          ...prev,
          avatar: result.assets[0],
          avatarUrl: result.assets[0].uri,
        }));
      }
    } catch (error) {
      handleError(error, 'pickImage', true);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !user.$id) {
      Alert.alert('Error', 'User information is missing');
      return;
    }

    if (!profileForm.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    setLoading(true);
    try {
      const updates = {
        username: profileForm.username.trim(),
        color: profileForm.color,
      };

      // Upload avatar if changed
      if (profileForm.avatar) {
        const file = {
          uri: profileForm.avatar.uri,
          type: profileForm.avatar.mimeType || 'image/jpeg',
          name: `profile-${Date.now()}.jpg`,
        };
        
        const uploadResult = await uploadProfilePicture(file);
        updates.avatar = uploadResult.url;
      }

      console.log('Updating profile with:', updates);
      const updatedUser = await updateUserProfile(user.$id, updates);
      console.log('Profile updated successfully:', updatedUser);

      Alert.alert('Success', 'Profile updated successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      handleError(error, 'saveProfile', true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!accountForm.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    if (accountForm.email === user.email) {
      Alert.alert('Info', 'Email is unchanged');
      return;
    }

    Alert.prompt(
      'Verify Password',
      'Please enter your current password to change your email:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async (password) => {
            if (!password) {
              Alert.alert('Error', 'Password is required');
              return;
            }

            setLoading(true);
            try {
              await updateAccountEmail(accountForm.email.trim(), password);
              Alert.alert('Success', 'Email updated successfully!');
              onUpdate();
              onClose();
            } catch (error) {
              handleError(error, 'updateEmail', true);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      'secure-text'
    );
  };

  const handleSavePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await updateAccountPassword(passwordForm.oldPassword, passwordForm.newPassword);
      Alert.alert('Success', 'Password updated successfully!');
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      onClose();
    } catch (error) {
      handleError(error, 'updatePassword', true);
    } finally {
      setLoading(false);
    }
  };

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Profile Picture */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PROFILE PICTURE</Text>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
            {profileForm.avatarUrl ? (
              <Image source={{ uri: profileForm.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Avatar source={null} name={profileForm.username || user?.username} size="xl" />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickImage} style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Username */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>USERNAME</Text>
        <TextInput
          style={styles.input}
          value={profileForm.username}
          onChangeText={(text) => setProfileForm(prev => ({ ...prev, username: text }))}
          placeholder="Enter username"
          placeholderTextColor={COLORS.textTertiary}
        />
      </View>

      {/* Color Picker */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>COLOR</Text>
        <View style={styles.colorGrid}>
          {USER_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                profileForm.color === color && styles.colorOptionActive,
              ]}
              onPress={() => setProfileForm(prev => ({ ...prev, color }))}
            >
              {profileForm.color === color && (
                <Ionicons name="checkmark" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSaveProfile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderAccountTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Email */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>EMAIL</Text>
        <TextInput
          style={styles.input}
          value={accountForm.email}
          onChangeText={(text) => setAccountForm(prev => ({ ...prev, email: text }))}
          placeholder="Enter email"
          placeholderTextColor={COLORS.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.saveButton, styles.saveButtonSecondary, loading && styles.saveButtonDisabled]}
          onPress={handleSaveEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.accent} />
          ) : (
            <Text style={[styles.saveButtonText, styles.saveButtonTextSecondary]}>Update Email</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPasswordTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>CURRENT PASSWORD</Text>
        <TextInput
          style={styles.input}
          value={passwordForm.oldPassword}
          onChangeText={(text) => setPasswordForm(prev => ({ ...prev, oldPassword: text }))}
          placeholder="Enter current password"
          placeholderTextColor={COLORS.textTertiary}
          secureTextEntry
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NEW PASSWORD</Text>
        <TextInput
          style={styles.input}
          value={passwordForm.newPassword}
          onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
          placeholder="Enter new password (min 8 characters)"
          placeholderTextColor={COLORS.textTertiary}
          secureTextEntry
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>CONFIRM NEW PASSWORD</Text>
        <TextInput
          style={styles.input}
          value={passwordForm.confirmPassword}
          onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
          placeholder="Confirm new password"
          placeholderTextColor={COLORS.textTertiary}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSavePassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveButtonText}>Update Password</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
              onPress={() => setActiveTab('profile')}
            >
              <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
                Profile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'account' && styles.tabActive]}
              onPress={() => setActiveTab('account')}
            >
              <Text style={[styles.tabText, activeTab === 'account' && styles.tabTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'password' && styles.tabActive]}
              onPress={() => setActiveTab('password')}
            >
              <Text style={[styles.tabText, activeTab === 'password' && styles.tabTextActive]}>
                Password
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'account' && renderAccountTab()}
          {activeTab === 'password' && renderPasswordTab()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-start',
  },
  modalContent: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '100%',
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
    maxHeight: 700,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.bg,
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    color: COLORS.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionActive: {
    borderColor: '#FFF',
    borderWidth: 3,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextSecondary: {
    color: COLORS.accent,
  },
});

export default ProfileEditModal;

