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
import {
  ShoppingCategories,
  getHouseholdShoppingItems,
  createShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  getHouseholdMembers,
} from "../../lib/appwrite";

// Shopping Categories with icons and colors (matching expense style)
const SHOPPING_CATEGORIES_CONFIG = {
  groceries: { icon: "cart", label: "Groceries", color: "#22C55E" },
  household: { icon: "home", label: "Household", color: "#8B5CF6" },
  personal: { icon: "person", label: "Personal", color: "#EC4899" },
  other: { icon: "apps", label: "Other", color: "#71717A" },
};
import EmptyState from "../../components/EmptyState";

// Shopping Categories with icons and colors
const SHOPPING_CATEGORY_CONFIG = {
  groceries: { icon: "basket", label: "Groceries", color: "#22C55E" },
  household: { icon: "home", label: "Household", color: "#8B5CF6" },
  personal: { icon: "person", label: "Personal", color: "#F43F5E" },
  other: { icon: "cube", label: "Other", color: "#71717A" },
};

const ShoppingScreen = () => {
  const { user, household } = useGlobalContext();
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Quick add state
  const [quickAddText, setQuickAddText] = useState("");
  const [quickAddCategory, setQuickAddCategory] = useState(ShoppingCategories.GROCERIES);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const quickAddInputRef = useRef(null);
  
  // Edit form state (for modal)
  const [form, setForm] = useState({
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

  // Get the screen width to calculate item width for the grid
  const screenWidth = Dimensions.get("window").width;
  const itemWidth = (screenWidth - 48) / 2; // Account for padding and margins

  // Add double-tap state tracking (same as TasksTracker)
  const [tappedItemId, setTappedItemId] = useState(null);
  const [doubleTapItemId, setDoubleTapItemId] = useState(null);
  const lastTapTimeRef = useRef(0);
  const doubleTapTimeoutRef = useRef(null);
  const completeAnimationRef = useRef(new Animated.Value(0)).current;

  // First, let's add a new state variable to track which item is being edited
  const [editingItem, setEditingItem] = useState(null);

  // Modify the modal title and button text based on editing state
  const modalTitle = editingItem ? "Edit Shopping Item" : "Add Shopping Item";
  const submitButtonText = editingItem ? "Update" : "Add";

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

  // Quick add item handler - ultra fast addition
  const handleQuickAdd = async () => {
    if (quickAddText.trim() === "") return;
    
    setIsAddingItem(true);
    try {
      await createShoppingItem({
        name: quickAddText.trim(),
        quantity: "1",
        category: quickAddCategory,
        assignedTo: "",
        userId: user.$id,
        householdId: household.$id,
      });
      
      setQuickAddText("");
      Keyboard.dismiss();
      await fetchItems();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsAddingItem(false);
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
    setForm({
      name: item.name,
      quantity: item.quantity.toString(),
      category: item.category,
      assignedTo: item.assignedTo || "",
    });
    setEditingItem(item);
    setModalVisible(true);
  };

  // Update the form submission handler to either create or update
  const handleSubmitForm = async () => {
    if (form.name.trim() === "") {
      return Alert.alert("Error", "Please provide an item name");
    }

    try {
      if (editingItem) {
        // Update existing item
        await updateShoppingItem(editingItem.$id, {
          ...form,
          quantity: form.quantity,
        });
      } else {
        // Create new item
        await createShoppingItem({
          ...form,
          userId: user.$id,
          householdId: household.$id,
        });
      }

      await fetchItems();
      setModalVisible(false);

      // Reset form and editing state
      setForm({
        name: "",
        quantity: "1",
        category: ShoppingCategories.GROCERIES,
        assignedTo: "",
      });
      setEditingItem(null);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const toggleItemComplete = async (item) => {
    try {
      // Only update the completion status
      await updateShoppingItem(item.$id, {
        completed: !item.completed,
      });
      await fetchItems();
    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert("Error", "Could not update item status");
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
      "Delete Item",
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
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
    if (!userId) return "Unassigned";
    const assignedUser = users.find((u) => u.$id === userId);
    return assignedUser ? assignedUser.username : "Unknown";
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
  const handleItemTap = (itemId) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms between taps to count as double-tap

    // If this is the first tap or tap on a different item
    if (tappedItemId !== itemId) {
      // Clear any existing timeout
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }

      // Set this item as tapped
      setTappedItemId(itemId);
      lastTapTimeRef.current = now;

      // Clear the tapped state after a delay if no second tap happens
      doubleTapTimeoutRef.current = setTimeout(() => {
        setTappedItemId(null);
      }, DOUBLE_TAP_DELAY);

      return;
    }

    // If tapping the same item that was just tapped
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
      // This is a double tap - mark item as complete
      clearTimeout(doubleTapTimeoutRef.current);
      setDoubleTapItemId(itemId);
      setTappedItemId(null);

      // Show completion animation
      completeAnimationRef.setValue(0);
      Animated.timing(completeAnimationRef, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.bezier(0.175, 0.885, 0.32, 1.275), // Bounce-like easing
      }).start(() => {
        // Actually complete the item after animation finishes
        const item = filteredItems.find((item) => item.$id === itemId);
        if (item) {
          toggleItemComplete(item);
        }

        // Reset animation state after a brief delay
        setTimeout(() => {
          setDoubleTapItemId(null);
        }, 200);
      });
    } else {
      // If the second tap was too slow, treat as a new first tap
      clearTimeout(doubleTapTimeoutRef.current);
      lastTapTimeRef.current = now;

      doubleTapTimeoutRef.current = setTimeout(() => {
        setTappedItemId(null);
      }, DOUBLE_TAP_DELAY);
    }
  };

  // Update quantity inline
  const handleQuantityChange = async (item, delta) => {
    const newQty = Math.max(1, parseInt(item.quantity || "1") + delta);
    try {
      await updateShoppingItem(item.$id, { quantity: newQty.toString() });
      await fetchItems();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  // Render the items in a 2-column grid
  const renderItem = ({ item, index }) => {
    // Regular shopping item
    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          { width: itemWidth },
          tappedItemId === item.$id && styles.itemCardTapped,
          item.completed && styles.itemCardCompleted,
        ]}
        onPress={() => handleItemTap(item.$id)}
        activeOpacity={0.7}
      >
        {/* Action buttons now in the top right corner */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditItem(item)}
          >
            <MaterialCommunityIcons name="pencil" size={16} color="#4F86C6" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => confirmDelete(item)}
          >
            <MaterialCommunityIcons name="close" size={16} color="#F44336" />
          </TouchableOpacity>
        </View>

        {/* Rest of card content */}
        {tappedItemId === item.$id && (
          <View style={styles.completePromptOverlay}>
            <Text
              style={[
                styles.completePromptText,
                {
                  color: getCategoryColor(item.category)[0],
                  textShadowColor: "rgba(255, 255, 255, 0.8)",
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 3,
                },
              ]}
            >
              Complete?
            </Text>
            <Text style={styles.completePromptSubtext}>
              Tap again to confirm
            </Text>
          </View>
        )}

        {/* Animation overlay */}
        {doubleTapItemId === item.$id && (
          <Animated.View
            style={[
              styles.completionOverlay,
              {
                /*...*/
              },
            ]}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={60}
              color="#4CAF50"
            />
          </Animated.View>
        )}

        <View style={styles.itemHeader}>
          {item.completed && (
            <View style={styles.completedLabel}>
              <Text style={styles.completedLabelText}>Completed</Text>
            </View>
          )}
        </View>

        {/* Item content remains the same */}
        <View style={styles.itemBody}>
          <Text
            style={[
              styles.itemName,
              item.completed && styles.itemNameCompleted,
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>

          <View style={styles.itemDetails}>
            <View
              style={[
                styles.categoryPill,
                { backgroundColor: getCategoryColor(item.category)[0] + "20" },
              ]}
            >
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: getCategoryColor(item.category)[0] },
                ]}
              />
              <Text
                style={[
                  styles.categoryPillText,
                  { color: getCategoryColor(item.category)[0] },
                ]}
              >
                {item.category}
              </Text>
            </View>
          </View>

          {/* Quantity stepper */}
          <View style={styles.quantityStepper}>
            <TouchableOpacity 
              style={styles.stepperButton}
              onPress={() => handleQuantityChange(item, -1)}
            >
              <Ionicons name="remove" size={16} color="#A1A1AA" />
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{item.quantity || 1}</Text>
            <TouchableOpacity 
              style={styles.stepperButton}
              onPress={() => handleQuantityChange(item, 1)}
            >
              <Ionicons name="add" size={16} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryTabs = () => {
    const categories = [
      { id: "all", label: "All" },
      { id: ShoppingCategories.GROCERIES, label: "Groceries" },
      { id: ShoppingCategories.HOUSEHOLD, label: "Household" },
      { id: ShoppingCategories.PERSONAL, label: "Personal" },
      { id: ShoppingCategories.OTHER, label: "Other" },
    ];

    return (
      <View style={styles.categoryTabs}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                activeTab === category.id && styles.activeTab,
              ]}
              onPress={() => {
                setCategoryFilter(category.id);
                setActiveTab(category.id);
              }}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  activeTab === category.id && styles.activeCategoryText,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category chip data for quick add
  const categoryChips = [
    { id: ShoppingCategories.GROCERIES, icon: "cart", label: "Grocery" },
    { id: ShoppingCategories.HOUSEHOLD, icon: "home", label: "Home" },
    { id: ShoppingCategories.PERSONAL, icon: "person", label: "Personal" },
    { id: ShoppingCategories.OTHER, icon: "apps", label: "Other" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Shopping List</Text>
            <View style={styles.headerActions}>
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

          {/* Quick Add Input */}
          <View style={styles.quickAddContainer}>
            <View style={styles.quickAddInputWrapper}>
              <Ionicons name="add-circle" size={24} color="#10B981" style={styles.quickAddIcon} />
              <TextInput
                ref={quickAddInputRef}
                style={styles.quickAddInput}
                placeholder="Add item..."
                placeholderTextColor="#71717A"
                value={quickAddText}
                onChangeText={setQuickAddText}
                onSubmitEditing={handleQuickAdd}
                returnKeyType="done"
                blurOnSubmit={false}
              />
              {quickAddText.length > 0 && (
                <TouchableOpacity 
                  style={styles.quickAddButton}
                  onPress={handleQuickAdd}
                  disabled={isAddingItem}
                >
                  <Ionicons 
                    name={isAddingItem ? "hourglass" : "arrow-up-circle"} 
                    size={28} 
                    color="#10B981" 
                  />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Category chips for quick selection */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryChipsScroll}
              contentContainerStyle={styles.categoryChipsContainer}
            >
              {categoryChips.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    quickAddCategory === cat.id && styles.categoryChipActive,
                  ]}
                  onPress={() => setQuickAddCategory(cat.id)}
                >
                  <Ionicons 
                    name={cat.icon} 
                    size={14} 
                    color={quickAddCategory === cat.id ? "#FFFFFF" : "#71717A"} 
                  />
                  <Text style={[
                    styles.categoryChipText,
                    quickAddCategory === cat.id && styles.categoryChipTextActive,
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Filter tabs */}
          {renderCategoryTabs()}
        </View>

      <Animated.View style={styles.content}>
        <FlatList
          key="grid-view"
          data={listData}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.$id || `add-item-${index}`}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No items yet"
              message="Add some items to your shopping list"
            />
          }
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
        />
      </Animated.View>
      </KeyboardAvoidingView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
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
                  setModalVisible(false);
                  setEditingItem(null);
                }}
              >
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity onPress={handleSubmitForm}>
                <Text style={styles.modalSaveText}>{submitButtonText}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Item Name */}
              <Text style={[styles.inputLabel, { marginTop: 0 }]}>Item Name</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
                placeholder="What do you need?"
                placeholderTextColor="#71717A"
              />

              {/* Quantity with +/- buttons */}
              <Text style={styles.inputLabel}>Quantity</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentQty = parseInt(form.quantity || "1");
                    if (currentQty > 1) {
                      setForm({ ...form, quantity: (currentQty - 1).toString() });
                    }
                  }}
                >
                  <Ionicons name="remove" size={20} color="#FFF" />
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  value={form.quantity}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    setForm({ ...form, quantity: Math.max(1, num).toString() });
                  }}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentQty = parseInt(form.quantity || "1");
                    setForm({ ...form, quantity: (currentQty + 1).toString() });
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
                      form.category === key && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => setForm({ ...form, category: key })}
                  >
                    <Ionicons 
                      name={cat.icon} 
                      size={16} 
                      color={form.category === key ? "#FFF" : "#71717A"} 
                    />
                    <Text style={[
                      styles.categoryChipText,
                      form.category === key && { color: "#FFF" },
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
                    !form.assignedTo && styles.userChipSelected,
                  ]}
                  onPress={() => setForm({ ...form, assignedTo: "" })}
                >
                  <View style={[styles.userChipAvatar, { backgroundColor: "#71717A" }]}>
                    <Ionicons name="person-outline" size={14} color="#FFF" />
                  </View>
                  <Text style={[
                    styles.userChipText,
                    !form.assignedTo && styles.userChipTextSelected,
                  ]}>
                    Unassigned
                  </Text>
                </TouchableOpacity>
                {users.map((u) => (
                  <TouchableOpacity
                    key={u.$id}
                    style={[
                      styles.userChip,
                      form.assignedTo === u.$id && styles.userChipSelected,
                    ]}
                    onPress={() => setForm({ ...form, assignedTo: u.$id })}
                  >
                    <View style={[styles.userChipAvatar, { backgroundColor: u.color || "#10B981" }]}>
                      <Text style={styles.userChipAvatarText}>{u.username?.[0]?.toUpperCase()}</Text>
                    </View>
                    <Text style={[
                      styles.userChipText,
                      form.assignedTo === u.$id && styles.userChipTextSelected,
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
  // Quick Add Styles
  quickAddContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  quickAddInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  quickAddIcon: {
    marginRight: 8,
  },
  quickAddInput: {
    flex: 1,
    height: 48,
    color: "#FFFFFF",
    fontSize: 16,
  },
  quickAddButton: {
    padding: 4,
  },
  categoryChipsScroll: {
    marginTop: 10,
  },
  categoryChipsContainer: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#1A1A1F",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 4,
  },
  categoryChipActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  categoryChipText: {
    fontSize: 12,
    color: "#71717A",
    fontWeight: "500",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 12, // Add space between rows
  },
  itemCard: {
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemBody: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    minHeight: 40,
  },
  itemNameCompleted: {
    textDecorationLine: "line-through",
    color: "#71717A",
  },
  itemDetails: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: "500",
  },
  quantityText: {
    fontSize: 11,
    color: "#A1A1AA",
  },
  quantityStepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111114",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  stepperButton: {
    padding: 8,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    minWidth: 24,
    textAlign: "center",
  },
  deleteButton: {
    padding: 8,
  },
  categoryTabs: {
    marginTop: 12,
    paddingHorizontal: 12,
  },
  tabsContainer: {
    paddingRight: 20,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: "#1A1A1F",
  },
  categoryTabText: {
    color: "#FFFFFF",
    fontWeight: "500",
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
  itemCardTapped: {
    backgroundColor: "#222228",
  },
  completePromptOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    borderRadius: 8,
  },
  completePromptText: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
    textShadowColor: "rgba(255, 255, 255, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  completePromptSubtext: {
    fontSize: 12,
    color: "#444",
    fontWeight: "500",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(10, 10, 12, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    zIndex: 10,
  },
  completedLabel: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  completedLabelText: {
    fontSize: 10,
    color: "#10B981",
    fontWeight: "500",
  },
  itemCardCompleted: {
    opacity: 0.7,
    backgroundColor: "#111114",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonsContainer: {
    position: "absolute",
    top: 4,
    right: 4,
    flexDirection: "row",
    zIndex: 4,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
});

export default ShoppingScreen;
