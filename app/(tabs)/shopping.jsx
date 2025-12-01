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
  Image,
  Platform,
  ScrollView,
  Dimensions,
  Easing,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { LinearGradient } from "expo-linear-gradient";
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
import EmptyState from "../../components/EmptyState";

const ShoppingScreen = () => {
  const { user, household } = useGlobalContext();
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    name: "",
    quantity: "1",
    category: ShoppingCategories.GROCERIES,
    assignedTo: "",
  });

  // For animations
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.95);

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
  }, [household?.$id]);

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

  // Create data with an "add item" card at the end
  const listData = [...filteredItems, { isAddItemCard: true }];

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

  // Render the items in a 2-column grid
  const renderItem = ({ item, index }) => {
    // If this is the "add item" card
    if (item.isAddItemCard) {
      return (
        <TouchableOpacity
          style={[styles.itemCard, styles.addItemCard, { width: itemWidth }]}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.addItemContent}>
            <MaterialCommunityIcons
              name="plus-circle-outline"
              size={32}
              color="#4F86C6"
            />
            <Text style={styles.addItemText}>Add Item</Text>
          </View>
        </TouchableOpacity>
      );
    }

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

            <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: "#4F86C6" }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: "#FFFFFF" }]}>
            Shopping List
          </Text>
        </View>

        {renderCategoryTabs()}

        <View style={styles.showCompletedToggle}>
          <BouncyCheckbox
            size={24}
            fillColor="#FFFFFF"
            unfillColor="#3A6EA5"
            text="Show completed items"
            textStyle={{ color: "#FFFFFF", textDecorationLine: "none" }}
            isChecked={showCompleted}
            onPress={() => setShowCompleted(!showCompleted)}
          />
        </View>
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
        />
      </Animated.View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setEditingItem(null); // Clear editing state when modal closes
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Item Name:</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
                placeholder="Enter item name"
                placeholderTextColor="#AAA"
              />

              <Text style={styles.inputLabel}>Quantity:</Text>
              <TextInput
                style={styles.input}
                value={form.quantity}
                onChangeText={(text) => setForm({ ...form, quantity: text })}
                keyboardType="numeric"
                placeholder="Enter quantity"
                placeholderTextColor="#AAA"
              />

              <Text style={styles.inputLabel}>Category:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.category}
                  style={styles.picker}
                  onValueChange={(value) =>
                    setForm({ ...form, category: value })
                  }
                  dropdownIconColor="#4F86C6"
                >
                  {Object.values(ShoppingCategories).map((category) => (
                    <Picker.Item
                      key={category}
                      label={
                        category.charAt(0).toUpperCase() + category.slice(1)
                      }
                      value={category}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Assign To:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.assignedTo}
                  style={styles.picker}
                  onValueChange={(value) =>
                    setForm({ ...form, assignedTo: value })
                  }
                  dropdownIconColor="#4F86C6"
                >
                  <Picker.Item label="Unassigned" value="" />
                  {users.map((user) => (
                    <Picker.Item
                      key={user.$id}
                      label={user.username}
                      value={user.$id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingItem(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSubmitForm}
              >
                <View style={styles.saveButtonContent}>
                  <Text style={styles.saveButtonText}>{submitButtonText}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  header: {
    paddingTop: Platform.OS === "android" ? 40 : 0,
    paddingBottom: 12,
    backgroundColor: "#4F86C6",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
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
    padding: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 12, // Add space between rows
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 8,
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
    color: "#212121",
    marginBottom: 8,
    minHeight: 40, // Ensure consistent height for names
  },
  itemNameCompleted: {
    textDecorationLine: "line-through",
    color: "#9E9E9E",
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
    color: "#666666",
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
    backgroundColor: "#FFFFFF",
  },
  categoryTabText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  activeCategoryText: {
    color: "#4F86C6",
  },
  showCompletedToggle: {
    marginTop: 12,
    paddingHorizontal: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#4F86C6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    color: "#424242",
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 12,
    marginBottom: 16,
    color: "#212121",
  },
  pickerContainer: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 16,
    overflow: "hidden",
  },
  picker: {
    color: "#212121",
  },
  modalButtons: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  modalButton: {
    flex: 1,
    padding: 16,
  },
  cancelButton: {
    borderRightWidth: 1,
    borderRightColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#757575",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    overflow: "hidden",
  },
  saveButtonContent: {
    backgroundColor: "#4F86C6",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  addItemCard: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#4F86C6",
    backgroundColor: "rgba(79, 134, 198, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  addItemContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  addItemText: {
    color: "#4F86C6",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  itemCardTapped: {
    backgroundColor: "#F5F9FF",
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
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    zIndex: 10,
  },
  completedLabel: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  completedLabelText: {
    fontSize: 10,
    color: "#4CAF50",
    fontWeight: "500",
  },
  itemCardCompleted: {
    opacity: 0.8,
    backgroundColor: "#F9F9F9",
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
