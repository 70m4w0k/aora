import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { useGlobalContext } from "../../context/GlobalProvider";
import {
  ShoppingCategories,
  getAllShoppingItems,
  createShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  getAllUsers,
} from "../../lib/appwrite";
import EmptyState from "../../components/EmptyState";

const ShoppingScreen = () => {
  const { user } = useGlobalContext();
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

  // For filtering
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCompleted, setShowCompleted] = useState(true);

  useEffect(() => {
    fetchItems();
    fetchUsers();
  }, []);

  const fetchItems = async () => {
    try {
      const shoppingItems = await getAllShoppingItems();
      setItems(shoppingItems || []);
    } catch (error) {
      console.error("Error fetching shopping items:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const handleAddItem = async () => {
    if (form.name.trim() === "") {
      return Alert.alert("Error", "Please provide an item name");
    }

    try {
      await createShoppingItem({
        ...form,
        userId: user.$id,
      });
      await fetchItems();
      setModalVisible(false);
      setForm({
        name: "",
        quantity: "1",
        category: ShoppingCategories.GROCERIES,
        assignedTo: "",
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const toggleItemComplete = async (item) => {
    try {
      await updateShoppingItem(item.$id, { completed: !item.completed });
      await fetchItems();
    } catch (error) {
      console.error("Error updating item:", error);
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
        { text: "Delete", onPress: () => handleDeleteItem(item.$id), style: "destructive" },
      ]
    );
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case ShoppingCategories.GROCERIES:
        return "#4CAF50"; // Green
      case ShoppingCategories.HOUSEHOLD:
        return "#2196F3"; // Blue
      case ShoppingCategories.PERSONAL:
        return "#9C27B0"; // Purple
      case ShoppingCategories.OTHER:
        return "#FF9800"; // Orange
      default:
        return "#757575"; // Grey
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
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    
    return true;
  });

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <View 
          style={[
            styles.categoryIndicator, 
            { backgroundColor: getCategoryColor(item.category) }
          ]} 
        />
        <Text style={styles.categoryText}>
          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
        </Text>
      </View>
      <View style={styles.itemContent}>
        <BouncyCheckbox
          size={25}
          fillColor="#8e9aaf"
          unfillColor="#FFFFFF"
          isChecked={item.completed}
          text={item.name}
          onPress={() => toggleItemComplete(item)}
          textStyle={{
            textDecorationLine: item.completed ? "line-through" : "none",
            color: item.completed ? "#757575" : "#000000",
            fontSize: 16,
            fontWeight: "bold",
          }}
        />
        <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
      </View>
      <View style={styles.itemFooter}>
        <Text style={styles.assignedText}>
          Assigned to: {getAssignedUserName(item.assignedTo)}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDelete(item)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping List</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Category:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={categoryFilter}
              style={styles.filterPicker}
              onValueChange={(value) => setCategoryFilter(value)}
            >
              <Picker.Item label="All" value="all" />
              <Picker.Item label="Groceries" value={ShoppingCategories.GROCERIES} />
              <Picker.Item label="Household" value={ShoppingCategories.HOUSEHOLD} />
              <Picker.Item label="Personal" value={ShoppingCategories.PERSONAL} />
              <Picker.Item label="Other" value={ShoppingCategories.OTHER} />
            </Picker>
          </View>
        </View>
        
        <View style={styles.checkboxFilter}>
          <BouncyCheckbox
            size={20}
            fillColor="#8e9aaf"
            unfillColor="#FFFFFF"
            isChecked={showCompleted}
            text="Show completed"
            onPress={() => setShowCompleted(!showCompleted)}
            textStyle={{ fontSize: 14 }}
          />
        </View>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="No Shopping Items"
            subtitle="Add some items to your shopping list"
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onPress={onRefresh} />
        }
      />

      {/* Add Item Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Shopping Item</Text>
            
            <Text style={styles.inputLabel}>Item Name:</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              placeholder="Enter item name"
            />
            
            <Text style={styles.inputLabel}>Quantity:</Text>
            <TextInput
              style={styles.input}
              value={form.quantity}
              onChangeText={(text) => setForm({ ...form, quantity: text })}
              keyboardType="numeric"
              placeholder="Enter quantity"
            />
            
            <Text style={styles.inputLabel}>Category:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.category}
                style={styles.picker}
                onValueChange={(value) => setForm({ ...form, category: value })}
              >
                <Picker.Item label="Groceries" value={ShoppingCategories.GROCERIES} />
                <Picker.Item label="Household" value={ShoppingCategories.HOUSEHOLD} />
                <Picker.Item label="Personal" value={ShoppingCategories.PERSONAL} />
                <Picker.Item label="Other" value={ShoppingCategories.OTHER} />
              </Picker>
            </View>
            
            <Text style={styles.inputLabel}>Assign To:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.assignedTo}
                style={styles.picker}
                onValueChange={(value) => setForm({ ...form, assignedTo: value })}
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
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddItem}
              >
                <Text style={styles.modalButtonText}>Add</Text>
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    marginTop: 50,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
  },
  addButton: {
    backgroundColor: "#4F86C6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
  filters: {
    padding: 16,
    backgroundColor: "#F9F9F9",
    flexDirection: "column",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  filterGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  filterLabel: {
    color: "#666666",
    marginRight: 8,
    width: 70,
    fontWeight: "500",
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    height: 40,
    justifyContent: "center",
    overflow: "hidden",
  },
  filterPicker: {
    color: "#333333",
    width: "100%",
  },
  checkboxFilter: {
    flexDirection: "row",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    color: "#666666",
    fontSize: 12,
    fontWeight: "500",
  },
  itemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  quantityText: {
    color: "#333333",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: "500",
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  assignedText: {
    color: "#666666",
    fontSize: 13,
  },
  deleteButton: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  deleteButtonText: {
    color: "#F44336",
    fontSize: 12,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    color: "#333333",
    textAlign: "center",
  },
  inputLabel: {
    color: "#666666",
    marginBottom: 4,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 12,
    marginBottom: 16,
    color: "#333333",
  },
  picker: {
    color: "#333333",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F0F0F0",
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: "#4F86C6",
    marginLeft: 8,
  },
  modalButtonText: {
    fontWeight: "600",
    color: "#333333",
  },
});

export default ShoppingScreen;
