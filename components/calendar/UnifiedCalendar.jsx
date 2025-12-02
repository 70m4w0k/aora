import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useGlobalContext } from "../../context/GlobalProvider";
import {
  getHouseholdEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  EventCategories,
  getHouseholdTasks,
  getAllTasksDone,
  getHouseholdMembers,
  createTask,
  updateTask,
  deleteTask,
} from "../../lib/appwrite";
import { getWeekNumberByDate } from "../../lib/utils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Event category config with colors and icons
const EVENT_CATEGORY_CONFIG = {
  [EventCategories.CHORE]: { icon: "checkbox", color: "#06B6D4", label: "Chore" },
  [EventCategories.MEETING]: { icon: "people", color: "#8B5CF6", label: "Meeting" },
  [EventCategories.SOCIAL]: { icon: "wine", color: "#EC4899", label: "Social" },
  [EventCategories.WORK]: { icon: "briefcase", color: "#F59E0B", label: "Work" },
  [EventCategories.PERSONAL]: { icon: "person", color: "#10B981", label: "Personal" },
  [EventCategories.REMINDER]: { icon: "notifications", color: "#F43F5E", label: "Reminder" },
  [EventCategories.OTHER]: { icon: "calendar", color: "#71717A", label: "Other" },
};

// View types
const VIEW_TYPES = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  ANNUAL: "annual",
};

const UnifiedCalendar = () => {
  const { user, household } = useGlobalContext();
  const [currentView, setCurrentView] = useState(VIEW_TYPES.MONTHLY);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tasksDone, setTasksDone] = useState([]);
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("event"); // "event" or "chore"
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingChore, setEditingChore] = useState(null);
  
  // Event form state
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(),
    allDay: false,
    category: EventCategories.OTHER,
    assignedTo: "",
    color: null,
  });
  
  // Chore form state
  const [choreForm, setChoreForm] = useState({
    title: "",
    recurrence: "weekly", // "daily", "weekly", "monthly"
  });
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // Chores list view state
  const [showChoresList, setShowChoresList] = useState(false);

  useEffect(() => {
    if (household?.$id) {
      fetchData();
    }
  }, [household?.$id, currentDate, currentView]);

  const fetchData = async () => {
    if (!household?.$id) return;
    
    setLoading(true);
    try {
      // Calculate date range based on current view
      const { startDate, endDate } = getDateRange(currentDate, currentView);
      
      // Fetch events for the date range
      try {
        const eventsData = await getHouseholdEvents(household.$id, startDate, endDate);
        setEvents(eventsData || []);
      } catch (error) {
        console.warn("Error fetching events (collection may not exist yet):", error);
        setEvents([]); // Set empty array if collection doesn't exist
      }

      // Fetch tasks (they're recurring, so we fetch all)
      const tasksData = await getHouseholdTasks(household.$id);
      setTasks(tasksData || []);

      // Fetch tasks done
      const tasksDoneData = await getAllTasksDone();
      // Filter by household if needed
      const householdTasksDone = tasksDoneData?.filter(td => {
        if (!td || !td.householdId) return false;
        const tdHouseholdId = typeof td.householdId === 'object' ? td.householdId?.$id : td.householdId;
        return tdHouseholdId === household.$id;
      }) || [];
      setTasksDone(householdTasksDone);

      // Fetch household members for event assignment
      const membersData = await getHouseholdMembers(household.$id);
      setUsers(membersData || []);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (date, view) => {
    const start = new Date(date);
    const end = new Date(date);

    switch (view) {
      case VIEW_TYPES.DAILY:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case VIEW_TYPES.WEEKLY:
        // Get start of week (Monday)
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        // Get end of week (Sunday)
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case VIEW_TYPES.MONTHLY:
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        // Get last day of month
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case VIEW_TYPES.ANNUAL:
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    switch (currentView) {
      case VIEW_TYPES.DAILY:
        newDate.setDate(newDate.getDate() + direction);
        break;
      case VIEW_TYPES.WEEKLY:
        newDate.setDate(newDate.getDate() + (direction * 7));
        break;
      case VIEW_TYPES.MONTHLY:
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      case VIEW_TYPES.ANNUAL:
        newDate.setFullYear(newDate.getFullYear() + direction);
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateHeader = () => {
    switch (currentView) {
      case VIEW_TYPES.DAILY:
        return currentDate.toLocaleDateString("en-US", { 
          weekday: "long", 
          year: "numeric", 
          month: "long", 
          day: "numeric" 
        });
      case VIEW_TYPES.WEEKLY:
        const weekStart = new Date(currentDate);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      case VIEW_TYPES.MONTHLY:
        return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      case VIEW_TYPES.ANNUAL:
        return currentDate.getFullYear().toString();
    }
  };

  // Combine events and tasks for display
  const getCombinedItems = () => {
    const items = [];
    
    // Add events
    if (events && Array.isArray(events)) {
      events.forEach(event => {
        if (!event || !event.$id) return;
        try {
          const startDate = event.startDate ? new Date(event.startDate) : new Date();
          const endDate = event.endDate ? new Date(event.endDate) : startDate;
          
          // Validate dates
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn("Invalid date in event:", event);
            return;
          }
          
          items.push({
            id: event.$id,
            type: "event",
            title: event.title || "Untitled Event",
            startDate,
            endDate,
            allDay: event.allDay || false,
            category: event.category || EventCategories.OTHER,
            color: event.color || EVENT_CATEGORY_CONFIG[event.category]?.color || "#71717A",
            data: event,
          });
        } catch (error) {
          console.warn("Error processing event:", error, event);
        }
      });
    }

    // Add tasks (convert recurring tasks to calendar items)
    // This is a simplified version - you might want to expand this
    if (tasks && Array.isArray(tasks)) {
      tasks.forEach(task => {
        if (!task || !task.$id) return;
        try {
          // For now, show tasks in the current view period
          // You could expand this to show recurring instances
          items.push({
            id: `task-${task.$id}`,
            type: "task",
            title: task.title || "Untitled Task",
            startDate: currentDate, // Placeholder - you'd calculate based on recurrence
            endDate: currentDate,
            allDay: true,
            category: EventCategories.CHORE,
            color: "#06B6D4",
            data: task,
          });
        } catch (error) {
          console.warn("Error processing task:", error, task);
        }
      });
    }

    return items.sort((a, b) => a.startDate - b.startDate);
  };

  const renderViewSwitcher = () => {
    return (
      <View style={styles.viewSwitcher}>
        {Object.entries(VIEW_TYPES).map(([key, value]) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.viewButton,
              currentView === value && styles.viewButtonActive,
            ]}
            onPress={() => setCurrentView(value)}
          >
            <Text
              style={[
                styles.viewButtonText,
                currentView === value && styles.viewButtonTextActive,
              ]}
            >
              {key.charAt(0) + key.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateDate(-1)}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{formatDateHeader()}</Text>
          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.navButton} onPress={() => navigateDate(1)}>
          <Ionicons name="chevron-forward" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  };

  const handleDayPress = (date) => {
    // Could open event creation modal or show day details
    console.log("Day pressed:", date);
  };

  const openModal = (type = "event", date = null, item = null) => {
    setModalType(type);
    
    if (type === "event") {
      if (item) {
        // Edit event
        setEditingEvent(item);
        setEditingChore(null);
        const startDate = new Date(item.startDate);
        const endDate = new Date(item.endDate);
        setEventForm({
          title: item.title || "",
          description: item.description || "",
          startDate,
          endDate,
          allDay: item.allDay || false,
          category: item.category || EventCategories.OTHER,
          assignedTo: typeof item.assignedTo === 'object' ? item.assignedTo?.$id : item.assignedTo || "",
          color: item.color || null,
        });
      } else {
        // Create event
        setEditingEvent(null);
        setEditingChore(null);
        const defaultDate = date || new Date();
        defaultDate.setHours(9, 0, 0, 0);
        const endDate = new Date(defaultDate);
        endDate.setHours(10, 0, 0, 0);
        
        setEventForm({
          title: "",
          description: "",
          startDate: defaultDate,
          endDate: endDate,
          allDay: false,
          category: EventCategories.OTHER,
          assignedTo: "",
          color: null,
        });
      }
    } else if (type === "chore") {
      if (item) {
        // Edit chore
        setEditingChore(item);
        setEditingEvent(null);
        setChoreForm({
          title: item.title || "",
          recurrence: item.recurrence || "weekly",
        });
      } else {
        // Create chore
        setEditingChore(null);
        setEditingEvent(null);
        setChoreForm({
          title: "",
          recurrence: "weekly",
        });
      }
    }
    
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingEvent(null);
    setEditingChore(null);
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim()) {
      Alert.alert("Error", "Please enter an event title");
      return;
    }

    if (!household?.$id || !user?.$id) {
      Alert.alert("Error", "Missing household or user information");
      return;
    }

    try {
      // Format dates for storage
      const startDate = eventForm.allDay
        ? new Date(eventForm.startDate.getFullYear(), eventForm.startDate.getMonth(), eventForm.startDate.getDate(), 0, 0, 0, 0)
        : eventForm.startDate;
      const endDate = eventForm.allDay
        ? new Date(eventForm.endDate.getFullYear(), eventForm.endDate.getMonth(), eventForm.endDate.getDate(), 23, 59, 59, 999)
        : eventForm.endDate;

      if (editingEvent) {
        // Update existing event
        await updateEvent(editingEvent.$id, {
          title: eventForm.title.trim(),
          description: eventForm.description.trim() || null,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          allDay: eventForm.allDay,
          category: eventForm.category,
          assignedTo: eventForm.assignedTo || null,
          color: eventForm.color || null,
        });
        Alert.alert("Success", "Event updated!");
      } else {
        // Create new event
        await createEvent({
          title: eventForm.title.trim(),
          description: eventForm.description.trim() || null,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          allDay: eventForm.allDay,
          category: eventForm.category,
          assignedTo: eventForm.assignedTo || null,
          color: eventForm.color || null,
          householdId: household.$id,
          userId: user.$id,
        });
        Alert.alert("Success", "Event created!");
      }

      await fetchData();
      closeModal();
    } catch (error) {
      console.error("Error saving event:", error);
      Alert.alert("Error", "Could not save event. " + (error.message || ""));
    }
  };

  const handleSaveChore = async () => {
    if (!choreForm.title.trim()) {
      Alert.alert("Error", "Please enter a chore title");
      return;
    }

    if (!household?.$id) {
      Alert.alert("Error", "Missing household information");
      return;
    }

    try {
      if (editingChore) {
        // Update existing chore
        await updateTask(editingChore.$id, {
          title: choreForm.title.trim(),
          recurrence: choreForm.recurrence,
        });
        Alert.alert("Success", "Chore updated!");
      } else {
        // Create new chore
        await createTask({
          title: choreForm.title.trim(),
          recurrence: choreForm.recurrence,
          householdId: household.$id,
        });
        Alert.alert("Success", "Chore created!");
      }

      await fetchData();
      closeModal();
    } catch (error) {
      console.error("Error saving chore:", error);
      Alert.alert("Error", "Could not save chore. " + (error.message || ""));
    }
  };

  const handleDeleteEvent = (event) => {
    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEvent(event.$id);
              Alert.alert("Success", "Event deleted!");
              await fetchData();
            } catch (error) {
              Alert.alert("Error", "Could not delete event");
            }
          },
        },
      ]
    );
  };

  const handleDeleteChore = (chore) => {
    Alert.alert(
      "Delete Chore",
      `Are you sure you want to delete "${chore.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTask(chore.$id);
              Alert.alert("Success", "Chore deleted!");
              await fetchData();
            } catch (error) {
              Alert.alert("Error", "Could not delete chore");
            }
          },
        },
      ]
    );
  };

  // Calculate days since last completion for a chore
  const getDaysSinceLastCompletion = (chore) => {
    const choreCompletions = tasksDone.filter(td => {
      const tdTaskId = typeof td.taskId === 'object' ? td.taskId?.$id : td.taskId;
      return tdTaskId === chore.$id;
    });
    
    if (choreCompletions.length === 0) {
      return null; // Never completed
    }
    
    // Sort by creation date (most recent first)
    const sorted = choreCompletions.sort((a, b) => {
      const dateA = new Date(a.$createdAt);
      const dateB = new Date(b.$createdAt);
      return dateB - dateA;
    });
    
    const lastCompletion = new Date(sorted[0].$createdAt);
    const now = new Date();
    const diffTime = now - lastCompletion;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Get status color and emoji based on recurrence and days since completion
  const getChoreStatus = (chore) => {
    const daysSince = getDaysSinceLastCompletion(chore);
    
    if (daysSince === null) {
      return { color: "#EF4444", emoji: "🔴", text: "Never completed" };
    }
    
    const recurrenceDays = {
      daily: 1,
      weekly: 7,
      monthly: 30,
    };
    
    const expectedDays = recurrenceDays[chore.recurrence] || 7;
    const ratio = daysSince / expectedDays;
    
    if (ratio < 0.8) {
      // Green: less than 80% of expected time
      return { color: "#22C55E", emoji: "🟢", text: `${daysSince} day${daysSince !== 1 ? 's' : ''} ago` };
    } else if (ratio <= 1.2) {
      // Orange: 80-120% of expected time
      return { color: "#F59E0B", emoji: "🟠", text: `${daysSince} day${daysSince !== 1 ? 's' : ''} ago` };
    } else {
      // Red: more than 120% of expected time
      return { color: "#EF4444", emoji: "🔴", text: `${daysSince} day${daysSince !== 1 ? 's' : ''} ago` };
    }
  };

  const formatDateTime = (date, allDay = false) => {
    if (allDay) {
      return date.toLocaleDateString("en-US", { 
        weekday: "short", 
        month: "short", 
        day: "numeric" 
      });
    }
    return date.toLocaleString("en-US", { 
      month: "short", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const renderCategorySelector = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {Object.entries(EVENT_CATEGORY_CONFIG).map(([key, config]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.categoryChip,
              eventForm.category === key && { 
                backgroundColor: config.color, 
                borderColor: config.color 
              },
            ]}
            onPress={() => setEventForm(prev => ({ ...prev, category: key }))}
          >
            <Ionicons 
              name={config.icon} 
              size={16} 
              color={eventForm.category === key ? "#FFF" : "#71717A"} 
            />
            <Text style={[
              styles.categoryChipText,
              eventForm.category === key && { color: "#FFF" },
            ]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderViewContent = () => {
    const items = getCombinedItems();
    
    switch (currentView) {
      case VIEW_TYPES.DAILY:
        return <DailyView date={currentDate} items={items} />;
      case VIEW_TYPES.WEEKLY:
        return <WeeklyView date={currentDate} items={items} />;
      case VIEW_TYPES.MONTHLY:
        return (
          <MonthlyView 
            date={currentDate} 
            items={items}
            onDayPress={handleDayPress}
            onCreateEvent={(date) => openModal("event", date)}
            onEditEvent={(date, event) => openModal("event", date, event)}
            onDeleteEvent={handleDeleteEvent}
          />
        );
      case VIEW_TYPES.ANNUAL:
        return <AnnualView date={currentDate} tasks={tasks} tasksDone={tasksDone} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderViewSwitcher()}
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06B6D4" />
        }
      >
        {renderViewContent()}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => openModal("event")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Chores List Button */}
      <TouchableOpacity
        style={styles.choresListButton}
        onPress={() => setShowChoresList(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="checkbox-outline" size={25} color="#FFF" />
      </TouchableOpacity>

      {/* Chores List Modal */}
      <Modal
        visible={showChoresList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChoresList(false)}
      >
        <View style={styles.choresListOverlay}>
          <View style={styles.choresListContent}>
            <View style={styles.choresListHeader}>
              <Text style={styles.choresListTitle}>All Chores</Text>
              <TouchableOpacity onPress={() => setShowChoresList(false)}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={tasks}
              keyExtractor={(item) => item.$id}
              renderItem={({ item }) => {
                const status = getChoreStatus(item);
                return (
                  <View style={styles.choreListItem}>
                    <View style={styles.choreListItemContent}>
                      <View style={styles.choreListItemHeader}>
                        <Text style={styles.choreListItemTitle}>{item.title}</Text>
                        <View style={[styles.choreStatusBadge, { backgroundColor: status.color + "20" }]}>
                          <Text style={styles.choreStatusEmoji}>{status.emoji}</Text>
                          <Text style={[styles.choreStatusText, { color: status.color }]}>
                            {status.text}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.choreListItemRecurrence}>
                        Recurrence: {item.recurrence.charAt(0).toUpperCase() + item.recurrence.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.choreListItemActions}>
                      <TouchableOpacity
                        style={styles.choreListActionButton}
                        onPress={() => {
                          setShowChoresList(false);
                          openModal("chore", null, item);
                        }}
                      >
                        <Ionicons name="pencil" size={18} color="#06B6D4" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.choreListActionButton}
                        onPress={() => handleDeleteChore(item)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.choresListEmpty}>
                  <Ionicons name="checkbox-outline" size={64} color="#3F3F46" />
                  <Text style={styles.choresListEmptyText}>No chores yet</Text>
                  <Text style={styles.choresListEmptySubtext}>Create your first chore</Text>
                </View>
              }
              contentContainerStyle={styles.choresListContentContainer}
            />
            
            <TouchableOpacity
              style={styles.choresListAddButton}
              onPress={() => {
                setShowChoresList(false);
                openModal("chore");
              }}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.choresListAddButtonText}>Add Chore</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Event/Chore Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {modalType === "event" 
                  ? (editingEvent ? "Edit Event" : "Add Event")
                  : (editingChore ? "Edit Chore" : "Add Chore")
                }
              </Text>
              <TouchableOpacity onPress={modalType === "event" ? handleSaveEvent : handleSaveChore}>
                <Text style={styles.modalSaveText}>
                  {modalType === "event" 
                    ? (editingEvent ? "Update" : "Save")
                    : (editingChore ? "Update" : "Save")
                  }
                </Text>
              </TouchableOpacity>
            </View>

            {/* Type Toggle */}
            <View style={styles.modalTypeToggle}>
              <TouchableOpacity
                style={[styles.modalTypeButton, modalType === "event" && styles.modalTypeButtonActive]}
                onPress={() => setModalType("event")}
              >
                <Ionicons 
                  name="calendar" 
                  size={18} 
                  color={modalType === "event" ? "#06B6D4" : "#71717A"} 
                />
                <Text style={[
                  styles.modalTypeButtonText,
                  modalType === "event" && styles.modalTypeButtonTextActive
                ]}>
                  Event
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalTypeButton, modalType === "chore" && styles.modalTypeButtonActive]}
                onPress={() => setModalType("chore")}
              >
                <Ionicons 
                  name="checkbox" 
                  size={18} 
                  color={modalType === "chore" ? "#06B6D4" : "#71717A"} 
                />
                <Text style={[
                  styles.modalTypeButtonText,
                  modalType === "chore" && styles.modalTypeButtonTextActive
                ]}>
                  Chore
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {modalType === "event" ? (
                <>
                  {/* Event Form */}
                  {/* Title */}
                  <Text style={[styles.inputLabel, { marginTop: 0 }]}>Title *</Text>
                  <TextInput
                    style={styles.input}
                    value={eventForm.title}
                    onChangeText={(text) => setEventForm(prev => ({ ...prev, title: text }))}
                    placeholder="Event title"
                    placeholderTextColor="#71717A"
                  />

              {/* All Day Toggle */}
              <View style={styles.allDayContainer}>
                <Text style={styles.inputLabel}>All Day</Text>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    eventForm.allDay && styles.toggleActive,
                  ]}
                  onPress={() => setEventForm(prev => ({ ...prev, allDay: !prev.allDay }))}
                >
                  <View style={[
                    styles.toggleThumb,
                    eventForm.allDay && styles.toggleThumbActive,
                  ]} />
                </TouchableOpacity>
              </View>

              {/* Start Date/Time */}
              <Text style={styles.inputLabel}>Start {eventForm.allDay ? "Date" : "Date & Time"}</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#06B6D4" />
                <Text style={styles.dateTimeText}>
                  {formatDateTime(eventForm.startDate, eventForm.allDay)}
                </Text>
              </TouchableOpacity>
              {!eventForm.allDay && (
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Ionicons name="time" size={20} color="#06B6D4" />
                  <Text style={styles.dateTimeText}>
                    {eventForm.startDate.toLocaleTimeString("en-US", { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    })}
                  </Text>
                </TouchableOpacity>
              )}

              {/* End Date/Time */}
              <Text style={styles.inputLabel}>End {eventForm.allDay ? "Date" : "Date & Time"}</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#06B6D4" />
                <Text style={styles.dateTimeText}>
                  {formatDateTime(eventForm.endDate, eventForm.allDay)}
                </Text>
              </TouchableOpacity>
              {!eventForm.allDay && (
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Ionicons name="time" size={20} color="#06B6D4" />
                  <Text style={styles.dateTimeText}>
                    {eventForm.endDate.toLocaleTimeString("en-US", { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    })}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Category */}
              <Text style={styles.inputLabel}>Category</Text>
              {renderCategorySelector()}

              {/* Assigned To */}
              <Text style={styles.inputLabel}>Assign To (optional)</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.userChipsScroll}
                contentContainerStyle={styles.userChipsScrollContent}
              >
                <TouchableOpacity
                  style={[
                    styles.userChip,
                    !eventForm.assignedTo && styles.userChipSelected,
                  ]}
                  onPress={() => setEventForm(prev => ({ ...prev, assignedTo: "" }))}
                >
                  <View style={[styles.userChipAvatar, { backgroundColor: "#71717A" }]}>
                    <Ionicons name="person-outline" size={14} color="#FFF" />
                  </View>
                  <Text style={[
                    styles.userChipText,
                    !eventForm.assignedTo && styles.userChipTextSelected,
                  ]}>
                    Unassigned
                  </Text>
                </TouchableOpacity>
                {users.map((u) => (
                  <TouchableOpacity
                    key={u.$id}
                    style={[
                      styles.userChip,
                      eventForm.assignedTo === u.$id && styles.userChipSelected,
                    ]}
                    onPress={() => setEventForm(prev => ({ ...prev, assignedTo: u.$id }))}
                  >
                    <View style={[styles.userChipAvatar, { backgroundColor: u.color || "#10B981" }]}>
                      <Text style={styles.userChipAvatarText}>
                        {u.username?.[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[
                      styles.userChipText,
                      eventForm.assignedTo === u.$id && styles.userChipTextSelected,
                    ]}>
                      {u.username}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Description */}
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={eventForm.description}
                onChangeText={(text) => setEventForm(prev => ({ ...prev, description: text }))}
                placeholder="Add notes or details..."
                placeholderTextColor="#71717A"
                multiline
                numberOfLines={4}
              />

              {/* Delete Button (Edit Mode) */}
              {editingEvent && (
                <TouchableOpacity
                  style={styles.deleteEventButton}
                  onPress={() => {
                    closeModal();
                    handleDeleteEvent(editingEvent);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.deleteEventButtonText}>Delete Event</Text>
                </TouchableOpacity>
              )}
                </>
              ) : (
                <>
                  {/* Chore Form */}
                  {/* Title */}
                  <Text style={[styles.inputLabel, { marginTop: 0 }]}>Title *</Text>
                  <TextInput
                    style={styles.input}
                    value={choreForm.title}
                    onChangeText={(text) => setChoreForm(prev => ({ ...prev, title: text }))}
                    placeholder="Chore title"
                    placeholderTextColor="#71717A"
                  />

                  {/* Recurrence */}
                  <Text style={styles.inputLabel}>Recurrence</Text>
                  <View style={styles.recurrenceContainer}>
                    {["daily", "weekly", "monthly"].map((recurrence) => (
                      <TouchableOpacity
                        key={recurrence}
                        style={[
                          styles.recurrenceButton,
                          choreForm.recurrence === recurrence && styles.recurrenceButtonActive,
                        ]}
                        onPress={() => setChoreForm(prev => ({ ...prev, recurrence }))}
                      >
                        <Text style={[
                          styles.recurrenceButtonText,
                          choreForm.recurrence === recurrence && styles.recurrenceButtonTextActive,
                        ]}>
                          {recurrence.charAt(0).toUpperCase() + recurrence.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Delete Button (Edit Mode) */}
                  {editingChore && (
                    <TouchableOpacity
                      style={styles.deleteEventButton}
                      onPress={() => {
                        closeModal();
                        handleDeleteChore(editingChore);
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      <Text style={styles.deleteEventButtonText}>Delete Chore</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date/Time Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={eventForm.startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(Platform.OS === "ios");
            if (selectedDate) {
              const newDate = new Date(selectedDate);
              newDate.setHours(eventForm.startDate.getHours());
              newDate.setMinutes(eventForm.startDate.getMinutes());
              setEventForm(prev => ({ ...prev, startDate: newDate }));
              // Auto-update end date if it's before start date
              if (newDate > eventForm.endDate) {
                const newEndDate = new Date(newDate);
                newEndDate.setHours(eventForm.endDate.getHours());
                newEndDate.setMinutes(eventForm.endDate.getMinutes());
                setEventForm(prev => ({ ...prev, endDate: newEndDate }));
              }
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={eventForm.endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(Platform.OS === "ios");
            if (selectedDate) {
              const newDate = new Date(selectedDate);
              newDate.setHours(eventForm.endDate.getHours());
              newDate.setMinutes(eventForm.endDate.getMinutes());
              setEventForm(prev => ({ ...prev, endDate: newDate }));
            }
          }}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={eventForm.startDate}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowStartTimePicker(Platform.OS === "ios");
            if (selectedTime) {
              const newDate = new Date(eventForm.startDate);
              newDate.setHours(selectedTime.getHours());
              newDate.setMinutes(selectedTime.getMinutes());
              setEventForm(prev => ({ ...prev, startDate: newDate }));
            }
          }}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={eventForm.endDate}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowEndTimePicker(Platform.OS === "ios");
            if (selectedTime) {
              const newDate = new Date(eventForm.endDate);
              newDate.setHours(selectedTime.getHours());
              newDate.setMinutes(selectedTime.getMinutes());
              setEventForm(prev => ({ ...prev, endDate: newDate }));
            }
          }}
        />
      )}
    </View>
  );
};

// Placeholder views - will implement these next
const DailyView = ({ date, items }) => (
  <View style={styles.viewContainer}>
    <Text style={styles.placeholderText}>Daily View - Coming Soon</Text>
  </View>
);

const WeeklyView = ({ date, items }) => (
  <View style={styles.viewContainer}>
    <Text style={styles.placeholderText}>Weekly View - Coming Soon</Text>
  </View>
);

const MonthlyView = ({ date, items, onDayPress, onCreateEvent, onEditEvent, onDeleteEvent }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Get first day of month and number of days
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Adjust to Monday = 0
  const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
  
  // Get days from previous month to fill the grid
  const prevMonth = new Date(year, month - 1, 0);
  const daysFromPrevMonth = prevMonth.getDate();
  
  // Get days from next month to fill the grid
  const totalCells = Math.ceil((adjustedStartingDay + daysInMonth) / 7) * 7;
  const daysFromNextMonth = totalCells - (adjustedStartingDay + daysInMonth);
  
  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };
  
  const isCurrentMonth = (dayIndex) => {
    return dayIndex >= adjustedStartingDay && 
           dayIndex < adjustedStartingDay + daysInMonth;
  };
  
  const getDayNumber = (dayIndex) => {
    if (dayIndex < adjustedStartingDay) {
      // Previous month
      return daysFromPrevMonth - (adjustedStartingDay - dayIndex - 1);
    } else if (dayIndex < adjustedStartingDay + daysInMonth) {
      // Current month
      return dayIndex - adjustedStartingDay + 1;
    } else {
      // Next month
      return dayIndex - (adjustedStartingDay + daysInMonth) + 1;
    }
  };
  
  const getDateForDay = (dayIndex) => {
    const dayNumber = getDayNumber(dayIndex);
    if (dayIndex < adjustedStartingDay) {
      return new Date(year, month - 1, dayNumber);
    } else if (dayIndex < adjustedStartingDay + daysInMonth) {
      return new Date(year, month, dayNumber);
    } else {
      return new Date(year, month + 1, dayNumber);
    }
  };
  
  const getItemsForDay = (dayDate) => {
    if (!dayDate || !items || !Array.isArray(items)) return [];
    
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    return items.filter(item => {
      if (!item || !item.startDate || !item.endDate) return false;
      
      try {
        const itemStart = new Date(item.startDate);
        const itemEnd = new Date(item.endDate);
        
        // Validate dates
        if (isNaN(itemStart.getTime()) || isNaN(itemEnd.getTime())) {
          return false;
        }
        
        // Check if item overlaps with this day
        return (itemStart <= dayEnd && itemEnd >= dayStart);
      } catch (error) {
        console.warn("Error checking item overlap:", error, item);
        return false;
      }
    });
  };
  
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const renderDayCell = (dayIndex) => {
    const dayNumber = getDayNumber(dayIndex);
    const dayDate = getDateForDay(dayIndex);
    const dayItems = getItemsForDay(dayDate);
    const isCurrentMonthDay = isCurrentMonth(dayIndex);
    const isTodayDay = isCurrentMonthDay && isToday(dayNumber);
    const isSelected = selectedDate && 
      dayDate.getDate() === selectedDate.getDate() &&
      dayDate.getMonth() === selectedDate.getMonth() &&
      dayDate.getFullYear() === selectedDate.getFullYear();
    
    return (
      <TouchableOpacity
        key={dayIndex}
        style={[
          styles.dayCell,
          !isCurrentMonthDay && styles.dayCellOtherMonth,
          isTodayDay && styles.dayCellToday,
          isSelected && styles.dayCellSelected,
        ]}
        onPress={() => {
          setSelectedDate(dayDate);
          if (onDayPress) onDayPress(dayDate);
        }}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dayNumber,
            !isCurrentMonthDay && styles.dayNumberOtherMonth,
            isTodayDay && styles.dayNumberToday,
          ]}
        >
          {dayNumber}
        </Text>
        
        {/* Event indicators */}
        {dayItems.length > 0 && (
          <View style={styles.dayEvents}>
            {dayItems.slice(0, 3).map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.eventDot,
                  { backgroundColor: item.color },
                ]}
              />
            ))}
            {dayItems.length > 3 && (
              <Text style={styles.moreEventsText}>+{dayItems.length - 3}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  const renderWeek = (weekStartIndex) => {
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(renderDayCell(weekStartIndex + i));
    }
    return (
      <View key={weekStartIndex} style={styles.weekRow}>
        {weekDays}
      </View>
    );
  };
  
  const renderCalendarGrid = () => {
    const weeks = [];
    for (let i = 0; i < totalCells; i += 7) {
      weeks.push(renderWeek(i));
    }
    return weeks;
  };
  
  return (
    <View style={styles.monthlyContainer}>
      {/* Week day headers */}
      <View style={styles.weekHeader}>
        {weekDays.map((day, index) => (
          <View key={index} style={styles.weekDayHeader}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>
      
      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {renderCalendarGrid()}
      </View>
      
      {/* Selected day details */}
      {selectedDate && (
        <View style={styles.selectedDayDetails}>
          <View style={styles.selectedDayHeader}>
            <Text style={styles.selectedDayTitle}>
              {selectedDate.toLocaleDateString("en-US", { 
                weekday: "long", 
                month: "long", 
                day: "numeric" 
              })}
            </Text>
            <TouchableOpacity onPress={() => setSelectedDate(null)}>
              <Ionicons name="close" size={20} color="#71717A" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.selectedDayEvents} showsVerticalScrollIndicator={false}>
            {getItemsForDay(selectedDate).length === 0 ? (
              <View style={styles.noEventsContainer}>
                <Ionicons name="calendar-outline" size={32} color="#3F3F46" />
                <Text style={styles.noEventsText}>No events on this day</Text>
                {onCreateEvent && (
                  <TouchableOpacity 
                    style={styles.addEventButton}
                    onPress={() => onCreateEvent(selectedDate)}
                  >
                    <Ionicons name="add" size={16} color="#FFF" />
                    <Text style={styles.addEventButtonText}>Add Event</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              getItemsForDay(selectedDate).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.eventItem}
                  onPress={() => item.type === "event" && onEditEvent && onEditEvent(null, item.data)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.eventItemColor, { backgroundColor: item.color }]} />
                  <View style={styles.eventItemContent}>
                    <Text style={styles.eventItemTitle}>{item.title}</Text>
                    <Text style={styles.eventItemTime}>
                      {item.allDay 
                        ? "All day" 
                        : `${item.startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - ${item.endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
                      }
                    </Text>
                    {item.type === "task" && (
                      <View style={styles.taskBadge}>
                        <Ionicons name="checkbox" size={12} color="#06B6D4" />
                        <Text style={styles.taskBadgeText}>Task</Text>
                      </View>
                    )}
                    {item.type === "event" && onDeleteEvent && (
                      <TouchableOpacity
                        style={styles.eventDeleteButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          onDeleteEvent(item.data);
                        }}
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const AnnualView = ({ date, tasks, tasksDone }) => (
  <View style={styles.viewContainer}>
    <Text style={styles.placeholderText}>Annual View - Will use existing heatmap</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0A0C",
  },
  loadingText: {
    color: "#71717A",
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#111114",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A1F",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 4,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#06B6D4",
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
  },
  viewSwitcher: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#111114",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    gap: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#1A1A1F",
    alignItems: "center",
  },
  viewButtonActive: {
    backgroundColor: "#06B6D4",
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#71717A",
  },
  viewButtonTextActive: {
    color: "#FFF",
  },
  content: {
    flex: 1,
  },
  viewContainer: {
    flex: 1,
    padding: 16,
    minHeight: 400,
  },
  placeholderText: {
    color: "#71717A",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
  // Monthly View Styles
  monthlyContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 100, // Account for bottom navbar
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717A",
    textTransform: "uppercase",
  },
  calendarGrid: {
    marginBottom: 16,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: "#1A1A1F",
    borderRadius: 8,
    padding: 4,
    margin: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  dayCellOtherMonth: {
    backgroundColor: "#111114",
    opacity: 0.4,
  },
  dayCellToday: {
    borderColor: "#06B6D4",
    borderWidth: 2,
    backgroundColor: "#0E1F2A",
  },
  dayCellSelected: {
    borderColor: "#8B5CF6",
    borderWidth: 2,
    backgroundColor: "#1A0F2A",
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 2,
  },
  dayNumberOtherMonth: {
    color: "#3F3F46",
  },
  dayNumberToday: {
    color: "#06B6D4",
    fontWeight: "700",
  },
  dayEvents: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreEventsText: {
    fontSize: 9,
    color: "#71717A",
    marginLeft: 2,
  },
  selectedDayDetails: {
    backgroundColor: "#1A1A1F",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  selectedDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  selectedDayEvents: {
    maxHeight: 300,
  },
  noEventsContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  noEventsText: {
    fontSize: 14,
    color: "#71717A",
    marginTop: 8,
    marginBottom: 16,
  },
  addEventButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#06B6D4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addEventButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  eventItem: {
    flexDirection: "row",
    backgroundColor: "#111114",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  eventItemColor: {
    width: 3,
    borderRadius: 2,
    marginRight: 12,
  },
  eventItemContent: {
    flex: 1,
  },
  eventItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 4,
  },
  eventItemTime: {
    fontSize: 12,
    color: "#71717A",
  },
  taskBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#06B6D420",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    gap: 4,
  },
  taskBadgeText: {
    fontSize: 10,
    color: "#06B6D4",
    fontWeight: "500",
  },
  eventDeleteButton: {
    padding: 4,
    marginLeft: "auto",
  },
  // FAB
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#06B6D4",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#06B6D4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-start",
  },
  modalContent: {
    backgroundColor: "#111114",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "100%",
    minHeight: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#06B6D4",
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#71717A",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    padding: 14,
    color: "#FFF",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  allDayContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 8,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1A1A1F",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    padding: 2,
  },
  toggleActive: {
    backgroundColor: "#06B6D4",
    borderColor: "#06B6D4",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#71717A",
  },
  toggleThumbActive: {
    backgroundColor: "#FFF",
    marginLeft: "auto",
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 8,
    gap: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "500",
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#1A1A1F",
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
  userChipsScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  userChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1A1A1F",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginRight: 8,
    gap: 8,
  },
  userChipSelected: {
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderColor: "#06B6D4",
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
  deleteEventButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 12,
    padding: 14,
    marginTop: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    gap: 8,
  },
  deleteEventButtonText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
  // Modal Type Toggle
  modalTypeToggle: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  modalTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  modalTypeButtonActive: {
    backgroundColor: "#06B6D4",
  },
  modalTypeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#71717A",
  },
  modalTypeButtonTextActive: {
    color: "#FFF",
  },
  // Recurrence Buttons
  recurrenceContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  recurrenceButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1A1A1F",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  recurrenceButtonActive: {
    backgroundColor: "#06B6D4",
    borderColor: "#06B6D4",
  },
  recurrenceButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#71717A",
  },
  recurrenceButtonTextActive: {
    color: "#FFF",
  },
  // Chores List Styles
  choresListButton: {
    position: "absolute",
    right: 20,
    bottom: 170,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    elevation: 8,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  choresListButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  choresListOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-start",
  },
  choresListContent: {
    backgroundColor: "#111114",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "100%",
    minHeight: "100%",
  },
  choresListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  choresListTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  choresListContentContainer: {
    padding: 20,
  },
  choreListItem: {
    flexDirection: "row",
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  choreListItemContent: {
    flex: 1,
  },
  choreListItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  choreListItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    flex: 1,
  },
  choreStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  choreStatusEmoji: {
    fontSize: 12,
  },
  choreStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  choreListItemRecurrence: {
    fontSize: 13,
    color: "#71717A",
  },
  choreListItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 12,
  },
  choreListActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111114",
    alignItems: "center",
    justifyContent: "center",
  },
  choresListEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  choresListEmptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 16,
  },
  choresListEmptySubtext: {
    fontSize: 14,
    color: "#71717A",
    marginTop: 8,
  },
  choresListAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#06B6D4",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  choresListAddButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UnifiedCalendar;

