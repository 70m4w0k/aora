import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
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
  Easing,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useGlobalContext } from "../../context/GlobalProvider";
import { useTranslation } from "../../hooks/useTranslation";
import {
  ShoppingCategories,
  getHouseholdShoppingItems,
  createShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  getHouseholdMembers,
} from "../../lib/appwrite";

import EmptyState from "../../components/EmptyState";

const ShoppingScreen = () => {
  const { user, household } = useGlobalContext();
  const t = useTranslation();
  
  // Shopping Categories with icons and colors (matching expense style)
  const SHOPPING_CATEGORIES_CONFIG = {
    groceries: { icon: "cart", label: t("shopping.groceries"), color: "#22C55E" },
    household: { icon: "home", label: t("shopping.household"), color: "#8B5CF6" },
    personal: { icon: "person", label: t("shopping.personal"), color: "#EC4899" },
    other: { icon: "apps", label: t("shopping.other"), color: "#71717A" },
  };
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  // Add form state (for add modal)
  const [addForm, setAddForm] = useState({
    name: "",
    quantity: "1",
    category: ShoppingCategories.GROCERIES,
    assignedTo: "",
  });
  
  // Edit form state (for edit modal)
  const [editForm, setEditForm] = useState({
    name: "",
    quantity: "1",
    category: ShoppingCategories.GROCERIES,
    assignedTo: "",
  });

  // For animations - use useRef to prevent re-creation on each render
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // For filtering
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCompleted, setShowCompleted] = useState(true);

  // Track which category tab is active
  const [activeTab, setActiveTab] = useState("all");

  // History state
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);


  // Track which item is being edited
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (household?.$id) {
      fetchItems();
      fetchUsers();
    }

    // Animate content in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Cleanup timeouts on unmount
    return () => {
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
    };
  }, [household?.$id]);

  // Handle add item
  const handleAddItem = async () => {
    if (addForm.name.trim() === "") {
      Alert.alert(t("common.error"), t("shopping.addItem"));
      return;
    }

    try {
      await createShoppingItem({
        ...addForm,
        userId: user.$id,
        householdId: household.$id,
      });

      await fetchItems();
      setAddModalVisible(false);
      
      // Reset form
      setAddForm({
        name: "",
        quantity: "1",
        category: ShoppingCategories.GROCERIES,
        assignedTo: "",
      });
    } catch (error) {
      Alert.alert(t("common.error"), error.message);
    }
  };

  const fetchItems = async () => {
    if (!household?.$id) return;
    try {
      const shoppingItems = await getHouseholdShoppingItems(household.$id);
      setItems(shoppingItems || []);
    } catch (error) {
      console.error("Error fetching shopping items:", error);
    }
  };

  const fetchHistoryItems = async () => {
    if (!household?.$id) return;
    try {
      const shoppingItems = await getHouseholdShoppingItems(household.$id);
      const completed = (shoppingItems || []).filter(item => item.completed);
      setHistoryItems(completed);
    } catch (error) {
      console.error("Error fetching history items:", error);
    }
  };

  const fetchUsers = async () => {
    if (!household?.$id) return;
    try {
      const members = await getHouseholdMembers(household.$id);
      setUsers(members || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  // Function to open the edit modal for an existing item
  const handleEditItem = (item) => {
    setEditForm({
      name: item.name,
      quantity: item.quantity.toString(),
      category: item.category,
      assignedTo: item.assignedTo || "",
    });
    setEditingItem(item);
    setEditModalVisible(true);
  };

  // Handle edit item submission
  const handleEditSubmit = async () => {
    if (editForm.name.trim() === "") {
      return Alert.alert(t("common.error"), t("shopping.addItem"));
    }

    try {
      await updateShoppingItem(editingItem.$id, {
        ...editForm,
        quantity: editForm.quantity,
      });

      await fetchItems();
      setEditModalVisible(false);

      // Reset form and editing state
      setEditForm({
        name: "",
        quantity: "1",
        category: ShoppingCategories.GROCERIES,
        assignedTo: "",
      });
      setEditingItem(null);
    } catch (error) {
      Alert.alert(t("common.error"), error.message);
    }
  };

  const toggleItemComplete = async (item) => {
    try {
      // Only update the completion status
      await updateShoppingItem(item.$id, {
        completed: !item.completed,
      });
      await fetchItems();
      // Refresh history if modal is open
      if (historyModalVisible) {
        await fetchHistoryItems();
      }
    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert(t("common.error"), t("shopping.couldNotUpdateStatus"));
    }
  };

  const restoreItem = async (item) => {
    try {
      await updateShoppingItem(item.$id, {
        completed: false,
      });
      await fetchItems();
      await fetchHistoryItems();
      Alert.alert(t("common.success"), t("shopping.itemRestored").replace("{{name}}", item.name));
    } catch (error) {
      console.error("Error restoring item:", error);
      Alert.alert(t("common.error"), t("shopping.couldNotRestore"));
    }
  };

  // Group history items by date
  const groupHistoryByDate = (items) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    items.forEach((item) => {
      const completedDate = new Date(item.$updatedAt);
      
      if (completedDate >= today) {
        groups.today.push(item);
      } else if (completedDate >= yesterday) {
        groups.yesterday.push(item);
      } else if (completedDate >= weekAgo) {
        groups.thisWeek.push(item);
      } else {
        groups.older.push(item);
      }
    });

    // Sort each group by date (newest first)
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => new Date(b.$updatedAt) - new Date(a.$updatedAt));
    });

    return groups;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t("shopping.today");
    } else if (diffDays === 1) {
      return t("shopping.yesterday");
    } else if (diffDays <= 7) {
      return t("shopping.daysAgo").replace("{{days}}", diffDays.toString());
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteShoppingItem(itemId);
      await fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const confirmDelete = (item) => {
    Alert.alert(
      t("shopping.deleteItem"),
      t("shopping.deleteConfirm").replace("{{name}}", item.name),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          onPress: () => handleDeleteItem(item.$id),
          style: "destructive",
        },
      ]
    );
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case ShoppingCategories.GROCERIES:
        return ["#4CAF50", "#2E7D32"]; // Green gradient
      case ShoppingCategories.HOUSEHOLD:
        return ["#42A5F5", "#1976D2"]; // Blue gradient
      case ShoppingCategories.PERSONAL:
        return ["#AB47BC", "#7B1FA2"]; // Purple gradient
      case ShoppingCategories.OTHER:
        return ["#FFA726", "#EF6C00"]; // Orange gradient
      default:
        return ["#90A4AE", "#607D8B"]; // Grey gradient
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case ShoppingCategories.GROCERIES:
        return "cart";
      case ShoppingCategories.HOUSEHOLD:
        return "home";
      case ShoppingCategories.PERSONAL:
        return "person";
      case ShoppingCategories.OTHER:
        return "apps";
      default:
        return "list";
    }
  };

  const getAssignedUserName = (userId) => {
    if (!userId) return t("shopping.unassigned");
    const assignedUser = users.find((u) => u.$id === userId);
    return assignedUser ? assignedUser.username : t("shopping.unknown");
  };

  const filteredItems = items.filter((item) => {
    // Filter by completion status
    if (!showCompleted && item.completed) return false;

    // Filter by category
    if (categoryFilter !== "all" && item.category !== categoryFilter)
      return false;

    return true;
  });

  // No more "add item" card - we use inline quick-add
  const listData = filteredItems;

  // Function to handle tap on a shopping item

  // Render shopping item card (matching expense style)
  const renderItem = ({ item }) => {
    const category = SHOPPING_CATEGORIES_CONFIG[item.category] || SHOPPING_CATEGORIES_CONFIG.other;
    const assignedUser = users.find((u) => u.$id === item.assignedTo);
    
    return (
      <TouchableOpacity 
        style={[
          styles.itemCard, 
          item.completed && styles.itemCardCompleted
        ]} 
        activeOpacity={0.7}
        onPress={() => handleEditItem(item)}
      >
        {/* Category icon */}
        <View style={[styles.categoryIcon, { backgroundColor: category.color + "20" }]}>
          <Ionicons name={category.icon} size={20} color={category.color} />
        </View>

        {/* Content */}
        <View style={styles.itemContent}>
          <Text 
            style={[
              styles.itemTitle, 
              item.completed && styles.itemTitleCompleted
            ]} 
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View style={styles.itemSubtitle}>
            {assignedUser && (
              <Text style={styles.itemAssigned}>
                {assignedUser.username} • 
              </Text>
            )}
            <Text style={styles.itemCategory}>{category.label}</Text>
            {item.quantity && parseInt(item.quantity) > 1 && (
              <Text style={styles.itemQuantity}> • {t("shopping.quantity")}: {item.quantity}</Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.itemRightSection}>
          {/* Complete button */}
          <TouchableOpacity 
            style={[
              styles.completeButton,
              item.completed && styles.completeButtonActive
            ]}
            onPress={(e) => {
              e.stopPropagation();
              toggleItemComplete(item);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={item.completed ? "checkmark-circle" : "checkmark-circle-outline"} 
              size={24} 
              color={item.completed ? "#22C55E" : "#71717A"} 
            />
          </TouchableOpacity>
          
          {/* Delete button */}
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              confirmDelete(item);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryTabs = () => {
    const categories = [
      { id: "all", label: t("common.all"), icon: "grid" },
      { id: ShoppingCategories.GROCERIES, label: t("shopping.groceries"), icon: SHOPPING_CATEGORIES_CONFIG.groceries.icon },
      { id: ShoppingCategories.HOUSEHOLD, label: t("shopping.household"), icon: SHOPPING_CATEGORIES_CONFIG.household.icon },
      { id: ShoppingCategories.PERSONAL, label: t("shopping.personal"), icon: SHOPPING_CATEGORIES_CONFIG.personal.icon },
      { id: ShoppingCategories.OTHER, label: t("shopping.other"), icon: SHOPPING_CATEGORIES_CONFIG.other.icon },
    ];

    return (
      <View style={styles.categoryTabs}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {categories.map((category) => {
            const categoryConfig = category.id === "all" 
              ? null 
              : SHOPPING_CATEGORIES_CONFIG[category.id];
            
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryTab,
                  activeTab === category.id && styles.activeTab,
                  activeTab === category.id && categoryConfig && { backgroundColor: categoryConfig.color + "20" },
                ]}
                onPress={() => {
                  setCategoryFilter(category.id);
                  setActiveTab(category.id);
                }}
              >
                <Ionicons 
                  name={category.icon} 
                  size={16} 
                  color={activeTab === category.id 
                    ? (categoryConfig ? categoryConfig.color : "#10B981")
                    : "#71717A"
                  } 
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.categoryTabText,
                    activeTab === category.id && styles.activeCategoryText,
                    activeTab === category.id && categoryConfig && { color: categoryConfig.color },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>{t("shopping.title")}</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => {
                  setHistoryModalVisible(true);
                  fetchHistoryItems();
                }}
              >
                <Ionicons name="time-outline" size={20} color="#71717A" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.filterToggle}
                onPress={() => setShowCompleted(!showCompleted)}
              >
                <Ionicons 
                  name={showCompleted ? "eye" : "eye-off"} 
                  size={20} 
                  color={showCompleted ? "#10B981" : "#71717A"} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter tabs */}
          {renderCategoryTabs()}
        </View>

      <Animated.View style={styles.content}>
        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.$id || `add-item-${index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={64} color="#3F3F46" />
              <Text style={styles.emptyTitle}>{t("shopping.noItems")}</Text>
              <Text style={styles.emptySubtitle}>{t("shopping.addFirstItem")}</Text>
            </View>
          }
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
        />
      </Animated.View>

      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Add Item Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t("shopping.addItem")}</Text>
              <TouchableOpacity onPress={handleAddItem}>
                <Text style={styles.modalSaveText}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Item Name */}
              <Text style={[styles.inputLabel, { marginTop: 0 }]}>{t("shopping.itemName")}</Text>
              <TextInput
                style={styles.input}
                value={addForm.name}
                onChangeText={(text) => setAddForm({ ...addForm, name: text })}
                placeholder={t("shopping.itemNamePlaceholder")}
                placeholderTextColor="#71717A"
              />

              {/* Quantity with +/- buttons */}
              <Text style={styles.inputLabel}>{t("shopping.quantity")}</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentQty = parseInt(addForm.quantity || "1");
                    if (currentQty > 1) {
                      setAddForm({ ...addForm, quantity: (currentQty - 1).toString() });
                    }
                  }}
                >
                  <Ionicons name="remove" size={20} color="#FFF" />
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  value={addForm.quantity}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    setAddForm({ ...addForm, quantity: Math.max(1, num).toString() });
                  }}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentQty = parseInt(addForm.quantity || "1");
                    setAddForm({ ...addForm, quantity: (currentQty + 1).toString() });
                  }}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Category - Horizontal scroll chips */}
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryScrollContent}
              >
                {Object.entries(SHOPPING_CATEGORIES_CONFIG).map(([key, cat]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryChip,
                      addForm.category === key && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => setAddForm({ ...addForm, category: key })}
                  >
                    <Ionicons 
                      name={cat.icon} 
                      size={16} 
                      color={addForm.category === key ? "#FFF" : "#71717A"} 
                    />
                    <Text style={[
                      styles.categoryChipText,
                      addForm.category === key && { color: "#FFF" },
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Assign To - Horizontal scroll user chips */}
              <Text style={styles.inputLabel}>Assign To</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.userChipsScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.userChip,
                    !addForm.assignedTo && styles.userChipSelected,
                  ]}
                  onPress={() => setAddForm({ ...addForm, assignedTo: "" })}
                >
                  <View style={[styles.userChipAvatar, { backgroundColor: "#71717A" }]}>
                    <Ionicons name="person-outline" size={14} color="#FFF" />
                  </View>
                  <Text style={[
                    styles.userChipText,
                    !addForm.assignedTo && styles.userChipTextSelected,
                  ]}>
                    {t("shopping.unassigned")}
                  </Text>
                </TouchableOpacity>
                {users.map((u) => (
                  <TouchableOpacity
                    key={u.$id}
                    style={[
                      styles.userChip,
                      addForm.assignedTo === u.$id && styles.userChipSelected,
                    ]}
                    onPress={() => setAddForm({ ...addForm, assignedTo: u.$id })}
                  >
                    <View style={[styles.userChipAvatar, { backgroundColor: u.color || "#10B981" }]}>
                      <Text style={styles.userChipAvatarText}>{u.username?.[0]?.toUpperCase()}</Text>
                    </View>
                    <Text style={[
                      styles.userChipText,
                      addForm.assignedTo === u.$id && styles.userChipTextSelected,
                    ]}>
                      {u.username}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setEditModalVisible(false);
          setEditingItem(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingItem(null);
                }}
              >
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t("shopping.editItem")}</Text>
              <TouchableOpacity onPress={handleEditSubmit}>
                <Text style={styles.modalSaveText}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Item Name */}
              <Text style={[styles.inputLabel, { marginTop: 0 }]}>{t("shopping.itemName")}</Text>
              <TextInput
                style={styles.input}
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                placeholder={t("shopping.itemNamePlaceholder")}
                placeholderTextColor="#71717A"
              />

              {/* Quantity with +/- buttons */}
              <Text style={styles.inputLabel}>{t("shopping.quantity")}</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentQty = parseInt(editForm.quantity || "1");
                    if (currentQty > 1) {
                      setEditForm({ ...editForm, quantity: (currentQty - 1).toString() });
                    }
                  }}
                >
                  <Ionicons name="remove" size={20} color="#FFF" />
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  value={editForm.quantity}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    setEditForm({ ...editForm, quantity: Math.max(1, num).toString() });
                  }}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentQty = parseInt(editForm.quantity || "1");
                    setEditForm({ ...editForm, quantity: (currentQty + 1).toString() });
                  }}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Category - Horizontal scroll chips */}
              <Text style={styles.inputLabel}>{t("shopping.category")}</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryScrollContent}
              >
                {Object.entries(SHOPPING_CATEGORIES_CONFIG).map(([key, cat]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryChip,
                      editForm.category === key && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => setEditForm({ ...editForm, category: key })}
                  >
                    <Ionicons 
                      name={cat.icon} 
                      size={16} 
                      color={editForm.category === key ? "#FFF" : "#71717A"} 
                    />
                    <Text style={[
                      styles.categoryChipText,
                      editForm.category === key && { color: "#FFF" },
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Assign To - Horizontal scroll user chips */}
              <Text style={styles.inputLabel}>{t("shopping.assignTo")}</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.userChipsScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.userChip,
                    !editForm.assignedTo && styles.userChipSelected,
                  ]}
                  onPress={() => setEditForm({ ...editForm, assignedTo: "" })}
                >
                  <View style={[styles.userChipAvatar, { backgroundColor: "#71717A" }]}>
                    <Ionicons name="person-outline" size={14} color="#FFF" />
                  </View>
                  <Text style={[
                    styles.userChipText,
                    !editForm.assignedTo && styles.userChipTextSelected,
                  ]}>
                    {t("shopping.unassigned")}
                  </Text>
                </TouchableOpacity>
                {users.map((u) => (
                  <TouchableOpacity
                    key={u.$id}
                    style={[
                      styles.userChip,
                      editForm.assignedTo === u.$id && styles.userChipSelected,
                    ]}
                    onPress={() => setEditForm({ ...editForm, assignedTo: u.$id })}
                  >
                    <View style={[styles.userChipAvatar, { backgroundColor: u.color || "#10B981" }]}>
                      <Text style={styles.userChipAvatarText}>{u.username?.[0]?.toUpperCase()}</Text>
                    </View>
                    <Text style={[
                      styles.userChipText,
                      editForm.assignedTo === u.$id && styles.userChipTextSelected,
                    ]}>
                      {u.username}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t("shopping.history")}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {historyItems.length === 0 ? (
                <View style={styles.emptyHistoryState}>
                  <Ionicons name="time-outline" size={64} color="#3F3F46" />
                  <Text style={styles.emptyHistoryTitle}>{t("shopping.noHistory")}</Text>
                  <Text style={styles.emptyHistorySubtitle}>{t("shopping.completedItemsAppear")}</Text>
                </View>
              ) : (
                (() => {
                  const grouped = groupHistoryByDate(historyItems);
                  const sections = [
                    { key: "today", title: t("shopping.today"), items: grouped.today },
                    { key: "yesterday", title: t("shopping.yesterday"), items: grouped.yesterday },
                    { key: "thisWeek", title: t("shopping.thisWeek"), items: grouped.thisWeek },
                    { key: "older", title: t("shopping.older"), items: grouped.older },
                  ].filter(section => section.items.length > 0);

                  return sections.map((section) => (
                    <View key={section.key} style={styles.historySection}>
                      <Text style={styles.historySectionTitle}>{section.title}</Text>
                      {section.items.map((item) => {
                        const category = SHOPPING_CATEGORIES_CONFIG[item.category] || SHOPPING_CATEGORIES_CONFIG.other;
                        const assignedUser = users.find((u) => u.$id === item.assignedTo);
                        const completedDate = formatDate(item.$updatedAt);

                        return (
                          <View key={item.$id} style={styles.historyItemCard}>
                            <View style={[styles.historyCategoryIcon, { backgroundColor: category.color + "20" }]}>
                              <Ionicons name={category.icon} size={18} color={category.color} />
                            </View>
                            <View style={styles.historyItemContent}>
                              <Text style={styles.historyItemName}>{item.name}</Text>
                              <View style={styles.historyItemMeta}>
                                {assignedUser && (
                                  <Text style={styles.historyItemMetaText}>
                                    {assignedUser.username} • 
                                  </Text>
                                )}
                                <Text style={styles.historyItemMetaText}>
                                  {category.label}
                                  {item.quantity && parseInt(item.quantity) > 1 && ` • ${t("shopping.quantity")}: ${item.quantity}`}
                                </Text>
                              </View>
                              <Text style={styles.historyItemDate}>{completedDate}</Text>
                            </View>
                            <TouchableOpacity
                              style={styles.restoreButton}
                              onPress={() => restoreItem(item)}
                            >
                              <Ionicons name="refresh" size={18} color="#10B981" />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  ));
                })()
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
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
  header: {
    paddingTop: Platform.OS === "android" ? 40 : 0,
    paddingBottom: 12,
    backgroundColor: "#111114",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#1A1A1F",
    marginRight: 8,
  },
  filterToggle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#1A1A1F",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1F",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 4,
  },
  itemTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#71717A",
  },
  itemSubtitle: {
    fontSize: 13,
    color: "#71717A",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  itemAssigned: {
    color: "#A1A1AA",
    fontWeight: "500",
  },
  itemCategory: {
    color: "#71717A",
  },
  itemQuantity: {
    color: "#71717A",
  },
  itemRightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  completeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonActive: {
    // No additional styling needed, icon color changes
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#71717A",
    marginTop: 4,
  },
  categoryTabs: {
    marginTop: 12,
    paddingHorizontal: 12,
  },
  tabsContainer: {
    paddingRight: 20,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
    borderRadius: 16,
    backgroundColor: "#1A1A1F",
  },
  activeTab: {
    backgroundColor: "#1A1A1F",
  },
  categoryTabText: {
    color: "#71717A",
    fontWeight: "500",
    fontSize: 13,
  },
  activeCategoryText: {
    color: "#10B981",
  },
  showCompletedToggle: {
    marginTop: 12,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1A1A1F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#71717A",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#111114",
    borderRadius: 12,
    padding: 14,
    color: "#FFF",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111114",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  quantityButton: {
    width: 54,
    height: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  quantityInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    paddingVertical: 14,
    textAlign: "center",
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryScrollContent: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#111114",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginRight: 8,
    gap: 6,
  },
  categoryChipText: {
    fontSize: 13,
    color: "#71717A",
    fontWeight: "500",
  },
  userChipsScroll: {
    marginBottom: 8,
  },
  userChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#111114",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginRight: 8,
    gap: 8,
  },
  userChipSelected: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "#10B981",
  },
  userChipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  userChipAvatarText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  userChipText: {
    fontSize: 14,
    color: "#A1A1AA",
    fontWeight: "500",
  },
  userChipTextSelected: {
    color: "#FFF",
  },
  itemCardCompleted: {
    opacity: 0.7,
    backgroundColor: "#111114",
  },
  // History Modal Styles
  emptyHistoryState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyHistoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 16,
  },
  emptyHistorySubtitle: {
    fontSize: 14,
    color: "#71717A",
    marginTop: 4,
  },
  historySection: {
    marginBottom: 24,
  },
  historySectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#71717A",
    marginBottom: 12,
    marginTop: 0,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  historyItemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111114",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  historyCategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FFF",
    marginBottom: 4,
  },
  historyItemMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  historyItemMetaText: {
    fontSize: 12,
    color: "#71717A",
  },
  historyItemDate: {
    fontSize: 11,
    color: "#71717A",
    fontStyle: "italic",
  },
  restoreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});

export default ShoppingScreen;
