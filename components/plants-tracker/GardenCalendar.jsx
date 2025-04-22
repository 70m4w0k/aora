import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
  ScrollView,
  TextInput,
  Animated,
  Modal,
  Dimensions,
  Pressable,
  Easing,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useGlobalContext } from "../../context/GlobalProvider";
import EmptyState from "../EmptyState";
import PlantCard from "./PlantCard";
import CreatePlantModal from "./CreatePlantModal";
import CreatePlantEventModal from "./CreatePlantEventModal";
import { getUserPlants, getUpcomingReminders, getPlantEvents } from "../../lib/appwrite";
import LegendModal from "../tasks/LegendModal";
import { getWeekNumberByDate, getFirstDayOfWeek } from "../../lib/utils";
import { icons } from "../../constants";

const WEEKS_IN_YEAR = 52;
const COLUMN_WIDTH = 60;
const ROW_HEIGHT = 45;
const PLANT_COLUMN_WIDTH = 150;
const VIEW_MODES = {
  CALENDAR: "calendar",
  LIST: "list",
};

const PLANT_TYPES = {
  ALL: "all",
  VEGETABLE: "vegetable",
  HERB: "herb",
  FRUIT: "fruit",
  FLOWER: "flower",
  TREE: "tree",
  OTHER: "other",
};

const EVENT_TYPES = {
  WATER: "water",
  FERTILIZE: "fertilize",
  PRUNE: "prune",
  HARVEST: "harvest",
  SOW: "sow",
  PLANT: "plant",
  TRANSPLANT: "transplant",
  CUTTING: "cutting",
  NOTE: "note",
};

// A mapping of event types to colors for visual representation
const EVENT_TYPE_COLORS = {
  [EVENT_TYPES.WATER]: "#4F86C6", // Blue
  [EVENT_TYPES.FERTILIZE]: "#4CAF50", // Green
  [EVENT_TYPES.PRUNE]: "#FF9800", // Orange
  [EVENT_TYPES.HARVEST]: "#8BC34A", // Light Green
  [EVENT_TYPES.SOW]: "#9C27B0", // Purple
  [EVENT_TYPES.PLANT]: "#009688", // Teal
  [EVENT_TYPES.TRANSPLANT]: "#795548", // Brown
  [EVENT_TYPES.CUTTING]: "#FF5722", // Deep Orange
  [EVENT_TYPES.NOTE]: "#607D8B", // Blue Grey
};

const GardenCalendar = () => {
  const { user } = useGlobalContext();
  const [plants, setPlants] = useState([]);
  const [plantEvents, setPlantEvents] = useState({});
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [plantToViewHistory, setPlantToViewHistory] = useState(null);

  // New state variables for enhanced functionality
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [filter, setFilter] = useState(PLANT_TYPES.ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentWeekNumber, setCurrentWeekNumber] = useState(
    getWeekNumberByDate(new Date())
  );
  const [currentWeekXPos, setCurrentWeekXPos] = useState(0);
  const [legendModalVisible, setLegendModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  
  // For animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // For double tap functionality
  const [tappedPlantId, setTappedPlantId] = useState(null);
  const [doubleTapPlantId, setDoubleTapPlantId] = useState(null);
  const lastTapTimeRef = useRef(0);
  const doubleTapTimeoutRef = useRef(null);
  const completeAnimationRef = useRef(new Animated.Value(0)).current;
  
  // For scrolling to current week
  const scrollRef = useRef();

  // Modals
  const [createPlantModalVisible, setCreatePlantModalVisible] = useState(false);
  const [plantEventModalVisible, setPlantEventModalVisible] = useState(false);

  // Add a new state variable for the selected week
  const [selectedWeek, setSelectedWeek] = useState(null);

  // Load plants and reminders
  useEffect(() => {
    if (user) {
      fetchData();
    }
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    scrollToCurrentWeek();
  }, [user]);

  const scrollToCurrentWeek = () => {
    // Add a slight delay to ensure the component is rendered
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: currentWeekXPos, animated: true });
    }, 300);
  };

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Fetch user's plants
      const userPlants = await getUserPlants(user.$id);
      setPlants(userPlants);

      // Fetch upcoming reminders
      // const reminders = await getUpcomingReminders(user.$id);
      // console.log("reminders", reminders);
      // setUpcomingReminders(reminders);
      
      // Fetch plant events for all plants
      const eventsData = {};
      for (const plant of userPlants) {
        const events = await getPlantEvents(plant.$id);
        // console.log("events", events);
        eventsData[plant.$id] = processPlantEvents(events);
      }
      setPlantEvents(eventsData);
    } catch (error) {
      console.error("Error fetching garden data:", error);
      Alert.alert("Error", "Failed to load garden data. Pull down to refresh and try again.");
    } finally {
      setRefreshing(false);
    }
  };

  // Process plant events into a weekly format for the calendar view
  const processPlantEvents = (events) => {
    const weeklyEvents = Array(WEEKS_IN_YEAR).fill(null);
    
    events.forEach(event => {
      const weekNumber = getWeekNumberByDate(new Date(event.date)) - 1;
      if (weekNumber >= 0 && weekNumber < WEEKS_IN_YEAR) {
        weeklyEvents[weekNumber] = {
          ...event,
          eventColor: EVENT_TYPE_COLORS[event.eventType] || "#607D8B",
        };
      }
    });
    
    return weeklyEvents;
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
    showPlantHistory(plant);
  };

  const toggleViewMode = () => {
    setViewMode(prevMode => 
      prevMode === VIEW_MODES.CALENDAR ? VIEW_MODES.LIST : VIEW_MODES.CALENDAR
    );
  };
  
  // Filter plants based on the selected plant type and search query
  const getFilteredPlants = useCallback(() => {
    return plants.filter(plant => {
      const matchesType = filter === PLANT_TYPES.ALL || plant.type === filter;
      const matchesSearch = searchQuery === "" ||
        plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (plant.variety && plant.variety.toLowerCase().includes(searchQuery.toLowerCase()));
        
      return matchesType && matchesSearch;
    });
  }, [plants, filter, searchQuery]);
  
  // Group plants by type for the list view
  const getGroupedPlants = useCallback(() => {
    const filteredPlants = getFilteredPlants();
    const groupedPlants = {};
    
    filteredPlants.forEach(plant => {
      const type = plant.type || PLANT_TYPES.OTHER;
      if (!groupedPlants[type]) {
        groupedPlants[type] = [];
      }
      groupedPlants[type].push(plant);
    });
    
    // Return an array of sections with title and data
    return Object.keys(groupedPlants).map(type => ({
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1) + "s",
      data: groupedPlants[type],
      // Create pairs of plants for the grid
      pairs: chunk(groupedPlants[type], 2),
    }));
  }, [getFilteredPlants]);
  
  // Helper function to split array into chunks for grid layout
  const chunk = (array, size) => {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  };
  
  // Function to get the most recent event for a plant
  const getLastEventInfo = (plant) => {
    if (!plantEvents[plant.$id]) {
      return { text: "No events yet", eventType: null, daysAgo: null };
    }
    
    // Find the last event going backwards
    const events = plantEvents[plant.$id].filter(Boolean);
    if (events.length === 0) {
      return { text: "No events yet", eventType: null, daysAgo: null };
    }
    
    // Get the most recent event by date
    const sortedEvents = [...events].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    const lastEvent = sortedEvents[0];
    if (!lastEvent) {
      return { text: "No events yet", eventType: null, daysAgo: null };
    }
    
    const lastEventDate = new Date(lastEvent.date);
    const today = new Date();
    const diffTime = Math.abs(today - lastEventDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let timeText;
    if (diffDays === 0) {
      timeText = "Today";
    } else if (diffDays === 1) {
      timeText = "Yesterday";
    } else {
      timeText = `${diffDays} days ago`;
    }
    
    // Capitalize the event type
    const eventTypeCapitalized = lastEvent.eventType.charAt(0).toUpperCase() + lastEvent.eventType.slice(1);
    
    return {
      text: `${eventTypeCapitalized}: ${timeText}`,
      eventType: lastEvent.eventType,
      daysAgo: diffDays,
      color: EVENT_TYPE_COLORS[lastEvent.eventType] || "#607D8B",
    };
  };
  
  // Function to show plant history modal
  const showPlantHistory = (plant) => {
    setPlantToViewHistory(plant);
    setHistoryModalVisible(true);
  };
  
  // Function to get all events for a plant
  const getPlantEventHistory = (plant) => {
    if (!plant || !plantEvents[plant.$id]) return [];
    
    const events = plantEvents[plant.$id]
      .filter(Boolean)
      .map(event => ({
        ...event,
        id: event.$id,
        weekNumber: getWeekNumberByDate(new Date(event.date)),
        dateFormatted: new Date(event.date).toLocaleDateString(),
      }));
    
    // Sort by most recent first
    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  };
  
  // Function to handle tap on a plant for double-tap functionality
  const handlePlantTap = (plantId) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms between taps to count as double-tap

    // If this is the first tap or tap on a different plant
    if (tappedPlantId !== plantId) {
      // Clear any existing timeout
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }

      // Set this plant as tapped
      setTappedPlantId(plantId);
      lastTapTimeRef.current = now;

      // Clear the tapped state after a delay if no second tap happens
      doubleTapTimeoutRef.current = setTimeout(() => {
        setTappedPlantId(null);
      }, DOUBLE_TAP_DELAY);

      return;
    }

    // If tapping the same plant that was just tapped
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
      // This is a double tap - quick water the plant
      clearTimeout(doubleTapTimeoutRef.current);
      setDoubleTapPlantId(plantId);
      setTappedPlantId(null);

      // Show completion animation
      completeAnimationRef.setValue(0);
      Animated.timing(completeAnimationRef, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.bezier(0.175, 0.885, 0.32, 1.275), // Bounce-like easing
      }).start(() => {
        // Actually create the water event after animation finishes
        const plant = plants.find(p => p.$id === plantId);
        if (plant) {
          setSelectedPlant(plant);
          // Pre-select water as the event type
          setTimeout(() => {
            setPlantEventModalVisible(true);
          }, 200);
        }
        
        // Reset animation state after a brief delay
        setTimeout(() => {
          setDoubleTapPlantId(null);
        }, 200);
      });
    } else {
      // If the second tap was too slow, treat as a new first tap
      clearTimeout(doubleTapTimeoutRef.current);
      lastTapTimeRef.current = now;

      doubleTapTimeoutRef.current = setTimeout(() => {
        setTappedPlantId(null);
      }, DOUBLE_TAP_DELAY);
    }
  };
  
  // Helper function to get a color for a plant type
  const getPlantTypeColor = (type) => {
    switch (type) {
      case PLANT_TYPES.VEGETABLE: return "#4CAF50"; // Green
      case PLANT_TYPES.HERB: return "#8BC34A"; // Light Green
      case PLANT_TYPES.FRUIT: return "#FF9800"; // Orange
      case PLANT_TYPES.FLOWER: return "#E91E63"; // Pink
      case PLANT_TYPES.TREE: return "#795548"; // Brown
      default: return "#607D8B"; // Blue Grey
    }
  };
  
  // Helper function to get icon for event type
  const getEventTypeIcon = (eventType) => {
    switch (eventType) {
      case EVENT_TYPES.WATER:
        return "water-outline";
      case EVENT_TYPES.FERTILIZE:
        return "emoticon-poop";
      case EVENT_TYPES.PRUNE:
        return "content-cut";
      case EVENT_TYPES.HARVEST:
        return "basket-outline";
      case EVENT_TYPES.SOW:
        return "seed-outline";
      case EVENT_TYPES.PLANT:
        return "sprout-outline";
      case EVENT_TYPES.TRANSPLANT:
        return "shovel";
      case EVENT_TYPES.CUTTING:
        return "cut-outline";
      case EVENT_TYPES.NOTE:
        return "create-outline";
      default:
        return "information-circle-outline";
    }
  };
  
  // Calculate screen dimensions for grid layout
  const screenWidth = Dimensions.get("window").width;
  const itemWidth = (screenWidth - 32) / 2; // 32 accounts for margins/padding
  
  // Generate legend data for event types
  const legendData = Object.keys(EVENT_TYPES).map(key => ({
    id: EVENT_TYPES[key],
    name: EVENT_TYPES[key].charAt(0).toUpperCase() + EVENT_TYPES[key].slice(1),
    color: EVENT_TYPE_COLORS[EVENT_TYPES[key]],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Enhanced Filter Bar */}
        <View style={styles.filterHeader}>
          <View style={styles.filterButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === PLANT_TYPES.ALL && styles.activeFilterButton,
              ]}
              onPress={() => setFilter(PLANT_TYPES.ALL)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === PLANT_TYPES.ALL && styles.activeFilterText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === PLANT_TYPES.VEGETABLE && styles.activeFilterButton,
              ]}
              onPress={() => setFilter(PLANT_TYPES.VEGETABLE)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === PLANT_TYPES.VEGETABLE && styles.activeFilterText,
                ]}
              >
                Vegetables
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === PLANT_TYPES.HERB && styles.activeFilterButton,
              ]}
              onPress={() => setFilter(PLANT_TYPES.HERB)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === PLANT_TYPES.HERB && styles.activeFilterText,
                ]}
              >
                Herbs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === PLANT_TYPES.FRUIT && styles.activeFilterButton,
              ]}
              onPress={() => setFilter(PLANT_TYPES.FRUIT)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === PLANT_TYPES.FRUIT && styles.activeFilterText,
                ]}
              >
                Fruits
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rightButtonsContainer}>
            <TouchableOpacity
              style={styles.viewModeButton}
              onPress={toggleViewMode}
            >
              <Ionicons
                name={viewMode === VIEW_MODES.CALENDAR ? "list" : "calendar"}
                size={18}
                color="#666666"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.legendButton}
              onPress={() => setLegendModalVisible(true)}
            >
              <Text style={styles.legendButtonText}>🔍 Events</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#666666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search plants..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999999"
          />
          {searchQuery !== "" && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery("")}
            >
              <Ionicons name="close-circle" size={18} color="#999999" />
            </TouchableOpacity>
          )}
        </View>

        {viewMode === VIEW_MODES.CALENDAR ? (
          <View style={styles.calendarContainer}>
            <View style={styles.plantColumn}>
              <View style={[styles.headerCell, { width: PLANT_COLUMN_WIDTH, height: 60 }]}>
                <Text style={styles.headerText}>Plants</Text>
              </View>
              
              <ScrollView>
                {getFilteredPlants().map((plant) => (
                  <View
                    key={plant.$id}
                    style={[
                      styles.cell,
                      { width: PLANT_COLUMN_WIDTH, height: ROW_HEIGHT },
                      styles.plantCell,
                    ]}
                  >
                    <View style={styles.plantTextContainer}>
                      <Text style={styles.plantText} numberOfLines={1}>
                        {plant.name}
                      </Text>
                    </View>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={[
                    styles.plantAddButton,
                    { width: PLANT_COLUMN_WIDTH },
                  ]}
                  onPress={() => setCreatePlantModalVisible(true)}
                >
                  <Text style={styles.plantAddButtonText}>Add Plant</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
            
            <ScrollView horizontal ref={scrollRef} showsHorizontalScrollIndicator={false}>
              <View>
                <View style={styles.headerRow}>
                  {Array.from({ length: WEEKS_IN_YEAR }, (_, i) => i + 1).map((weekNumber) => {
                    const isCurrentWeek = weekNumber === currentWeekNumber;
                    return (
                      <View
                        key={`week-${weekNumber}`}
                        style={[
                          styles.headerCell,
                          { width: COLUMN_WIDTH },
                          isCurrentWeek && styles.currentWeekHeader,
                        ]}
                      >
                        <Text style={[styles.headerText, isCurrentWeek && styles.currentWeekText]}>
                          W{weekNumber}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                
                {getFilteredPlants().map((plant) => (
                  <View key={plant.$id} style={styles.row}>
                    {Array.from({ length: WEEKS_IN_YEAR }, (_, i) => i).map((weekIndex) => {
                      const event = plantEvents[plant.$id]?.[weekIndex];
                      console.log(plantEvents);
                      const isCurrentWeek = weekIndex + 1 === currentWeekNumber;
                      
                      return (
                        <TouchableOpacity
                          key={`cell-${plant.$id}-${weekIndex}`}
                          style={[
                            styles.cell,
                            { width: COLUMN_WIDTH },
                            isCurrentWeek && styles.currentCell,
                          ]}
                          onPress={() => {
                            setSelectedPlant(plant);
                            setSelectedWeek(weekIndex + 1);
                            setPlantEventModalVisible(true);
                          }}
                        >
                          <View style={styles.checkboxContainer}>
                            {event ? (
                              <View
                                style={[
                                  styles.eventIndicator,
                                  { backgroundColor: event.eventColor || "#CCCCCC" },
                                ]}
                              >
                                <MaterialCommunityIcons 
                                  name={getEventTypeIcon(event.eventType)}
                                  size={18}
                                  color="white"
                                />

                              </View>
                            ) : (
                              <View style={styles.emptyCheckbox}>
                                <Ionicons name="add-outline" size={14} color="#BBBBBB" />
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : (
          // List View
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#4CAF50"]}
              />
            }
            style={styles.listContainer}
          >
            {/* Reminders Section */}
            {upcomingReminders.length > 0 && (
              <View style={styles.remindersContainer}>
                <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
                
                {upcomingReminders.slice(0, 3).map((reminder) => (
                  <View key={reminder.$id} style={styles.reminderItem}>
                    <View style={styles.reminderIconContainer}>
                      <Ionicons name="alarm-outline" size={20} color="#4CAF50" />
                    </View>
                    <View style={styles.reminderContent}>
                      <Text style={styles.reminderTitle}>
                        {reminder.eventType.charAt(0).toUpperCase() + reminder.eventType.slice(1)}
                      </Text>
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
            )}

            {/* Plants grouped by type */}
            {getGroupedPlants().map((group) => (
              <View key={`group-${group.type}`}>
                <View style={styles.plantTypeHeader}>
                  <Text style={styles.plantTypeHeaderText}>{group.title}</Text>
                </View>

                {/* Render each pair of plants in a row */}
                {group.pairs.map((pair, pairIndex) => (
                  <View
                    key={`pair-${group.type}-${pairIndex}`}
                    style={styles.plantRow}
                  >
                    {pair.map((plant) => {
                      const lastEvent = getLastEventInfo(plant);
                      return (
                        <TouchableOpacity
                          key={plant.$id}
                          onPress={() => handlePlantTap(plant.$id)}
                          style={[
                            styles.plantItemContainer,
                            { 
                              width: itemWidth,
                              borderLeftColor: getPlantTypeColor(plant.type)
                            },
                            tappedPlantId === plant.$id && styles.plantItemTapped,
                          ]}
                          activeOpacity={0.7}
                        >
                          {/* Large centered "Water?" message on first tap */}
                          {tappedPlantId === plant.$id && (
                            <View style={styles.waterPromptOverlay}>
                              <Text
                                style={[
                                  styles.waterPromptText,
                                  {
                                    color: getPlantTypeColor(plant.type),
                                    textShadowColor: "rgba(255, 255, 255, 0.8)",
                                    textShadowOffset: { width: 1, height: 1 },
                                    textShadowRadius: 3,
                                  },
                                ]}
                              >
                                Water?
                              </Text>
                              <Text style={styles.waterPromptSubtext}>
                                Tap again to confirm
                              </Text>
                            </View>
                          )}

                          {/* Show watering animation when double-tapped */}
                          {doubleTapPlantId === plant.$id && (
                            <Animated.View
                              style={[
                                styles.wateringOverlay,
                                {
                                  opacity: completeAnimationRef,
                                  transform: [
                                    {
                                      scale: completeAnimationRef.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [0.5, 1.2, 1],
                                      }),
                                    },
                                  ],
                                },
                              ]}
                            >
                              <MaterialCommunityIcons
                                name="water"
                                size={60}
                                color="#4F86C6"
                              />
                            </Animated.View>
                          )}

                          <View style={styles.plantItemHeader}>
                            <Text style={styles.plantItemTitle}>{plant.name}</Text>
                            {plant.variety && (
                              <Text style={styles.varietyText}>{plant.variety}</Text>
                            )}

                            <View style={styles.plantItemActions}>
                              {/* History button */}
                              <TouchableOpacity
                                style={styles.historyButton}
                                onPress={() => showPlantHistory(plant)}
                              >
                                <Text style={styles.historyButtonText}>?</Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Event info and icons */}
                          <View style={styles.plantEventsContainer}>
                            {lastEvent.eventType ? (
                              <View style={styles.lastEventContainer}>
                                <View style={[
                                  styles.eventIcon,
                                  { backgroundColor: lastEvent.color }
                                ]}>
                                  {/* <Ionicons
                                    name={getEventTypeIcon(lastEvent.eventType)}
                                    size={14}
                                    color="white"
                                  /> */
                                  <MaterialCommunityIcons 
                                  name={getEventTypeIcon(lastEvent.eventType)}
                                  size={18}
                                  color="white"
                                />}
                                </View>
                                <Text style={styles.lastEventText}>
                                  {lastEvent.text}
                                </Text>
                              </View>
                            ) : (
                              <Text style={styles.noEventsText}>No events recorded</Text>
                            )}
                          </View>

                          {/* Quick Action Buttons */}
                          <View style={styles.quickActionsContainer}>
                            <TouchableOpacity
                              style={[styles.quickActionButton, { backgroundColor: EVENT_TYPE_COLORS.water }]}
                              onPress={() => handleAddEvent(plant)}
                            >
                              <Ionicons name="water-outline" size={16} color="white" />
                              <Text style={styles.quickActionText}>Water</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              style={[styles.quickActionButton, { backgroundColor: EVENT_TYPE_COLORS.fertilize }]}
                              onPress={() => handleAddEvent(plant)}
                            >
                              <Ionicons name="nutrition-outline" size={16} color="white" />
                              <Text style={styles.quickActionText}>Feed</Text>
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      );
                    })}

                    {/* If there's only one item in the pair, add an empty view for layout */}
                    {pair.length === 1 && <View style={{ width: itemWidth }} />}
                  </View>
                ))}
              </View>
            ))}

            {/* Add Plant Button */}
            <TouchableOpacity
              style={styles.fancyAddButton}
              onPress={() => setCreatePlantModalVisible(true)}
            >
              <View style={styles.fancyAddButtonInner}>
                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                <Text style={styles.fancyAddButtonText}>Add New Plant</Text>
              </View>
            </TouchableOpacity>
            
            {/* Empty state when no plants */}
            {plants.length === 0 && !refreshing && (
              <EmptyState
                title="No Plants Yet"
                subtitle="Add your first plant to get started"
              />
            )}
          </ScrollView>
        )}
        
        {/* Modals */}
        <CreatePlantModal
          visible={createPlantModalVisible}
          onClose={() => setCreatePlantModalVisible(false)}
          onPlantCreated={handlePlantCreated}
        />
        
        <CreatePlantEventModal
          visible={plantEventModalVisible}
          onClose={() => {
            setPlantEventModalVisible(false);
            setSelectedWeek(null);
          }}
          onEventCreated={handleEventCreated}
          plant={selectedPlant}
          weekNumber={selectedWeek}
        />
        
        {/* Legend Modal for Event Types */}
        <LegendModal
          title="Event Types"
          users={legendData}
          visible={legendModalVisible}
          onClose={() => setLegendModalVisible(false)}
        />
        
        {/* Plant History Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={historyModalVisible}
          onRequestClose={() => {
            setHistoryModalVisible(false);
            setPlantToViewHistory(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.historyModalContainer}>
              <View style={styles.historyModalHeader}>
                <Text style={styles.historyModalTitle}>
                  {plantToViewHistory?.name} History
                </Text>
                <TouchableOpacity
                  style={styles.historyModalCloseButton}
                  onPress={() => {
                    setHistoryModalVisible(false);
                    setPlantToViewHistory(null);
                  }}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.historyModalBody}>
                {plantToViewHistory ? (
                  <>
                    <Text style={styles.historyModalSubtitle}>
                      Event Timeline
                    </Text>

                    {getPlantEventHistory(plantToViewHistory).length > 0 ? (
                      <FlatList
                        data={getPlantEventHistory(plantToViewHistory)}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <View style={styles.historyItem}>
                            <View style={styles.historyItemLeft}>
                              <View
                                style={[
                                  styles.historyEventIcon,
                                  {
                                    backgroundColor: EVENT_TYPE_COLORS[item.eventType] || "#607D8B",
                                  },
                                ]}
                              >
                                {/* <Ionicons
                                  name={getEventTypeIcon(item.eventType)}
                                  size={16}
                                  color="white"
                                /> */
                                <MaterialCommunityIcons 
                                  name={getEventTypeIcon(item.eventType)}
                                  size={18}
                                  color="white"
                                />}
                              </View>
                            </View>

                            <View style={styles.historyItemContent}>
                              <Text style={styles.historyItemDate}>
                                {item.dateFormatted}
                              </Text>
                              <Text style={styles.historyItemEvent}>
                                {item.eventType.charAt(0).toUpperCase() + item.eventType.slice(1)}
                                {item.notes && `: ${item.notes}`}
                              </Text>
                            </View>
                          </View>
                        )}
                        style={styles.historyList}
                        contentContainerStyle={styles.historyListContent}
                      />
                    ) : (
                      <View style={styles.emptyHistoryContainer}>
                        <MaterialCommunityIcons
                          name="calendar-alert"
                          size={48}
                          color="#DDD"
                        />
                        <Text style={styles.emptyHistoryText}>
                          No event history found for this plant
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.loadingText}>Loading history...</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.historyModalCloseFullButton}
                onPress={() => {
                  setHistoryModalVisible(false);
                  setPlantToViewHistory(null);
                }}
              >
                <Text style={styles.historyModalCloseFullButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  filterHeader: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
  },
  filterButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  rightButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 4,
  },
  activeFilterButton: {
    backgroundColor: "#4CAF50",
  },
  filterButtonText: {
    fontSize: 13,
    color: "#666666",
  },
  activeFilterText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  viewModeButton: {
    padding: 6,
    marginRight: 8,
  },
  legendButton: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  legendButtonText: {
    fontSize: 13,
    color: "#666666",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333333",
    height: 40,
  },
  clearSearchButton: {
    padding: 4,
  },
  // Calendar view styles
  calendarContainer: {
    flex: 1,
    flexDirection: "row",
  },
  plantColumn: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 1,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    height: 60,
  },
  headerCell: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#F8F8F8",
  },
  currentWeekHeader: {
    backgroundColor: "#E8F5E9",
  },
  headerText: {
    fontWeight: "500",
    fontSize: 12,
    color: "#666666",
  },
  currentWeekText: {
    fontWeight: "bold",
    color: "#4CAF50",
  },
  row: {
    flexDirection: "row",
    height: ROW_HEIGHT,
  },
  cell: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  plantCell: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
  },
  currentCell: {
    backgroundColor: "#F0F8F1",
  },
  plantTextContainer: {
    paddingHorizontal: 10,
    flex: 1,
    justifyContent: "center",
    maxWidth: PLANT_COLUMN_WIDTH - 10,
  },
  plantText: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
  },
  eventIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  plantAddButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#F0F8F1",
  },
  plantAddButtonText: {
    color: "#4CAF50",
    fontWeight: "600",
    fontSize: 14,
  },
  // List view styles
  listContainer: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  remindersContainer: {
    backgroundColor: "#F9FBF9",
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginBottom: 8,
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
  plantTypeHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F5F7FA",
    marginTop: 8,
  },
  plantTypeHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555555",
  },
  plantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  plantItemContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    padding: 12,
    borderLeftWidth: 4,
    position: "relative",
    overflow: "hidden",
  },
  plantItemTapped: {
    backgroundColor: "#F5F9FF",
  },
  plantItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  plantItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
  },
  varietyText: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#666666",
    marginBottom: 6,
  },
  plantItemActions: {
    flexDirection: "row",
  },
  historyButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EEF2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  plantEventsContainer: {
    marginBottom: 8,
  },
  lastEventContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  eventIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  lastEventText: {
    fontSize: 13,
    color: "#666666",
  },
  noEventsText: {
    fontSize: 13,
    color: "#999999",
    fontStyle: "italic",
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 4,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginRight: 8,
  },
  quickActionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  fancyAddButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    overflow: "hidden",
  },
  fancyAddButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  fancyAddButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  // Double tap and animation styles
  waterPromptOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    zIndex: 10,
  },
  waterPromptText: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
  },
  waterPromptSubtext: {
    fontSize: 12,
    color: "#444",
    fontWeight: "500",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  wateringOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 10,
    borderRadius: 8,
  },
  // History modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  historyModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  historyModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#F8F8F8",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  historyModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
  },
  historyModalCloseButton: {
    padding: 4,
  },
  historyModalBody: {
    padding: 20,
    maxHeight: 400,
  },
  historyModalSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555555",
    marginBottom: 16,
  },
  historyList: {
    maxHeight: 320,
  },
  historyListContent: {
    paddingBottom: 16,
  },
  historyItem: {
    flexDirection: "row",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#F5F7FA",
    borderRadius: 8,
  },
  historyItemLeft: {
    marginRight: 12,
  },
  historyEventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  historyItemContent: {
    flex: 1,
    justifyContent: "center",
  },
  historyItemDate: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 4,
  },
  historyItemEvent: {
    fontSize: 13,
    color: "#666666",
  },
  emptyHistoryContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyHistoryText: {
    marginTop: 16,
    fontSize: 16,
    color: "#888888",
    textAlign: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    paddingVertical: 40,
  },
  historyModalCloseFullButton: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    alignItems: "center",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  historyModalCloseFullButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4CAF50",
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  checkboxContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 32,
    height: 32,
  },
  emptyCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#F9F9F9",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default GardenCalendar;
