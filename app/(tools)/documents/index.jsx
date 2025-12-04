import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  RefreshControl,
  Animated,
  Platform,
  ScrollView,
  Dimensions,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useGlobalContext } from "../../../context/GlobalProvider";
import { useTranslation } from "../../../hooks/useTranslation";
import {
  DocumentCategories,
  getHouseholdDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  uploadDocumentFile,
  getDocumentFileUrl,
} from "../../../lib/appwrite";

const { width: screenWidth } = Dimensions.get("window");

const DocumentsScreen = () => {
  const { user, household } = useGlobalContext();
  const t = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Selected file for upload
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Form state
  const [form, setForm] = useState({
    name: "",
    category: DocumentCategories.BILLS,
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    
    if (household?.$id && isMounted) {
      fetchDocuments();
    }
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    return () => {
      isMounted = false;
    };
  }, [household?.$id]);

  const fetchDocuments = async () => {
    if (!household?.$id) return;
    setLoading(true);
    try {
      const docs = await getHouseholdDocuments(household.$id);
      setDocuments(docs || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: DocumentCategories.BILLS,
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
    });
    setSelectedFile(null);
    setEditingDoc(null);
  };

  const openModal = (doc = null) => {
    if (doc) {
      setEditingDoc(doc);
      setForm({
        name: doc.name,
        category: doc.category,
        description: doc.description || "",
        amount: doc.amount?.toString() || "",
        date: doc.date?.split("T")[0] || new Date().toISOString().split("T")[0],
      });
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        // Auto-fill name if empty
        if (!form.name) {
          setForm({ ...form, name: file.name.split(".")[0] });
        }
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert(t("common.error"), t("documents.couldNotSelectFile"));
    }
  };

  const takePhoto = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("common.permissionNeeded"), t("documents.cameraPermissionForPhotos"));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        const fileName = `photo_${Date.now()}.jpg`;
        setSelectedFile({
          uri: photo.uri,
          name: fileName,
          fileName: fileName,
          mimeType: "image/jpeg",
          type: "image/jpeg",
          size: photo.fileSize || 0,
        });
        // Auto-fill name if empty
        if (!form.name) {
          setForm({ ...form, name: `${t("documents.photo")} ${new Date().toLocaleDateString()}` });
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert(t("common.error"), t("documents.couldNotTakePhoto"));
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      return Alert.alert(t("common.error"), t("documents.pleaseProvideDocumentName"));
    }

    setIsSubmitting(true);
    try {
      let fileId = editingDoc?.fileId || null;
      let fileUrl = editingDoc?.fileUrl || null;
      let fileName = editingDoc?.fileName || null;

      // Upload new file if selected
      if (selectedFile) {
        const uploadedFile = await uploadDocumentFile(selectedFile);
        if (uploadedFile) {
          fileId = uploadedFile.$id;
          fileUrl = await getDocumentFileUrl(fileId);
          fileName = selectedFile.name;
        }
      }

      if (editingDoc) {
        // Update existing document
        await updateDocument(editingDoc.$id, {
          name: form.name,
          category: form.category,
          description: form.description,
          amount: form.amount ? parseFloat(form.amount) : null,
          date: form.date,
          ...(selectedFile && { fileId, fileUrl, fileName }),
        });
      } else {
        // Create new document
        await createDocument({
          ...form,
          fileId,
          fileUrl,
          fileName,
          householdId: household.$id,
          userId: user.$id,
        });
      }

      await fetchDocuments();
      closeModal();
      Alert.alert(t("common.success"), editingDoc ? t("documents.documentUpdated") : t("documents.documentAdded"));
    } catch (error) {
      console.error("Error saving document:", error);
      Alert.alert(t("common.error"), t("documents.couldNotSaveDocument"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (doc) => {
    Alert.alert(
      t("documents.deleteDocument"),
      t("documents.deleteDocumentConfirm").replace("{{name}}", doc.name || ""),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => handleDelete(doc),
        },
      ]
    );
  };

  const handleDelete = async (doc) => {
    try {
      await deleteDocument(doc.$id, doc.fileId);
      await fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      Alert.alert(t("common.error"), t("documents.couldNotDeleteDocument"));
    }
  };

  const openFile = async (doc) => {
    if (doc.fileUrl) {
      try {
        await Linking.openURL(doc.fileUrl);
      } catch (error) {
        Alert.alert(t("common.error"), t("documents.couldNotOpenFile"));
      }
    } else {
      Alert.alert(t("documents.noFile"), t("documents.noAttachedFile"));
    }
  };

  const getCategoryConfig = (category) => {
    const configs = {
      [DocumentCategories.BILLS]: { icon: "receipt", color: "#F43F5E", labelKey: "documents.bills" },
      [DocumentCategories.INSURANCE]: { icon: "shield-checkmark", color: "#8B5CF6", labelKey: "documents.insurance" },
      [DocumentCategories.CONTRACTS]: { icon: "document-text", color: "#06B6D4", labelKey: "documents.contracts" },
      [DocumentCategories.RECEIPTS]: { icon: "pricetag", color: "#10B981", labelKey: "documents.receipts" },
      [DocumentCategories.OTHER]: { icon: "folder", color: "#F59E0B", labelKey: "documents.other" },
    };
    return configs[category] || configs[DocumentCategories.OTHER];
  };

  const filteredDocuments = documents.filter((doc) => {
    if (categoryFilter === "all") return true;
    return doc.category === categoryFilter;
  });

  const formatDate = (dateString) => {
    if (!dateString) return t("documents.noDate");
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatAmount = (amount) => {
    if (!amount) return null;
    return `€${parseFloat(amount).toFixed(2)}`;
  };

  const renderCategoryTabs = () => {
    const tabs = [
      { id: "all", labelKey: "common.all", icon: "apps" },
      { id: DocumentCategories.BILLS, labelKey: "documents.bills", icon: "receipt" },
      { id: DocumentCategories.INSURANCE, labelKey: "documents.insurance", icon: "shield-checkmark" },
      { id: DocumentCategories.CONTRACTS, labelKey: "documents.contracts", icon: "document-text" },
      { id: DocumentCategories.RECEIPTS, labelKey: "documents.receipts", icon: "pricetag" },
      { id: DocumentCategories.OTHER, labelKey: "documents.other", icon: "folder" },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.categoryTab,
              categoryFilter === tab.id && styles.categoryTabActive,
            ]}
            onPress={() => setCategoryFilter(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={categoryFilter === tab.id ? "#FFFFFF" : "#71717A"}
            />
            <Text
              style={[
                styles.categoryTabText,
                categoryFilter === tab.id && styles.categoryTabTextActive,
              ]}
            >
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderDocumentCard = ({ item }) => {
    const config = getCategoryConfig(item.category);
    
    return (
      <TouchableOpacity
        style={styles.documentCard}
        onPress={() => openFile(item)}
        activeOpacity={0.7}
      >
        {/* Category icon */}
        <View style={[styles.cardIconContainer, { backgroundColor: config.color + "20" }]}>
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          
          <View style={styles.cardMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: config.color + "20" }]}>
              <Text style={[styles.categoryBadgeText, { color: config.color }]}>
                {t(config.labelKey)}
              </Text>
            </View>
            <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
          </View>

          {item.amount && (
            <Text style={styles.cardAmount}>{formatAmount(item.amount)}</Text>
          )}

          {item.description && (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* File indicator */}
          {item.fileId && (
            <View style={styles.fileIndicator}>
              <Ionicons name="attach" size={14} color="#71717A" />
              <Text style={styles.fileIndicatorText} numberOfLines={1}>
                    {item.fileName || t("documents.attachedFile")}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openModal(item)}>
            <Ionicons name="pencil" size={18} color="#8B5CF6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete(item)}>
            <Ionicons name="trash" size={18} color="#F43F5E" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryChips = () => {
    const categories = Object.values(DocumentCategories);
    
    return (
      <View style={styles.categoryChipsRow}>
        {categories.map((cat) => {
          const config = getCategoryConfig(cat);
          const isSelected = form.category === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                isSelected && { backgroundColor: config.color, borderColor: config.color },
              ]}
              onPress={() => setForm({ ...form, category: cat })}
            >
              <Ionicons
                name={config.icon}
                size={14}
                color={isSelected ? "#FFFFFF" : "#71717A"}
              />
              <Text style={[styles.categoryChipText, isSelected && { color: "#FFFFFF" }]}>
                {t(config.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>{t("documents.title")}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Category Tabs */}
        {renderCategoryTabs()}

        {/* Documents List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        ) : (
          <FlatList
            data={filteredDocuments}
            renderItem={renderDocumentCard}
            keyExtractor={(item) => item.$id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#8B5CF6"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-outline" size={64} color="#3F3F46" />
                <Text style={styles.emptyTitle}>{t("documents.noDocuments")}</Text>
                <Text style={styles.emptySubtitle}>
                  {t("documents.addFirstDocument")}
                </Text>
              </View>
            }
          />
        )}
      </Animated.View>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDoc ? t("documents.editDocument") : t("documents.addDocument")}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text style={styles.inputLabel}>{t("documents.name")} *</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
                placeholder={t("documents.namePlaceholder")}
                placeholderTextColor="#71717A"
              />

              {/* Category */}
              <Text style={styles.inputLabel}>{t("documents.category")}</Text>
              {renderCategoryChips()}

              {/* Amount */}
              <Text style={styles.inputLabel}>{t("documents.amount")}</Text>
              <TextInput
                style={styles.input}
                value={form.amount}
                onChangeText={(text) => setForm({ ...form, amount: text })}
                placeholder="0.00"
                placeholderTextColor="#71717A"
                keyboardType="decimal-pad"
              />

              {/* Date */}
              <Text style={styles.inputLabel}>{t("documents.date")}</Text>
              <TextInput
                style={styles.input}
                value={form.date}
                onChangeText={(text) => setForm({ ...form, date: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#71717A"
              />

              {/* Description */}
              <Text style={styles.inputLabel}>{t("documents.description")}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.description}
                onChangeText={(text) => setForm({ ...form, description: text })}
                placeholder={t("documents.descriptionPlaceholder")}
                placeholderTextColor="#71717A"
                multiline
                numberOfLines={3}
              />

              {/* File Upload */}
              <Text style={styles.inputLabel}>{t("documents.attachFile")}</Text>
              <View style={styles.filePickerRow}>
                <TouchableOpacity style={styles.filePickerOption} onPress={takePhoto}>
                  <Ionicons name="camera" size={24} color="#8B5CF6" />
                  <Text style={styles.filePickerOptionText}>{t("documents.camera")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filePickerOption} onPress={pickDocument}>
                  <Ionicons name="document" size={24} color="#8B5CF6" />
                  <Text style={styles.filePickerOptionText}>{t("documents.file")}</Text>
                </TouchableOpacity>
              </View>
              
              {/* Selected file indicator */}
              {(selectedFile || editingDoc?.fileName) && (
                <View style={styles.selectedFileIndicator}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.selectedFileName} numberOfLines={1}>
                    {selectedFile?.name || editingDoc?.fileName}
                  </Text>
                  {selectedFile && (
                    <TouchableOpacity onPress={() => setSelectedFile(null)}>
                      <Ionicons name="close-circle" size={18} color="#F43F5E" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {/* Spacer for bottom padding */}
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingDoc ? t("common.save") : t("common.add")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#111114",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A1A1F",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryTabs: {
    backgroundColor: "#111114",
    paddingTop: 0,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    maxHeight: 40,
  },
  categoryTabsContent: {
    paddingHorizontal: 12,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#1A1A1F",
    marginRight: 6,
    gap: 3,
  },
  categoryTabActive: {
    backgroundColor: "#8B5CF6",
  },
  categoryTabText: {
    fontSize: 11,
    color: "#71717A",
    fontWeight: "500",
  },
  categoryTabTextActive: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  documentCard: {
    backgroundColor: "#1A1A1F",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardDate: {
    fontSize: 12,
    color: "#71717A",
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
    marginTop: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: "#A1A1AA",
    marginTop: 4,
  },
  fileIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  fileIndicatorText: {
    fontSize: 12,
    color: "#71717A",
    flex: 1,
  },
  cardActions: {
    justifyContent: "center",
    gap: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#222228",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#71717A",
    marginTop: 8,
    textAlign: "center",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1A1A1F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexGrow: 1,
    flexShrink: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#A1A1AA",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#111114",
    borderRadius: 10,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  categoryChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#111114",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 4,
  },
  categoryChipText: {
    fontSize: 11,
    color: "#71717A",
    fontWeight: "500",
  },
  filePickerRow: {
    flexDirection: "row",
    gap: 12,
  },
  filePickerOption: {
    flex: 1,
    backgroundColor: "#111114",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderStyle: "dashed",
    gap: 8,
  },
  filePickerOptionText: {
    fontSize: 12,
    color: "#A1A1AA",
    fontWeight: "500",
  },
  selectedFileIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  selectedFileName: {
    flex: 1,
    fontSize: 13,
    color: "#10B981",
  },
  modalActions: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    gap: 12,
    backgroundColor: "#1A1A1F",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#222228",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A1A1AA",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default DocumentsScreen;

