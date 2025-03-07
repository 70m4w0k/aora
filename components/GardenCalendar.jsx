import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGlobalContext } from "../context/GlobalProvider";
import EmptyState from "./EmptyState";
import PlantCard from "./PlantCard";
import CreatePlantModal from "./CreatePlantModal";
import CreatePlantEventModal from "./CreatePlantEventModal";
import { getUserPlants, getUpcomingReminders } from "../lib/appwrite";

const GardenCalendar = () => {
  const { user } = useGlobalContext();
  const [plants, setPlants] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);

  // Modals
  const [createPlantModalVisible, setCreatePlantModalVisible] = useState(false);
  const [plantEventModalVisible, setPlantEventModalVisible] = useState(false);

  // Load plants and reminders
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Fetch user's plants
      const userPlants = await getUserPlants(user.$id);
      setPlants(userPlants);

      // Fetch upcoming reminders
      const reminders = await getUpcomingReminders(user.$id);
      setUpcomingReminders(reminders);
    } catch (error) {
      console.error("Error fetching garden data:", error);
      Alert.alert("Error", "Failed to load garden data. Pull down to refresh and try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handlePlantCreated = (newPlant) => {
    setPlants(prevPlants => [newPlant, ...prevPlants]);
  };

  const handleEventCreated = (newEvent) => {
    // Refresh data when a new event is created
    fetchData();
  };

  const handleAddEvent = (plant) => {
    setSelectedPlant(plant);
    setPlantEventModalVisible(true);
  };

  const handleSelectPlant = (plant) => {
    // In the future, this could navigate to a detailed plant view
    Alert.alert(
      plant.name,
      `Would you like to add an event for this ${plant.type}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Add Event",
          onPress: () => handleAddEvent(plant)
        }
      ]
    );
  };

  const renderEmptyState = () => (
    <EmptyState
      title="No Plants Yet"
      subtitle="Add your first plant to get started"
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>My Garden</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setCreatePlantModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderRemindersSection = () => {
    if (upcomingReminders.length === 0) return null;

    return (
      <View style={styles.remindersContainer}>
        <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
        
        {upcomingReminders.slice(0, 3).map((reminder, index) => (
          <View key={reminder.$id} style={styles.reminderItem}>
            <View style={styles.reminderIconContainer}>
              <Ionicons name="alarm-outline" size={20} color="#4CAF50" />
            </View>
            <View style={styles.reminderContent}>
              <Text style={styles.reminderTitle}>{reminder.eventType.charAt(0).toUpperCase() + reminder.eventType.slice(1)}</Text>
              <Text style={styles.reminderDate}>
                {new Date(reminder.scheduledDate).toLocaleDateString()}
              </Text>
              <Text style={styles.reminderPlant}>
                {reminder.plantId.name || "Plant"}
              </Text>
            </View>
          </View>
        ))}
        
        {upcomingReminders.length > 3 && (
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See all {upcomingReminders.length} reminders</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={plants}
        renderItem={({ item }) => (
          <PlantCard 
            plant={item} 
            onSelect={handleSelectPlant}
            onAddEvent={handleAddEvent}
          />
        )}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={renderRemindersSection}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {/* Modals */}
      <CreatePlantModal
        visible={createPlantModalVisible}
        onClose={() => setCreatePlantModalVisible(false)}
        onPlantCreated={handlePlantCreated}
      />
      
      <CreatePlantEventModal
        visible={plantEventModalVisible}
        onClose={() => setPlantEventModalVisible(false)}
        onEventCreated={handleEventCreated}
        plant={selectedPlant}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  remindersContainer: {
    backgroundColor: "#F9FBF9",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
  },
  reminderItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#4CAF50",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reminderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  reminderDate: {
    fontSize: 12,
    color: "#666666",
  },
  reminderPlant: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
  },
  seeAllButton: {
    alignItems: "center",
    padding: 8,
    marginTop: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
});

export default GardenCalendar;
