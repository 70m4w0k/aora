import { useState, useEffect } from "react";
import { 
  ScrollView, 
  Text, 
  View, 
  Pressable, 
  RefreshControl,
  StyleSheet,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { useGlobalContext } from "../../context/GlobalProvider";
import { Avatar } from "../../components/ui";
import { 
  getHouseholdShoppingItems,
  getHouseholdExpenses,
  getHouseholdTasks,
  getLatestTasksImplByTaskId
} from "../../lib/appwrite";

// Dark theme colors - consistent across app
const COLORS = {
  background: '#0A0A0C',
  surface: '#111114',
  card: '#1A1A1F',
  elevated: '#222228',
  border: 'rgba(255,255,255,0.1)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  accent: {
    primary: '#8B5CF6',
    chores: '#06B6D4',
    shopping: '#10B981',
    expenses: '#F43F5E',
    household: '#F59E0B',
  },
};

// Feature card with gradient accent
const FeatureCard = ({ title, subtitle, icon, color, gradient, onPress }) => {
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [styles.featureCard, pressed && styles.featureCardPressed]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.featureAccent}
      />
      <View style={styles.featureContent}>
        <View style={[styles.featureIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={22} color="#fff" />
        </View>
        <View style={styles.featureText}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
      </View>
    </Pressable>
  );
};

// Quick stat pill
const QuickStat = ({ icon, value, label, color }) => (
  <View style={styles.quickStat}>
    <View style={[styles.quickStatIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <Text style={styles.quickStatValue}>{value}</Text>
    <Text style={styles.quickStatLabel}>{label}</Text>
  </View>
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

      let shoppingCount = 0;
      try {
        const shoppingItems = await getHouseholdShoppingItems(household.$id);
        shoppingCount = shoppingItems?.filter(item => !item.completed).length || 0;
      } catch (error) {
        console.error("Error fetching shopping items:", error);
      }
      
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.accent.primary}
            colors={[COLORS.accent.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.greeting}>
              <Text style={styles.greetingText}>{getGreeting()},</Text>
              <Text style={styles.userName}>{user?.username || 'there'}</Text>
            </View>
            <Avatar 
              source={user?.avatar}
              name={user?.username}
              size="lg"
              onPress={() => router.push("/(tabs)/profile")}
            />
          </View>
          
          {household && (
            <View style={styles.householdPill}>
              <Ionicons name="home" size={14} color={COLORS.accent.household} />
              <Text style={styles.householdName}>{household.name}</Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <QuickStat icon="checkbox" value={stats.pendingChores} label="Pending" color={COLORS.accent.chores} />
          <View style={styles.statDivider} />
          <QuickStat icon="cart" value={stats.shoppingItems} label="To buy" color={COLORS.accent.shopping} />
          <View style={styles.statDivider} />
          <QuickStat icon="receipt" value={stats.pendingExpenses} label="Expenses" color={COLORS.accent.expenses} />
        </View>

        {/* Feature Cards */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
          
          <FeatureCard 
            title="Chores Calendar"
            subtitle={stats.pendingChores > 0 ? `${stats.pendingChores} tasks pending` : "All caught up!"}
            icon="calendar"
            color={COLORS.accent.chores}
            gradient={[COLORS.accent.chores, '#0891B2']}
            onPress={() => router.push("/(tabs)/calendar")}
          />
          
          <FeatureCard 
            title="Shopping List"
            subtitle={stats.shoppingItems > 0 ? `${stats.shoppingItems} items to buy` : "List is empty"}
            icon="cart"
            color={COLORS.accent.shopping}
            gradient={[COLORS.accent.shopping, '#059669']}
            onPress={() => router.push("/(tabs)/shopping")}
          />
          
          <FeatureCard 
            title="Expense Sharing"
            subtitle={stats.pendingExpenses > 0 ? `${stats.pendingExpenses} expenses recorded` : "No expenses yet"}
            icon="wallet"
            color={COLORS.accent.expenses}
            gradient={[COLORS.accent.expenses, '#E11D48']}
            onPress={() => router.push("/(tabs)/expenses")}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  
  // Header
  header: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  householdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent.household}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
    gap: 8,
  },
  householdName: {
    color: COLORS.accent.household,
    fontWeight: '600',
    fontSize: 13,
  },

  // Quick Stats
  quickStatsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  quickStat: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  quickStatLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },

  // Features Section
  featuresSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
    color: COLORS.textTertiary,
    marginBottom: 12,
    marginLeft: 4,
  },

  // Feature Card
  featureCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  featureCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  featureAccent: {
    height: 3,
    width: '100%',
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 20,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
});

export default Home;
