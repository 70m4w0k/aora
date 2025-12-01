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
  ScrollView,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { useGlobalContext } from "../../context/GlobalProvider";
import {
  getHouseholdExpenses,
  createExpense,
  createSettlement,
  getUserSettlements,
  getHouseholdMembers,
  getExpenseImageUrl,
} from "../../lib/appwrite";
import EmptyState from "../../components/EmptyState";

const ExpensesScreen = () => {
  const { user, household } = useGlobalContext();
  const [activeTab, setActiveTab] = useState("expenses"); // expenses or settlements
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [users, setUsers] = useState([]);
  const [balances, setBalances] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [settlementModalVisible, setSettlementModalVisible] = useState(false);

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    paidBy: "",
    splitBetween: [],
    category: "general",
    notes: "",
    image: null,
  });

  // Image preview state
  const [imagePreview, setImagePreview] = useState(null);

  const [settlementForm, setSettlementForm] = useState({
    amount: "",
    paidBy: "",
    paidTo: "",
    notes: "",
  });

  // For filtering
  const [currentUserFilter, setCurrentUserFilter] = useState(true); // Show only current user's expenses

  useEffect(() => {
    if (household?.$id) {
      fetchData();
    }
  }, [household?.$id]);

  const fetchData = async () => {
    if (!household?.$id) return;
    try {
      console.log("Fetching all data...");
      // Fetch users first to ensure we have them before processing expenses
      const fetchedUsers = await fetchUsers();
      if (fetchedUsers && fetchedUsers.length > 0) {
        // Then fetch expenses and settlements sequentially
        await fetchExpenses();
        await fetchSettlements();
        // Force recalculation of balances
        calculateBalances();
      } else {
        console.log("No users found, cannot fetch expenses");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert(
        "Error",
        "Failed to load expenses data. Pull down to refresh and try again."
      );
    }
  };

  const fetchUsers = async () => {
    if (!household?.$id) return [];
    try {
      const members = await getHouseholdMembers(household.$id);
      setUsers(members || []);
      // Default paidBy to current user
      if (user) {
        setExpenseForm((prev) => ({ ...prev, paidBy: user.$id }));
      }
      return members;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };

  const fetchExpenses = async () => {
    if (!household?.$id) return [];
    try {
      const householdExpenses = await getHouseholdExpenses(household.$id);
      console.log("householdExpenses", householdExpenses);
      setExpenses(householdExpenses || []);
      return householdExpenses;
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return [];
    }
  };

  const fetchSettlements = async () => {
    try {
      if (user) {
        const userSettlements = await getUserSettlements(user.$id);
        setSettlements(userSettlements || []);
        return userSettlements;
      }
    } catch (error) {
      console.error("Error fetching settlements:", error);
      return [];
    }
  };

  useEffect(() => {
    if (users.length > 0) {
      calculateBalances();
    }
  }, [expenses, settlements, users]);

  const calculateBalances = () => {
    try {
      console.log(
        "Calculating balances with users:",
        users.length,
        "expenses:",
        expenses.length,
        "settlements:",
        settlements.length
      );

      const newBalances = {};

      // Initialize balances for all users
      users.forEach((u) => {
        newBalances[u.$id] = {
          userId: u.$id,
          username: u.username,
          balance: 0,
          color: u.color,
        };
      });

      // Process expenses
      if (expenses && expenses.length > 0) {
        expenses.forEach((expense) => {
          if (!expense.amount) {
            console.log("Invalid expense amount:", expense);
            return;
          }

          const amount = parseFloat(expense.amount);

          // Handle different ways paidBy might be structured
          let paidById;
          if (expense.paidBy) {
            paidById =
              typeof expense.paidBy === "object"
                ? expense.paidBy.$id
                : expense.paidBy;
          } else {
            console.log("Invalid paidBy:", expense);
            return;
          }

          // Handle different ways splitBetween might be structured
          let splitBetween = [];
          if (expense.splitBetween) {
            splitBetween = Array.isArray(expense.splitBetween)
              ? expense.splitBetween
              : [expense.splitBetween];
          }

          const splitCount = splitBetween.length;
          if (splitCount === 0) return; // Skip if no split

          const amountPerPerson = amount / splitCount;

          // Add amount to the person who paid
          if (newBalances[paidById]) {
            newBalances[paidById].balance += amount;
          }

          // Subtract from each person who owes
          splitBetween.forEach((personId) => {
            const id = typeof personId === "object" ? personId.$id : personId;
            if (newBalances[id]) {
              newBalances[id].balance -= amountPerPerson;
            }
          });
        });
      }

      // Process settlements
      if (settlements && settlements.length > 0) {
        settlements.forEach((settlement) => {
          if (!settlement.amount) {
            console.log("Invalid settlement amount:", settlement);
            return;
          }

          const amount = parseFloat(settlement.amount);

          // Handle different ways paidBy might be structured
          let paidById;
          if (settlement.paidBy) {
            paidById =
              typeof settlement.paidBy === "object"
                ? settlement.paidBy.$id
                : settlement.paidBy;
          } else {
            console.log("Invalid paidBy in settlement:", settlement);
            return;
          }

          // Handle different ways paidTo might be structured
          let paidToId;
          if (settlement.paidTo) {
            paidToId =
              typeof settlement.paidTo === "object"
                ? settlement.paidTo.$id
                : settlement.paidTo;
          } else {
            console.log("Invalid paidTo in settlement:", settlement);
            return;
          }

          // The person who paid the settlement decreases their balance
          if (newBalances[paidById]) {
            newBalances[paidById].balance -= amount;
          }

          // The person who received the settlement increases their balance
          if (newBalances[paidToId]) {
            newBalances[paidToId].balance += amount;
          }
        });
      }

      console.log(
        "Balance calculation completed:",
        Object.keys(newBalances).length
      );
      setBalances(newBalances);
    } catch (error) {
      console.error("Error calculating balances:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const toggleFilter = () => {
    setCurrentUserFilter(!currentUserFilter);
    fetchExpenses();
  };

  // Image picker function
  const pickImage = async () => {
    try {
      // Request media library permissions
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Denied",
          "You need to grant permission to access your photos"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];

        // Create the image object in the format expected by appwrite.js
        const imageFile = {
          uri: selectedAsset.uri,
          name: selectedAsset.fileName || "expense_receipt.jpg",
          mimeType: selectedAsset.mimeType || "image/jpeg",
          size: selectedAsset.fileSize || 0,
        };

        setExpenseForm((prev) => ({
          ...prev,
          image: imageFile,
        }));

        setImagePreview(selectedAsset.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const handleAddExpense = async () => {
    if (
      expenseForm.title.trim() === "" ||
      expenseForm.amount.trim() === "" ||
      !expenseForm.paidBy ||
      expenseForm.splitBetween.length === 0
    ) {
      return Alert.alert("Error", "Please fill in all required fields");
    }

    try {
      setExpenseModalVisible(false); // Close modal first to show loading UI

      await createExpense({
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        date: new Date().toISOString(),
        householdId: household.$id,
      });

      setExpenseModalVisible(false);
      setExpenseForm({
        title: "",
        amount: "",
        paidBy: user.$id,
        splitBetween: [],
        category: "general",
        notes: "",
        image: null,
      });
      setImagePreview(null);

      await fetchExpenses();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleAddSettlement = async () => {
    if (
      settlementForm.amount.trim() === "" ||
      !settlementForm.paidBy ||
      !settlementForm.paidTo ||
      settlementForm.paidBy === settlementForm.paidTo
    ) {
      return Alert.alert(
        "Error",
        "Please fill in all fields and ensure payer and recipient are different"
      );
    }

    try {
      await createSettlement({
        ...settlementForm,
        amount: parseFloat(settlementForm.amount),
        date: new Date().toISOString(),
        householdId: household.$id,
      });

      setSettlementModalVisible(false);
      setSettlementForm({
        amount: "",
        paidBy: user.$id,
        paidTo: "",
        notes: "",
      });

      await Promise.all([fetchExpenses(), fetchSettlements()]);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const toggleUserInSplit = (userId) => {
    setExpenseForm((prev) => {
      const splitBetween = [...prev.splitBetween];

      if (splitBetween.includes(userId)) {
        // Remove user if already in split
        return {
          ...prev,
          splitBetween: splitBetween.filter((id) => id !== userId),
        };
      } else {
        // Add user if not in split
        return {
          ...prev,
          splitBetween: [...splitBetween, userId],
        };
      }
    });
  };

  const getUsername = (userId) => {
    if (!userId) return "Unknown";
    const user = users.find((u) => u.$id === userId);
    return user ? user.username : "Unknown";
  };

  const formatCurrency = (amount) => {
    return `€${parseFloat(amount).toFixed(2)}`;
  };

  // For showing expense image in a modal
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Load expense image
  const getExpenseImage = async (imageId) => {
    if (!imageId) return null;
    try {
      const imageUrl = await getExpenseImageUrl(imageId);
      return imageUrl;
    } catch (error) {
      console.error("Error loading expense image:", error);
      return null;
    }
  };

  const renderExpenseItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemAmount}>
          €{parseFloat(item.amount).toFixed(2)}
        </Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemDetail}>
          Paid by:{" "}
          <Text style={styles.highlight}>{getUsername(item.paidBy)}</Text>
        </Text>
        <Text style={styles.itemDetail}>
          Split with:{" "}
          <Text style={styles.highlight}>
            {Array.isArray(item.splitBetween)
              ? item.splitBetween.map(getUsername).join(", ")
              : getUsername(item.splitBetween)}
          </Text>
        </Text>
        {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
        <Text style={styles.itemDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>

        {item.imageId && (
          <TouchableOpacity
            style={styles.receiptThumbnailContainer}
            onPress={() => {
              setSelectedImage(item.imageId);
              setImageModalVisible(true);
            }}
          >
            <Image
              source={{ uri: item.imageId }}
              style={styles.receiptThumbnail}
              resizeMode="cover"
            />
            <Text style={styles.viewReceiptText}>View Receipt</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderSettlementItem = ({ item }) => {
    const paidByName =
      item.paidBy && item.paidBy.username
        ? item.paidBy.username
        : getUsername(item.paidBy);

    const paidToName =
      item.paidTo && item.paidTo.username
        ? item.paidTo.username
        : getUsername(item.paidTo);

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>Settlement</Text>
          <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemDetail}>
            <Text style={styles.highlight}>{paidByName}</Text> paid{" "}
            <Text style={styles.highlight}>{paidToName}</Text>
          </Text>
          {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
          <Text style={styles.itemDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  const renderBalanceItem = ({ item }) => {
    const balance = parseFloat(item.balance);
    const isPositive = balance > 0;
    const isNegative = balance < 0;
    const isZero = balance === 0;

    return (
      <View
        style={[
          styles.balanceItem,
          { borderLeftColor: item.color || "#757575" },
        ]}
      >
        <Text style={styles.balanceUsername}>{item.username}</Text>
        <Text
          style={[
            styles.balanceAmount,
            isPositive && styles.positiveBalance,
            isNegative && styles.negativeBalance,
            isZero && styles.zeroBalance,
          ]}
        >
          {formatCurrency(balance)}
        </Text>
        <Text style={styles.balanceStatus}>
          {isPositive
            ? "is owed money"
            : isNegative
            ? "owes money"
            : "settled up"}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0C" }}>
      <View style={styles.header}>
        <Text style={styles.title}>Expense Sharing</Text>
        <View style={styles.tabButtons}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "expenses" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("expenses")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "expenses" && styles.activeTabButtonText,
              ]}
            >
              Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "balances" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("balances")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "balances" && styles.activeTabButtonText,
              ]}
            >
              Balances
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {activeTab === "expenses" ? (
        <>
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={toggleFilter}
            >
              <Text style={styles.filterButtonText}>
                {currentUserFilter ? "Show All" : "Show Mine"}
              </Text>
            </TouchableOpacity>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.settlementButton]}
                onPress={() => setSettlementModalVisible(true)}
              >
                <Text style={styles.actionButtonText}>Settle Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.expenseButton]}
                onPress={() => setExpenseModalVisible(true)}
              >
                <Text style={styles.actionButtonText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
          <FlatList
            data={expenses}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.$id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                message="No expenses found"
                subMessage="Add your first expense to get started"
              />
            }
            removeClippedSubviews={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        </>
      ) : (
        <View style={styles.balancesContainer}>
          <FlatList
            data={Object.values(balances)}
            renderItem={renderBalanceItem}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </View>
      )}
      {/* Modals */}
      <Modal
        visible={expenseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExpenseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView
              style={{ width: "100%" }}
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Add New Expense</Text>

              <Text style={styles.inputLabel}>Title:</Text>
              <TextInput
                style={styles.input}
                value={expenseForm.title}
                onChangeText={(text) =>
                  setExpenseForm({ ...expenseForm, title: text })
                }
                placeholder="Enter expense title"
                placeholderTextColor="#AAAAAA"
              />

              <Text style={styles.inputLabel}>Amount (€):</Text>
              <TextInput
                style={styles.input}
                value={expenseForm.amount}
                onChangeText={(text) =>
                  setExpenseForm({ ...expenseForm, amount: text })
                }
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#AAAAAA"
              />

              <Text style={styles.inputLabel}>Paid By:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={expenseForm.paidBy}
                  style={styles.picker}
                  onValueChange={(value) =>
                    setExpenseForm({ ...expenseForm, paidBy: value })
                  }
                  dropdownIconColor="#4F86C6"
                  mode="dropdown"
                >
                  {users.map((user) => (
                    <Picker.Item
                      key={user.$id}
                      label={user.username}
                      value={user.$id}
                      color="#333333"
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.splitBetweenHeader}>
                <Text style={styles.inputLabel}>
                  Split Between:{" "}
                  <Text style={styles.optionalText}>
                    (Select who shares this expense)
                  </Text>
                </Text>
                <TouchableOpacity
                  style={styles.selectAllButton}
                  onPress={() => {
                    const allUserIds = users.map((u) => u.$id);
                    setExpenseForm((prev) => ({
                      ...prev,
                      splitBetween:
                        prev.splitBetween.length === users.length
                          ? []
                          : allUserIds,
                    }));
                  }}
                >
                  <Text style={styles.selectAllButtonText}>
                    {expenseForm.splitBetween.length === users.length
                      ? "Deselect All"
                      : "Select All"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.splitUsers}>
                {users.map((user) => (
                  <TouchableOpacity
                    key={user.$id}
                    style={[
                      styles.userChip,
                      expenseForm.splitBetween.includes(user.$id) &&
                        styles.selectedUserChip,
                    ]}
                    onPress={() => toggleUserInSplit(user.$id)}
                  >
                    <Text
                      style={[
                        styles.userChipText,
                        expenseForm.splitBetween.includes(user.$id) &&
                          styles.selectedUserChipText,
                      ]}
                    >
                      {user.username}
                      {expenseForm.paidBy === user.$id && " (Payer)"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Category:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={expenseForm.category}
                  style={styles.picker}
                  onValueChange={(value) =>
                    setExpenseForm({ ...expenseForm, category: value })
                  }
                >
                  <Picker.Item label="General" value="general" />
                  <Picker.Item label="Food" value="food" />
                  <Picker.Item label="Rent" value="rent" />
                  <Picker.Item label="Utilities" value="utilities" />
                  <Picker.Item label="Transportation" value="transportation" />
                  <Picker.Item label="Entertainment" value="entertainment" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Receipt Image:</Text>
              <View style={styles.imageUploadContainer}>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickImage}
                >
                  <Text style={styles.uploadButtonText}>
                    {imagePreview ? "Change Image" : "Attach Receipt"}
                  </Text>
                </TouchableOpacity>

                {imagePreview && (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: imagePreview }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => {
                        setImagePreview(null);
                        setExpenseForm((prev) => ({ ...prev, image: null }));
                      }}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Text style={styles.inputLabel}>Notes:</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={expenseForm.notes}
                onChangeText={(text) =>
                  setExpenseForm({ ...expenseForm, notes: text })
                }
                placeholder="Add optional notes"
                placeholderTextColor="#888"
                multiline
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setExpenseModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleAddExpense}
                >
                  <Text style={styles.modalButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settlement Modal */}
      <Modal
        visible={settlementModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettlementModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settle Up</Text>

            <Text style={styles.inputLabel}>Amount (€):</Text>
            <TextInput
              style={styles.input}
              value={settlementForm.amount}
              onChangeText={(text) =>
                setSettlementForm({ ...settlementForm, amount: text })
              }
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#AAAAAA"
            />

            <Text style={styles.inputLabel}>Paid By:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={settlementForm.paidBy}
                style={styles.picker}
                onValueChange={(value) =>
                  setSettlementForm({ ...settlementForm, paidBy: value })
                }
                dropdownIconColor="#4F86C6"
                mode="dropdown"
              >
                {users.map((user) => (
                  <Picker.Item
                    key={user.$id}
                    label={user.username}
                    value={user.$id}
                    color="#333333"
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Paid To:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={settlementForm.paidTo}
                style={styles.picker}
                onValueChange={(value) =>
                  setSettlementForm({ ...settlementForm, paidTo: value })
                }
                dropdownIconColor="#4F86C6"
                mode="dropdown"
              >
                <Picker.Item label="Select User" value="" color="#999999" />
                {users.map((user) => (
                  <Picker.Item
                    key={user.$id}
                    label={user.username}
                    value={user.$id}
                    color="#333333"
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Notes:</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={settlementForm.notes}
              onChangeText={(text) =>
                setSettlementForm({ ...settlementForm, notes: text })
              }
              placeholder="Add optional notes"
              placeholderTextColor="#AAAAAA"
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setSettlementModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddSettlement}
              >
                <Text style={styles.modalButtonText}>Settle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full-size image modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.fullImageModalContainer}>
          <TouchableOpacity
            style={styles.closeImageButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullSizeImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Receipt thumbnail styles
  receiptThumbnailContainer: {
    marginTop: 8,
    alignItems: "center",
  },
  receiptThumbnail: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 4,
  },
  viewReceiptText: {
    color: "#F43F5E",
    fontSize: 12,
    fontWeight: "500",
  },
  // Full-size image modal styles
  fullImageModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullSizeImage: {
    width: "90%",
    height: "80%",
  },
  closeImageButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  imageUploadContainer: {
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: "#F43F5E",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  uploadButtonText: {
    color: "white",
    fontWeight: "500",
  },
  imagePreviewContainer: {
    position: "relative",
    marginVertical: 8,
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  splitBetweenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectAllButton: {
    backgroundColor: "#222228",
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  selectAllButtonText: {
    fontSize: 12,
    color: "#A1A1AA",
    fontWeight: "500",
  },
  container: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  header: {
    marginTop: 50,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  tabButtons: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1A1A1F",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: "#F43F5E",
  },
  tabButtonText: {
    color: "#71717A",
    fontWeight: "500",
  },
  activeTabButtonText: {
    color: "white",
    fontWeight: "600",
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#111114",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#1A1A1F",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  filterButtonText: {
    color: "#A1A1AA",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  expenseButton: {
    backgroundColor: "#F43F5E",
  },
  settlementButton: {
    backgroundColor: "#8B5CF6",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F43F5E",
  },
  itemDetails: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 8,
  },
  itemDetail: {
    color: "#A1A1AA",
    marginBottom: 4,
  },
  highlight: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  itemNotes: {
    fontStyle: "italic",
    color: "#71717A",
    marginTop: 4,
    marginBottom: 4,
  },
  itemDate: {
    color: "#71717A",
    fontSize: 12,
    marginTop: 4,
  },
  balancesContainer: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  balanceSummary: {
    padding: 16,
    backgroundColor: "#111114",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  balanceSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  balanceSummaryText: {
    color: "#A1A1AA",
    fontSize: 12,
    lineHeight: 18,
  },
  balancesList: {
    padding: 16,
  },
  balanceItem: {
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  balanceUsername: {
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
  },
  balanceAmount: {
    fontWeight: "600",
    color: "#FFFFFF",
    marginHorizontal: 16,
    minWidth: 80,
    textAlign: "right",
  },
  positiveBalance: {
    color: "#22C55E",
  },
  negativeBalance: {
    color: "#EF4444",
  },
  zeroBalance: {
    color: "#71717A",
  },
  balanceStatus: {
    fontSize: 12,
    color: "#71717A",
    fontStyle: "italic",
    width: 80,
  },
  balanceActions: {
    padding: 16,
    flexDirection: "row",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: "#1A1A1F",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    alignSelf: "center",
    maxHeight: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#FFFFFF",
    textAlign: "center",
  },
  inputLabel: {
    color: "#A1A1AA",
    marginBottom: 4,
    fontWeight: "500",
  },
  optionalText: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#71717A",
  },
  input: {
    backgroundColor: "#111114",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 14,
    marginBottom: 16,
    color: "#FFFFFF",
    fontSize: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    backgroundColor: "#111114",
    marginBottom: 16,
  },
  picker: {
    color: "#FFFFFF",
  },
  splitUsers: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  userChip: {
    backgroundColor: "#222228",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  selectedUserChip: {
    backgroundColor: "#F43F5E",
    borderColor: "#F43F5E",
  },
  userChipText: {
    color: "#A1A1AA",
  },
  selectedUserChipText: {
    color: "white",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#222228",
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: "#F43F5E",
    marginLeft: 8,
  },
  modalButtonText: {
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default ExpensesScreen;
