import React, { useEffect, useState } from "react";
import {
  View, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert
} from "react-native";
import { 
  getChores, 
  getLatestChoresImplByChoreId, 
  createChoreImplementation 
} from "../lib/appwrite";
import ToDoChoreItem from "./ToDoChoreItem";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "./EmptyState";
import { useGlobalContext } from "../context/GlobalProvider";

const ChoresListScreen = () => {
  const { user } = useGlobalContext();
  const [chores, setChores] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // all, done, pending

  useEffect(() => {
    fetchChores();
  }, []);

  const getRelativeTime = (dateString) => {
    const givenDate = new Date(dateString);
    const currentDate = new Date();

    // Calculate the difference in time (in milliseconds)
    const differenceInTime = currentDate - givenDate;

    // Calculate the difference in days
    const differenceInDays = Math.floor(
      differenceInTime / (1000 * 60 * 60 * 24)
    );

    if (differenceInDays === 0) {
      return "today";
    } else if (differenceInDays === 1) {
      return "a day ago";
    } else if (differenceInDays <= 6) {
      return `${differenceInDays} days ago`;
    } else {
      return "a week ago";
    }
  };

  const fetchChores = async () => {
    try {
      setRefreshing(true);
      const choresList = await getChores(); // Fetch chores from Appwrite
      
      // Process each chore to add additional information
      const processedChores = await Promise.all(
        choresList.map(async (chore) => {
          const latestChoreImpl = await getLatestChoresImplByChoreId(chore.$id);
          if (latestChoreImpl.length > 0) {
            return {
              ...chore,
              lastDoneTime: getRelativeTime(latestChoreImpl[0].$updatedAt),
              authorName: latestChoreImpl[0].authorId?.username,
              isDone: true,
              authorId: latestChoreImpl[0].authorId?.$id || latestChoreImpl[0].authorId,
              lastDoneDate: new Date(latestChoreImpl[0].$updatedAt)
            };
          }
          return {
            ...chore,
            isDone: false
          };
        })
      );

      // Sort by completion status and date (most recent first)
      const sortedChores = processedChores.sort((a, b) => {
        // First sort by completion status (pending first)
        if (a.isDone !== b.isDone) {
          return a.isDone ? 1 : -1;
        }
        
        // Then by date if both are done
        if (a.isDone && b.isDone) {
          return b.lastDoneDate - a.lastDoneDate;
        }
        
        return 0;
      });

      setChores(sortedChores);
    } catch (error) {
      console.error("Error fetching chores:", error);
      Alert.alert("Error", "Could not fetch chores. Please try again later.");
    } finally {
      setRefreshing(false);
    }
  };

  const submitDone = async (choreId) => {
    try {
      await createChoreImplementation({
        percentageDone: 100,
        userId: user.$id,
        choreId: choreId,
      });
      // Refetch chores to update the list
      fetchChores();
    } catch (error) {
      console.error("Error completing chore:", error);
      Alert.alert("Error", "Could not mark chore as done. Please try again.");
    }
  };

  const filteredChores = chores.filter(chore => {
    if (filter === "all") return true;
    if (filter === "done") return chore.isDone;
    if (filter === "pending") return !chore.isDone;
    return true;
  });

  const onRefresh = () => {
    fetchChores();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Household Chores</Text>
        
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "all" && styles.activeFilterButton
            ]}
            onPress={() => setFilter("all")}
          >
            <Text 
              style={[
                styles.filterButtonText,
                filter === "all" && styles.activeFilterText
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "pending" && styles.activeFilterButton
            ]}
            onPress={() => setFilter("pending")}
          >
            <Text 
              style={[
                styles.filterButtonText,
                filter === "pending" && styles.activeFilterText
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "done" && styles.activeFilterButton
            ]}
            onPress={() => setFilter("done")}
          >
            <Text 
              style={[
                styles.filterButtonText,
                filter === "done" && styles.activeFilterText
              ]}
            >
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredChores}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <ToDoChoreItem
            title={item.title}
            lastTimeDone={item.lastDoneTime ? `Last time: ${item.lastDoneTime}` : null}
            byUser={item.authorName ? `By: ${item.authorName}` : null}
            isDone={item.isDone}
            onPress={() => {
              if (!item.isDone) {
                submitDone(item.$id);
              } else {
                Alert.alert(
                  "Chore Already Done",
                  `This chore was already done ${item.lastDoneTime} by ${item.authorName || "someone"}.`
                );
              }
            }}
            recurrence={item.recurrence}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No Chores Found"
            subtitle="You can create new chores to get started"
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/create-chore")}
        >
          <Text style={styles.addButtonText}>+ Create New Chore</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => router.push("/calendar")}
        >
          <Text style={styles.calendarButtonText}>View Chores Calendar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    padding: 4,
    overflow: "hidden",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 20,
    marginHorizontal: 2,
  },
  activeFilterButton: {
    backgroundColor: "#4F86C6",
  },
  filterButtonText: {
    color: "#666666",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "white",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 120, // Add extra padding for the footer
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButton: {
    backgroundColor: "#4F86C6",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  calendarButton: {
    backgroundColor: "#F0F0F0",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  calendarButtonText: {
    color: "#555555",
    fontWeight: "600",
    fontSize: 16,
  }
});

export default ChoresListScreen;
