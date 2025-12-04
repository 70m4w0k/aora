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
  ScrollView,
  Image,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useGlobalContext } from "../../context/GlobalProvider";
import { useTranslation } from "../../hooks/useTranslation";
import {
  getHouseholdExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  createSettlement,
  getHouseholdSettlements,
  deleteSettlement,
  getHouseholdMembers,
} from "../../lib/appwrite";

const { width: screenWidth } = Dimensions.get("window");

const ExpensesScreen = () => {
  const { user, household } = useGlobalContext();
  const t = useTranslation();
  
  // Expense Categories with icons and colors
  const EXPENSE_CATEGORIES = {
    food: { icon: "restaurant", label: t("expenses.food"), color: "#F97316" },
    groceries: { icon: "cart", label: t("expenses.groceries"), color: "#22C55E" },
    rent: { icon: "home", label: t("expenses.rent"), color: "#8B5CF6" },
    utilities: { icon: "flash", label: t("expenses.utilities"), color: "#EAB308" },
    transport: { icon: "car", label: t("expenses.transport"), color: "#06B6D4" },
    entertainment: { icon: "game-controller", label: t("expenses.entertainment"), color: "#EC4899" },
    shopping: { icon: "bag", label: t("expenses.shopping"), color: "#F43F5E" },
    health: { icon: "medkit", label: t("expenses.health"), color: "#14B8A6" },
    other: { icon: "ellipsis-horizontal", label: t("expenses.other"), color: "#71717A" },
  };
  const [activeTab, setActiveTab] = useState("expenses");
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [users, setUsers] = useState([]);
  const [balances, setBalances] = useState({});
  const [debts, setDebts] = useState([]); // Who owes whom
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [settlementModalVisible, setSettlementModalVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    paidBy: "",
    splitBetween: [],
    category: "other",
    notes: "",
    image: null,
  });

  const [settlementForm, setSettlementForm] = useState({
    amount: "",
    notes: "",
  });

  const [imagePreview, setImagePreview] = useState(null);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (household?.$id) {
      fetchData();
    }
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [household?.$id]);

  const fetchData = async () => {
    if (!household?.$id) return;
    setLoading(true);
    try {
      const members = await getHouseholdMembers(household.$id);
      setUsers(members || []);
      
      if (user) {
        setExpenseForm((prev) => ({ ...prev, paidBy: user.$id }));
      }

      const [householdExpenses, householdSettlements] = await Promise.all([
        getHouseholdExpenses(household.$id),
        getHouseholdSettlements(household.$id),
      ]);
      setExpenses(householdExpenses || []);
      setSettlements(householdSettlements || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate balances and debts
  useEffect(() => {
    if (users.length > 0) {
      calculateBalancesAndDebts();
    }
  }, [expenses, settlements, users]);

  const calculateBalancesAndDebts = () => {
    const newBalances = {};
    
    // Initialize balances
    users.forEach((u) => {
      newBalances[u.$id] = {
        $id: u.$id,
        oderId: u.$id, // Keep for backward compatibility
        username: u.username,
        avatar: u.avatar,
        color: u.color,
        balance: 0,
      };
    });

    // Process expenses
    expenses.forEach((expense) => {
      if (!expense.amount) return;
      
      const amount = parseFloat(expense.amount);
      const paidById = typeof expense.paidBy === "object" ? expense.paidBy.$id : expense.paidBy;
      
      let splitBetween = Array.isArray(expense.splitBetween) 
        ? expense.splitBetween 
        : [expense.splitBetween];
      
      const splitCount = splitBetween.length;
      if (splitCount === 0) return;
      
      const amountPerPerson = amount / splitCount;

      if (newBalances[paidById]) {
        newBalances[paidById].balance += amount;
      }

      splitBetween.forEach((personId) => {
        const id = typeof personId === "object" ? personId.$id : personId;
        if (newBalances[id]) {
          newBalances[id].balance -= amountPerPerson;
        }
      });
    });

    // Process settlements
    // When paidBy pays paidTo:
    // - paidBy was in debt (negative balance), paying makes it go UP towards 0
    // - paidTo was owed money (positive balance), receiving makes it go DOWN towards 0
    settlements.forEach((settlement) => {
      if (!settlement.amount) return;
      
      const amount = parseFloat(settlement.amount);
      const paidById = typeof settlement.paidBy === "object" ? settlement.paidBy.$id : settlement.paidBy;
      const paidToId = typeof settlement.paidTo === "object" ? settlement.paidTo.$id : settlement.paidTo;

      if (newBalances[paidById]) {
        newBalances[paidById].balance += amount; // Debtor pays, balance goes up
      }
      if (newBalances[paidToId]) {
        newBalances[paidToId].balance -= amount; // Creditor receives, balance goes down
      }
    });

    setBalances(newBalances);

    // Calculate who owes whom (simplified debt resolution)
    const debtList = [];
    const balancesCopy = { ...newBalances };
    
    // Get creditors (positive balance) and debtors (negative balance)
    const creditors = Object.values(balancesCopy).filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
    const debtors = Object.values(balancesCopy).filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);

    // Match debtors with creditors
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const debtAmount = Math.min(Math.abs(debtor.balance), creditor.balance);
      
      if (debtAmount > 0.01) {
        debtList.push({
          from: debtor,
          to: creditor,
          amount: debtAmount,
        });
      }

      debtor.balance += debtAmount;
      creditor.balance -= debtAmount;

      if (Math.abs(debtor.balance) < 0.01) i++;
      if (creditor.balance < 0.01) j++;
    }

    setDebts(debtList);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      title: "",
      amount: "",
      paidBy: user?.$id || "",
      splitBetween: [],
      category: "other",
      notes: "",
      image: null,
    });
    setImagePreview(null);
    setEditingExpense(null);
  };

  const openAddExpense = () => {
    resetExpenseForm();
    // Pre-select all users for split
    setExpenseForm(prev => ({
      ...prev,
      paidBy: user?.$id || "",
      splitBetween: users.map(u => u.$id),
    }));
    setExpenseModalVisible(true);
  };

  const openEditExpense = (expense) => {
    // Extract paidBy ID
    const paidById = typeof expense.paidBy === "object" ? expense.paidBy.$id : expense.paidBy;
    
    // Extract splitBetween IDs
    const splitIds = Array.isArray(expense.splitBetween) 
      ? expense.splitBetween.map(s => typeof s === "object" ? s.$id : s)
      : [];
    
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title || "",
      amount: expense.amount?.toString() || "",
      paidBy: paidById,
      splitBetween: splitIds,
      category: expense.category || "other",
      notes: expense.notes || "",
      image: null,
    });
    setImagePreview(null);
    setExpenseModalVisible(true);
  };

  const handleDeleteExpense = async (expense) => {
    Alert.alert(
      t("expenses.deleteExpense"),
      t("expenses.deleteConfirm").replace("{{title}}", expense.title),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExpense(expense.$id);
              await fetchData();
              Alert.alert(t("common.success"), t("expenses.expenseDeleted"));
            } catch (error) {
              Alert.alert(t("common.error"), error.message);
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(t("common.permissionDenied"), t("common.cameraRollPermissionRequired"));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setExpenseForm(prev => ({
          ...prev,
          image: {
            uri: asset.uri,
            name: asset.fileName || "receipt.jpg",
            mimeType: asset.mimeType || "image/jpeg",
            size: asset.fileSize || 0,
          },
        }));
        setImagePreview(asset.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("common.permissionNeeded"), t("common.cameraPermissionRequired"));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setExpenseForm(prev => ({
          ...prev,
          image: {
            uri: asset.uri,
            name: `receipt_${Date.now()}.jpg`,
            mimeType: "image/jpeg",
            size: asset.fileSize || 0,
          },
        }));
        setImagePreview(asset.uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.title.trim() || !expenseForm.amount.trim() || 
        !expenseForm.paidBy || expenseForm.splitBetween.length === 0) {
      return Alert.alert(t("common.error"), t("expenses.fillAllFields"));
    }

    try {
      if (editingExpense) {
        // Update existing expense
        await updateExpense(editingExpense.$id, {
          title: expenseForm.title,
          amount: parseFloat(expenseForm.amount),
          paidBy: expenseForm.paidBy,
          splitBetween: expenseForm.splitBetween,
          category: expenseForm.category,
          notes: expenseForm.notes,
        });
        Alert.alert(t("common.success"), t("expenses.expenseUpdated"));
      } else {
        // Create new expense
        await createExpense({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount),
          date: new Date().toISOString(),
          householdId: household.$id,
        });
        Alert.alert(t("common.success"), t("expenses.expenseAdded"));
      }

      setExpenseModalVisible(false);
      resetExpenseForm();
      await fetchData();
    } catch (error) {
      Alert.alert(t("common.error"), error.message);
    }
  };

  // Open settlement modal
  const openSettlementModal = (debt) => {
    setSelectedDebt(debt);
    setSettlementForm({
      amount: debt.amount.toFixed(2),
      notes: "",
    });
    setSettlementModalVisible(true);
  };

  // Handle settlement submission
  const handleSettleDebt = async () => {
    if (!selectedDebt) return;
    
    const amount = parseFloat(settlementForm.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t("common.error"), t("expenses.enterValidAmount"));
      return;
    }

    if (amount > selectedDebt.amount + 0.01) {
      Alert.alert(t("common.error"), t("expenses.amountExceedsDebt"));
      return;
    }

    try {
      await createSettlement({
        amount: amount,
        paidBy: selectedDebt.from.oderId,
        paidTo: selectedDebt.to.oderId,
        date: new Date().toISOString(),
        householdId: household.$id,
        notes: settlementForm.notes || t("expenses.settled"),
      });

      setSettlementModalVisible(false);
      setSelectedDebt(null);
      setSettlementForm({ amount: "", notes: "" });
      await fetchData();
      Alert.alert(t("common.success"), t("expenses.settlementRecorded"));
    } catch (error) {
      Alert.alert(t("common.error"), error.message);
    }
  };

  // Delete a settlement
  const handleDeleteSettlement = (settlement) => {
    const paidByName = getUserName(settlement.paidBy);
    const paidToName = getUserName(settlement.paidTo);
    
    Alert.alert(
      t("expenses.deleteSettlement"),
      t("expenses.deleteSettlementConfirm").replace("{{amount}}", parseFloat(settlement.amount).toFixed(2)).replace("{{from}}", paidByName).replace("{{to}}", paidToName),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSettlement(settlement.$id);
              await fetchData();
              Alert.alert(t("common.success"), t("expenses.settlementDeleted"));
            } catch (error) {
              Alert.alert(t("common.error"), t("expenses.failedToDeleteSettlement"));
            }
          },
        },
      ]
    );
  };

  // Helper to get user name from ID
  const getUserName = (userId) => {
    const id = typeof userId === "object" ? userId.$id : userId;
    const user = users.find(u => u.$id === id);
    return user?.username || "Unknown";
  };

  // Get user color
  const getUserColor = (userId) => {
    const id = typeof userId === "object" ? userId.$id : userId;
    const user = users.find(u => u.$id === id);
    return user?.color || "#71717A";
  };

  const toggleUserInSplit = (userId) => {
    setExpenseForm(prev => {
      const splitBetween = [...prev.splitBetween];
      const index = splitBetween.indexOf(userId);
      
      if (index > -1) {
        splitBetween.splice(index, 1);
      } else {
        splitBetween.push(userId);
      }
      
      return { ...prev, splitBetween };
    });
  };

  const getUsername = (userRef) => {
    if (!userRef) return "Unknown";
    
    // If it's an object with username, return it directly
    if (typeof userRef === "object" && userRef.username) {
      return userRef.username;
    }
    
    // If it's an object with $id, extract the ID
    const userId = typeof userRef === "object" ? userRef.$id : userRef;
    
    // Find in users list
    const u = users.find((u) => u.$id === userId);
    return u ? u.username : "Unknown";
  };

  const formatCurrency = (amount) => {
    const parsed = parseFloat(amount);
    return `€${isNaN(parsed) ? "0.00" : parsed.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Render expense card (Tricount style)
  const renderExpenseCard = ({ item }) => {
    const category = EXPENSE_CATEGORIES[item.category] || EXPENSE_CATEGORIES.other;
    const paidByName = getUsername(item.paidBy);
    const splitCount = Array.isArray(item.splitBetween) && item.splitBetween.length > 0 
      ? item.splitBetween.length 
      : 1;
    const perPerson = parseFloat(item.amount || 0) / splitCount;

    return (
      <TouchableOpacity 
        style={styles.expenseCard} 
        activeOpacity={0.7}
        onPress={() => openEditExpense(item)}
      >
        {/* Category icon */}
        <View style={[styles.categoryIcon, { backgroundColor: category.color + "20" }]}>
          <Ionicons name={category.icon} size={20} color={category.color} />
        </View>

        {/* Content */}
        <View style={styles.expenseContent}>
          <Text style={styles.expenseTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.expenseSubtitle}>
            <Text style={styles.expensePayer}>{paidByName}</Text> {t("expenses.paid")} • {formatDate(item.date)}
          </Text>
        </View>

        {/* Amount and Actions */}
        <View style={styles.expenseRightSection}>
          <View style={styles.expenseAmountContainer}>
            <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
            <Text style={styles.expensePerPerson}>{formatCurrency(perPerson)}/{t("expenses.perPerson")}</Text>
          </View>
          
          {/* Delete button */}
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteExpense(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render balance/debt card
  const renderDebtCard = ({ item }) => {
    const isDebtor = item.from.$id === user?.$id;
    const isCreditor = item.to.$id === user?.$id;
    const canSettle = isDebtor || isCreditor;
    
    return (
      <View style={styles.debtCard}>
        <View style={styles.debtInfo}>
          <View style={styles.debtAvatars}>
            <View style={[styles.debtAvatar, { backgroundColor: item.from.color || "#F43F5E" }]}>
              <Text style={styles.debtAvatarText}>{item.from.username?.[0]?.toUpperCase()}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#71717A" style={{ marginHorizontal: 8 }} />
            <View style={[styles.debtAvatar, { backgroundColor: item.to.color || "#22C55E" }]}>
              <Text style={styles.debtAvatarText}>{item.to.username?.[0]?.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.debtText}>
            <Text style={styles.debtDescription}>
              <Text style={styles.debtName}>{item.from.username}</Text>
              {` ${t("expenses.owes")} `}
              <Text style={styles.debtName}>{item.to.username}</Text>
            </Text>
            <Text style={styles.debtAmount}>{formatCurrency(item.amount)}</Text>
          </View>
        </View>
        
        {canSettle && (
          <TouchableOpacity 
            style={styles.settleButton}
            onPress={() => openSettlementModal(item)}
          >
            <Text style={styles.settleButtonText}>{isDebtor ? t("expenses.pay") : t("expenses.received")}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render settlement history card
  const renderSettlementCard = ({ item }) => {
    const paidByName = getUserName(item.paidBy);
    const paidToName = getUserName(item.paidTo);
    const paidById = typeof item.paidBy === "object" ? item.paidBy.$id : item.paidBy;
    const isCurrentUserPayer = paidById === user?.$id;

    return (
      <View style={styles.settlementCard}>
        <View style={styles.settlementIcon}>
          <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
        </View>
        <View style={styles.settlementInfo}>
            <Text style={styles.settlementText}>
              <Text style={[styles.settlementName, { color: getUserColor(item.paidBy) }]}>
                {paidByName}
              </Text>
              {` ${t("expenses.paid")} `}
              <Text style={[styles.settlementName, { color: getUserColor(item.paidTo) }]}>
                {paidToName}
              </Text>
          </Text>
          <Text style={styles.settlementDate}>
            {new Date(item.date).toLocaleDateString()} • {item.notes || "Settlement"}
          </Text>
        </View>
        <View style={styles.settlementRight}>
          <Text style={styles.settlementAmount}>{formatCurrency(item.amount)}</Text>
          {isCurrentUserPayer && (
            <TouchableOpacity 
              style={styles.settlementDeleteBtn}
              onPress={() => handleDeleteSettlement(item)}
            >
              <Ionicons name="trash-outline" size={16} color="#F43F5E" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render category selector
  const renderCategorySelector = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryScroll}
      contentContainerStyle={styles.categoryScrollContent}
    >
      {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.categoryChip,
            expenseForm.category === key && { backgroundColor: cat.color, borderColor: cat.color },
          ]}
          onPress={() => setExpenseForm(prev => ({ ...prev, category: key }))}
        >
          <Ionicons 
            name={cat.icon} 
            size={16} 
            color={expenseForm.category === key ? "#FFF" : "#71717A"} 
          />
          <Text style={[
            styles.categoryChipText,
            expenseForm.category === key && { color: "#FFF" },
          ]}>
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Summary banner
  const renderSummaryBanner = () => {
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const myBalance = balances[user?.$id]?.balance || 0;
    
    return (
      <View style={styles.summaryBanner}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t("expenses.totalExpenses")}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalExpenses)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t("expenses.yourBalance")}</Text>
          <Text style={[
            styles.summaryValue,
            myBalance > 0 && { color: "#22C55E" },
            myBalance < 0 && { color: "#EF4444" },
          ]}>
            {myBalance >= 0 ? "+" : ""}{formatCurrency(myBalance)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t("expenses.title")}</Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "expenses" && styles.tabActive]}
            onPress={() => setActiveTab("expenses")}
          >
            <Ionicons 
              name="receipt" 
              size={18} 
              color={activeTab === "expenses" ? "#F43F5E" : "#71717A"} 
            />
            <Text style={[styles.tabText, activeTab === "expenses" && styles.tabTextActive]}>
              {t("expenses.title")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "balances" && styles.tabActive]}
            onPress={() => setActiveTab("balances")}
          >
            <Ionicons 
              name="swap-horizontal" 
              size={18} 
              color={activeTab === "balances" ? "#F43F5E" : "#71717A"} 
            />
            <Text style={[styles.tabText, activeTab === "balances" && styles.tabTextActive]}>
              {t("expenses.balance")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "history" && styles.tabActive]}
            onPress={() => setActiveTab("history")}
          >
            <Ionicons 
              name="time" 
              size={18} 
              color={activeTab === "history" ? "#F43F5E" : "#71717A"} 
            />
            <Text style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}>
              {t("expenses.settled")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Banner */}
        {renderSummaryBanner()}

        {/* Content */}
        {activeTab === "expenses" && (
          <FlatList
            data={expenses}
            renderItem={renderExpenseCard}
            keyExtractor={(item) => item.$id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F43F5E" />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={64} color="#3F3F46" />
                <Text style={styles.emptyTitle}>{t("expenses.noExpenses")}</Text>
                <Text style={styles.emptySubtitle}>{t("expenses.addFirstExpense")}</Text>
              </View>
            }
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={10}
          />
        )}
        
        {activeTab === "balances" && (
          <FlatList
            data={debts}
            renderItem={renderDebtCard}
            keyExtractor={(item, index) => `debt-${index}`}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F43F5E" />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={64} color="#22C55E" />
                <Text style={styles.emptyTitle}>{t("expenses.allSettled")}</Text>
                <Text style={styles.emptySubtitle}>{t("expenses.noOutstandingBalances")}</Text>
              </View>
            }
            ListHeaderComponent={
              debts.length > 0 ? (
                <Text style={styles.balanceHeader}>{t("expenses.whoOwesWhom")}</Text>
              ) : null
            }
          />
        )}

        {activeTab === "history" && (
          <FlatList
            data={settlements}
            renderItem={renderSettlementCard}
            keyExtractor={(item) => item.$id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F43F5E" />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={64} color="#3F3F46" />
                <Text style={styles.emptyTitle}>{t("expenses.noSettlementsYet")}</Text>
                <Text style={styles.emptySubtitle}>{t("expenses.settlementsWillAppear")}</Text>
              </View>
            }
            ListHeaderComponent={
              settlements.length > 0 ? (
                <View style={styles.settlementsHeader}>
                  <Text style={styles.balanceHeader}>{t("expenses.settlementHistory")}</Text>
                  <Text style={styles.settlementsCount}>{settlements.length} {settlements.length !== 1 ? t("expenses.settlements") : t("expenses.settlement")}</Text>
                </View>
              ) : null
            }
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={10}
          />
        )}

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={openAddExpense}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Add Expense Modal */}
      <Modal
        visible={expenseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExpenseModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setExpenseModalVisible(false); resetExpenseForm(); }}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingExpense ? t("expenses.editExpense") : t("expenses.addExpense")}</Text>
              <TouchableOpacity onPress={handleAddExpense}>
                <Text style={styles.modalSaveText}>{editingExpense ? t("common.save") : t("common.save")}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Amount Input (Large) */}
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>€</Text>
                <TextInput
                  style={styles.amountInput}
                  value={expenseForm.amount}
                  onChangeText={(text) => setExpenseForm(prev => ({ ...prev, amount: text }))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#3F3F46"
                />
              </View>

              {/* Title */}
              <Text style={styles.inputLabel}>{t("expenses.description")}</Text>
              <TextInput
                style={styles.input}
                value={expenseForm.title}
                onChangeText={(text) => setExpenseForm(prev => ({ ...prev, title: text }))}
                placeholder={t("expenses.descriptionPlaceholder")}
                placeholderTextColor="#71717A"
              />

              {/* Category */}
              <Text style={styles.inputLabel}>{t("expenses.category")}</Text>
              {renderCategorySelector()}

              {/* Paid By */}
              <Text style={styles.inputLabel}>{t("expenses.paidBy")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.userChipsScroll}>
                {users.map((u) => (
                  <TouchableOpacity
                    key={u.$id}
                    style={[
                      styles.userChip,
                      expenseForm.paidBy === u.$id && styles.userChipSelected,
                    ]}
                    onPress={() => setExpenseForm(prev => ({ ...prev, paidBy: u.$id }))}
                  >
                    <View style={[styles.userChipAvatar, { backgroundColor: u.color || "#8B5CF6" }]}>
                      <Text style={styles.userChipAvatarText}>{u.username?.[0]?.toUpperCase()}</Text>
                    </View>
                    <Text style={[
                      styles.userChipText,
                      expenseForm.paidBy === u.$id && styles.userChipTextSelected,
                    ]}>
                      {u.username}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Split Between */}
              <View style={styles.splitHeader}>
                <Text style={styles.inputLabel}>{t("expenses.splitBetween")}</Text>
                <TouchableOpacity
                  onPress={() => {
                    const allIds = users.map(u => u.$id);
                    const allSelected = allIds.every(id => expenseForm.splitBetween.includes(id));
                    setExpenseForm(prev => ({
                      ...prev,
                      splitBetween: allSelected ? [] : allIds,
                    }));
                  }}
                >
                  <Text style={styles.selectAllText}>
                    {expenseForm.splitBetween.length === users.length ? t("expenses.clearAll") : t("expenses.selectAll")}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.splitUsersGrid}>
                {users.map((u) => {
                  const isSelected = expenseForm.splitBetween.includes(u.$id);
                  const splitAmount = isSelected && expenseForm.amount && expenseForm.splitBetween.length > 0
                    ? parseFloat(expenseForm.amount) / expenseForm.splitBetween.length 
                    : 0;
                    
                  return (
                    <TouchableOpacity
                      key={u.$id}
                      style={[styles.splitUserCard, isSelected && styles.splitUserCardSelected]}
                      onPress={() => toggleUserInSplit(u.$id)}
                    >
                      <View style={[styles.splitUserAvatar, { backgroundColor: u.color || "#8B5CF6" }]}>
                        <Text style={styles.splitUserAvatarText}>{u.username?.[0]?.toUpperCase()}</Text>
                        {isSelected && (
                          <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={10} color="#FFF" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.splitUserName} numberOfLines={1}>{u.username}</Text>
                      {isSelected && splitAmount > 0 && (
                        <Text style={styles.splitUserAmount}>{formatCurrency(splitAmount)}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Receipt */}
              <Text style={styles.inputLabel}>{t("expenses.receiptOptional")}</Text>
              <View style={styles.receiptRow}>
                <TouchableOpacity style={styles.receiptButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={20} color="#F43F5E" />
                  <Text style={styles.receiptButtonText}>{t("expenses.camera")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.receiptButton} onPress={pickImage}>
                  <Ionicons name="image" size={20} color="#F43F5E" />
                  <Text style={styles.receiptButtonText}>{t("expenses.gallery")}</Text>
                </TouchableOpacity>
              </View>
              {imagePreview && (
                <View style={styles.receiptPreview}>
                  <Image source={{ uri: imagePreview }} style={styles.receiptImage} />
                  <TouchableOpacity
                    style={styles.removeReceiptButton}
                    onPress={() => {
                      setImagePreview(null);
                      setExpenseForm(prev => ({ ...prev, image: null }));
                    }}
                  >
                    <Ionicons name="close" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Notes */}
              <Text style={styles.inputLabel}>{t("expenses.notesOptional")}</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={expenseForm.notes}
                onChangeText={(text) => setExpenseForm(prev => ({ ...prev, notes: text }))}
                placeholder={t("expenses.addNotes")}
                placeholderTextColor="#71717A"
                multiline
              />

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Settlement Modal */}
      <Modal
        visible={settlementModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettlementModalVisible(false)}
      >
        <View style={styles.settlementModalOverlay}>
          <View style={styles.settlementModalContent}>
            <View style={styles.settlementModalHeader}>
              <Text style={styles.settlementModalTitle}>{t("expenses.recordSettlement")}</Text>
              <TouchableOpacity onPress={() => {
                setSettlementModalVisible(false);
                setSelectedDebt(null);
              }}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            {selectedDebt && (
              <>
                {/* Debt Info */}
                <View style={styles.settlementDebtInfo}>
                  <View style={styles.settlementAvatarRow}>
                    <View style={[styles.settlementAvatar, { backgroundColor: selectedDebt.from.color || "#F43F5E" }]}>
                      <Text style={styles.settlementAvatarText}>
                        {selectedDebt.from.username?.[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={20} color="#71717A" style={{ marginHorizontal: 12 }} />
                    <View style={[styles.settlementAvatar, { backgroundColor: selectedDebt.to.color || "#22C55E" }]}>
                      <Text style={styles.settlementAvatarText}>
                        {selectedDebt.to.username?.[0]?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.settlementDebtText}>
                    {selectedDebt.from.username} {t("expenses.pays")} {selectedDebt.to.username}
                  </Text>
                  <Text style={styles.settlementDebtAmount}>
                    {t("expenses.totalOwed")}: {formatCurrency(selectedDebt.amount)}
                  </Text>
                </View>

                {/* Amount Input */}
                <Text style={styles.settlementInputLabel}>{t("expenses.amountToSettle")}</Text>
                <View style={styles.settlementAmountRow}>
                  <Text style={styles.settlementCurrency}>€</Text>
                  <TextInput
                    style={styles.settlementAmountInput}
                    value={settlementForm.amount}
                    onChangeText={(text) => setSettlementForm(prev => ({ ...prev, amount: text }))}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#71717A"
                  />
                  <TouchableOpacity 
                    style={styles.settlementFullBtn}
                    onPress={() => setSettlementForm(prev => ({ ...prev, amount: selectedDebt.amount.toFixed(2) }))}
                  >
                    <Text style={styles.settlementFullBtnText}>{t("expenses.fullAmount")}</Text>
                  </TouchableOpacity>
                </View>

                {/* Notes */}
                <Text style={styles.settlementInputLabel}>{t("expenses.notesOptional")}</Text>
                <TextInput
                  style={styles.settlementNotesInput}
                  value={settlementForm.notes}
                  onChangeText={(text) => setSettlementForm(prev => ({ ...prev, notes: text }))}
                  placeholder={t("expenses.notesPlaceholder")}
                  placeholderTextColor="#71717A"
                />

                {/* Submit Button */}
                <TouchableOpacity style={styles.settlementSubmitBtn} onPress={handleSettleDebt}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.settlementSubmitText}>{t("expenses.confirmSettlement")}</Text>
                </TouchableOpacity>
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
    backgroundColor: "#0A0A0C",
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#111114",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFF",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#111114",
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#1A1A1F",
    gap: 8,
  },
  tabActive: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#71717A",
  },
  tabTextActive: {
    color: "#F43F5E",
  },
  summaryBanner: {
    flexDirection: "row",
    backgroundColor: "#1A1A1F",
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#71717A",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  expenseCard: {
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
  expenseContent: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 4,
  },
  expenseSubtitle: {
    fontSize: 13,
    color: "#71717A",
  },
  expensePayer: {
    color: "#A1A1AA",
    fontWeight: "500",
  },
  expenseRightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  expenseAmountContainer: {
    alignItems: "flex-end",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F43F5E",
  },
  expensePerPerson: {
    fontSize: 11,
    color: "#71717A",
    marginTop: 2,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  debtCard: {
    backgroundColor: "#1A1A1F",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  debtInfo: {
    flex: 1,
  },
  debtAvatars: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  debtAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  debtAvatarText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  debtText: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  debtDescription: {
    fontSize: 14,
    color: "#A1A1AA",
  },
  debtName: {
    color: "#FFF",
    fontWeight: "600",
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F43F5E",
    marginLeft: 12,
  },
  settleButton: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  settleButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  balanceHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#71717A",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F43F5E",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#F43F5E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    color: "#F43F5E",
  },
  modalBody: {
    padding: 20,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: "300",
    color: "#71717A",
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: "700",
    color: "#FFF",
    minWidth: 120,
    textAlign: "center",
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
  notesInput: {
    minHeight: 60,
    textAlignVertical: "top",
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
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderColor: "#F43F5E",
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
  splitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectAllText: {
    fontSize: 13,
    color: "#F43F5E",
    fontWeight: "500",
  },
  splitUsersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  splitUserCard: {
    width: (screenWidth - 64) / 3,
    backgroundColor: "#111114",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  splitUserCardSelected: {
    borderColor: "#F43F5E",
    backgroundColor: "rgba(244, 63, 94, 0.1)",
  },
  splitUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    position: "relative",
  },
  splitUserAvatarText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  checkBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  splitUserName: {
    fontSize: 12,
    color: "#A1A1AA",
    fontWeight: "500",
    textAlign: "center",
  },
  splitUserAmount: {
    fontSize: 11,
    color: "#F43F5E",
    fontWeight: "600",
    marginTop: 4,
  },
  receiptRow: {
    flexDirection: "row",
    gap: 12,
  },
  receiptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111114",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderStyle: "dashed",
    gap: 8,
  },
  receiptButtonText: {
    fontSize: 14,
    color: "#A1A1AA",
    fontWeight: "500",
  },
  receiptPreview: {
    marginTop: 12,
    position: "relative",
  },
  receiptImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
  },
  removeReceiptButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Settlement Card
  settlementCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  settlementIcon: {
    marginRight: 12,
  },
  settlementInfo: {
    flex: 1,
  },
  settlementText: {
    fontSize: 14,
    color: "#FFF",
  },
  settlementName: {
    fontWeight: "600",
  },
  settlementDate: {
    fontSize: 12,
    color: "#71717A",
    marginTop: 2,
  },
  settlementRight: {
    alignItems: "flex-end",
  },
  settlementAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#22C55E",
  },
  settlementDeleteBtn: {
    padding: 4,
    marginTop: 4,
  },
  settlementsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  settlementsCount: {
    fontSize: 13,
    color: "#71717A",
  },

  // Settlement Modal
  settlementModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  settlementModalContent: {
    backgroundColor: "#1A1A1F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  settlementModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  settlementModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  settlementDebtInfo: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#111114",
    borderRadius: 16,
    marginBottom: 20,
  },
  settlementAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  settlementAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  settlementAvatarText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  settlementDebtText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "500",
  },
  settlementDebtAmount: {
    fontSize: 14,
    color: "#71717A",
    marginTop: 4,
  },
  settlementInputLabel: {
    fontSize: 13,
    color: "#A1A1AA",
    marginBottom: 8,
  },
  settlementAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111114",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  settlementCurrency: {
    fontSize: 24,
    fontWeight: "600",
    color: "#71717A",
    marginRight: 8,
  },
  settlementAmountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    color: "#FFF",
    paddingVertical: 14,
  },
  settlementFullBtn: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  settlementFullBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F43F5E",
  },
  settlementNotesInput: {
    backgroundColor: "#111114",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#FFF",
    marginBottom: 20,
  },
  settlementSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  settlementSubmitText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});

export default ExpensesScreen;
