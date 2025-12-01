import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  ScrollView, 
  Text, 
  View, 
  TouchableOpacity, 
  RefreshControl,
  StyleSheet,
  Image
} from "react-native";
import { router } from "expo-router";

import { useGlobalContext } from "../../context/GlobalProvider";
import { 
  getHouseholdShoppingItems,
  getHouseholdExpenses,
  getHouseholdTasks,
  getLatestTasksImplByTaskId
} from "../../lib/appwrite";

const DashboardCard = ({ title, count, onPress, icon, color }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={[styles.card, { borderLeftColor: color || "#4F86C6" }]}
  >
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{title}</Text>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: color || "#4F86C6" }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
      )}
    </View>
    {count !== undefined && (
      <Text style={styles.cardCount}>{count}</Text>
    )}
  </TouchableOpacity>
);

const Home = () => {
  const { user, household } = useGlobalContext();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pendingChores: 0,
    completedChores: 0,
    shoppingItems: 0,
    pendingExpenses: 0
  });

  const fetchStats = async () => {
    if (!household?.$id) return;
    
    try {
      // Get tasks stats for household
      const tasks = await getHouseholdTasks(household.$id);
      let pendingCount = 0;
      let completedCount = 0;

      if (tasks && tasks.length > 0) {
        await Promise.all(tasks.map(async (task) => {
          const latestImpl = await getLatestTasksImplByTaskId(task.$id);
          if (latestImpl.length > 0) {
            completedCount++;
          } else {
            pendingCount++;
          }
        }));
      }

      // Get shopping items count for household
      let shoppingCount = 0;
      try {
        const shoppingItems = await getHouseholdShoppingItems(household.$id);
        // Count only non-completed items
        shoppingCount = shoppingItems?.filter(item => !item.completed).length || 0;
      } catch (error) {
        console.error("Error fetching shopping items:", error);
      }
      
      // Get expenses count for household
      let expensesCount = 0;
      try {
        const expenses = await getHouseholdExpenses(household.$id);
        expensesCount = expenses?.length || 0;
      } catch (error) {
        console.error("Error fetching expenses:", error);
      }
      
      setStats({
        pendingChores: pendingCount,
        completedChores: completedCount,
        shoppingItems: shoppingCount,
        pendingExpenses: expensesCount
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  useEffect(() => {
    if (household?.$id) {
      fetchStats();
    }
  }, [household?.$id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F86C6"]} />
        }
      >
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.usernameText}>{user?.username}</Text>
            </View>
            {user?.avatar && (
              <Image 
                source={{ uri: user.avatar }} 
                style={styles.avatar}
              />
            )}
          </View>
          {household && (
            <View style={styles.householdBadge}>
              <Text style={styles.householdText}>🏠 {household.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.dashboardSection}>
          
          <DashboardCard 
            title="Chores Calendar" 
            count={`${stats.pendingChores} pending`}
            icon="📅"
            onPress={() => router.push("/(tabs)/calendar")}
            color="#4F86C6"
          />
          
          <DashboardCard 
            title="Shopping List" 
            count={`${stats.shoppingItems} items`}
            icon="🛒"
            onPress={() => router.push("/(tabs)/shopping")}
            color="#4CAF50"
          />
          
          <DashboardCard 
            title="Expense Sharing" 
            count={`${stats.pendingExpenses} expenses`}
            icon="💰"
            onPress={() => router.push("/(tabs)/expenses")}
            color="#5D87B7"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: "#F9F9F9",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  welcomeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  usernameText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333333",
    marginTop: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E0E0E0",
  },
  householdBadge: {
    marginTop: 12,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  householdText: {
    fontSize: 14,
    color: "#1565C0",
    fontWeight: "500",
  },
  dashboardSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  cardCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 18,
  },
});

export default Home;
