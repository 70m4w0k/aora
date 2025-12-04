import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import { useTranslation } from "../../hooks/useTranslation";
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
  createTaskDone,
  getTaskDoneByTaskId,
} from "../../lib/appwrite";
import { getWeekNumberByDate } from "../../lib/utils";
import { handleError, parseAppwriteError } from "../../lib/errorHandler";
import ErrorDisplay from "../ErrorDisplay";
import { CalendarSkeleton } from "../LoadingSkeleton";

const WEEKS_IN_YEAR = 52;

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
  const t = useTranslation();
  const [currentView, setCurrentView] = useState(VIEW_TYPES.MONTHLY);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tasksDone, setTasksDone] = useState([]);
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  
  // Chore edit modal state
  const [choreEditTab, setChoreEditTab] = useState("edit"); // "edit" or "history"
  const [choreCompletionHistory, setChoreCompletionHistory] = useState([]);

  useEffect(() => {
    if (household?.$id) {
      fetchData();
    }
  }, [fetchData]);

  const fetchData = useCallback(async () => {
    if (!household?.$id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculate date range based on current view
      const { startDate, endDate } = getDateRange(currentDate, currentView);
      
      // Fetch all data in parallel for better performance
      const [eventsData, tasksData, tasksDoneData, membersData] = await Promise.allSettled([
        // Fetch events for the date range
        getHouseholdEvents(household.$id, startDate, endDate).catch(err => {
          // Events collection might not exist yet, return empty array
          console.warn("Error fetching events (collection may not exist yet):", err);
          return [];
        }),
        // Fetch tasks (they're recurring, so we fetch all)
        getHouseholdTasks(household.$id).catch(err => {
          console.error("Error fetching tasks:", err);
          handleError(err, 'fetchTasks', false);
          return [];
        }),
        // Fetch tasks done
        getAllTasksDone().catch(err => {
          console.error("Error fetching tasks done:", err);
          handleError(err, 'fetchTasksDone', false);
          return [];
        }),
        // Fetch household members for event assignment
        getHouseholdMembers(household.$id).catch(err => {
          console.error("Error fetching household members:", err);
          handleError(err, 'fetchMembers', false);
          return [];
        }),
      ]);

      // Process results
      setEvents(eventsData.status === 'fulfilled' ? (eventsData.value || []) : []);
      setTasks(tasksData.status === 'fulfilled' ? (tasksData.value || []) : []);
      
      // Filter tasks done by household
      const allTasksDone = tasksDoneData.status === 'fulfilled' ? (tasksDoneData.value || []) : [];
      // Filter tasksDone by household - include ALL household members' tasks
      const householdTasksDone = allTasksDone.filter(td => {
        if (!td || !td.householdId) return false;
        const tdHouseholdId = typeof td.householdId === 'object' ? td.householdId?.$id : td.householdId;
        return tdHouseholdId === household.$id;
      });
      setTasksDone(householdTasksDone);
      
      // Set all household members (not just current user)
      const allMembers = membersData.status === 'fulfilled' ? (membersData.value || []) : [];
      setUsers(allMembers);
      
      // Debug: Log to verify we have all users and their tasks
      if (__DEV__) {
        console.log('Calendar data loaded:', {
          usersCount: allMembers.length,
          users: allMembers.map(u => ({ id: u.$id, username: u.username })),
          tasksDoneCount: householdTasksDone.length,
          tasksDoneByUser: householdTasksDone.reduce((acc, td) => {
            const userId = typeof td.userId === 'object' ? td.userId?.$id : td.userId;
            acc[userId] = (acc[userId] || 0) + 1;
            return acc;
          }, {}),
        });
      }

      // Check if any critical fetch failed
      const criticalFailures = [
        tasksData.status === 'rejected',
        membersData.status === 'rejected',
      ].filter(Boolean);

      if (criticalFailures.length > 0) {
        setError({
          message: 'Some data could not be loaded. Please try refreshing.',
          type: 'partial',
        });
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      setError({
        message: parseAppwriteError(error),
        type: 'full',
      });
      handleError(error, 'fetchCalendarData', false);
    } finally {
      setLoading(false);
    }
  }, [household?.$id, currentDate, currentView]);

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
    const locale = t("common.locale") || "en-US";
    const monthNames = {
      en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
    };
    const weekdayNames = {
      en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]
    };
    const monthNamesShort = {
      en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      fr: ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"]
    };
    const lang = locale.startsWith("fr") ? "fr" : "en";
    
    switch (currentView) {
      case VIEW_TYPES.DAILY:
        const weekday = weekdayNames[lang][currentDate.getDay()];
        const month = monthNames[lang][currentDate.getMonth()];
        return `${weekday}, ${month} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
      case VIEW_TYPES.WEEKLY:
        const weekStart = new Date(currentDate);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const startMonth = monthNamesShort[lang][weekStart.getMonth()];
        const endMonth = monthNamesShort[lang][weekEnd.getMonth()];
        const year = weekStart.getFullYear() !== weekEnd.getFullYear() ? ` ${weekEnd.getFullYear()}` : "";
        return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}${year}`;
      case VIEW_TYPES.MONTHLY:
        const monthName = monthNames[lang][currentDate.getMonth()];
        return `${monthName} ${currentDate.getFullYear()}`;
      case VIEW_TYPES.ANNUAL:
        return currentDate.getFullYear().toString();
      default:
        return "";
    }
  };

  // Combine events and tasks for display (memoized for performance)
  const getCombinedItems = useCallback(() => {
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
  }, [events, tasks, currentDate]);

  const renderViewSwitcher = () => {
    const viewLabels = {
      [VIEW_TYPES.DAILY]: t("calendar.daily"),
      [VIEW_TYPES.WEEKLY]: t("calendar.weekly"),
      [VIEW_TYPES.MONTHLY]: t("calendar.monthly"),
      [VIEW_TYPES.ANNUAL]: t("calendar.annual"),
    };
    
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
              {viewLabels[value]}
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
            <Text style={styles.todayButtonText}>{t("calendar.today")}</Text>
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

  const openModal = async (type = "event", date = null, item = null) => {
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
        setChoreEditTab("edit");
        setChoreForm({
          title: item.title || "",
          recurrence: item.recurrence || "weekly",
        });
        // Fetch completion history
        try {
          const history = await getTaskDoneByTaskId(item.$id);
          setChoreCompletionHistory(history || []);
        } catch (error) {
          console.error("Error fetching chore history:", error);
          setChoreCompletionHistory([]);
        }
      } else {
        // Create chore
        setEditingChore(null);
        setEditingEvent(null);
        setChoreEditTab("edit");
        setChoreCompletionHistory([]);
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
      Alert.alert(t("common.error"), t("calendar.enterEventTitle"));
      return;
    }

    if (!household?.$id || !user?.$id) {
      Alert.alert(t("common.error"), t("calendar.missingInfo"));
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
        Alert.alert(t("common.success"), t("calendar.eventUpdated"));
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
        Alert.alert(t("common.success"), t("calendar.eventCreated"));
      }

      await fetchData();
      closeModal();
    } catch (error) {
      console.error("Error saving event:", error);
      handleError(error, 'saveEvent', true);
    }
  };

  const handleSaveChore = async () => {
    if (!choreForm.title.trim()) {
      Alert.alert(t("common.error"), t("calendar.enterChoreTitle"));
      return;
    }

    if (!household?.$id) {
      Alert.alert(t("common.error"), t("calendar.missingHouseholdInfo"));
      return;
    }

    try {
      if (editingChore) {
        // Update existing chore
        await updateTask(editingChore.$id, {
          title: choreForm.title.trim(),
          recurrence: choreForm.recurrence,
        });
        Alert.alert(t("common.success"), t("calendar.choreUpdated"));
      } else {
        // Create new chore
        await createTask({
          title: choreForm.title.trim(),
          recurrence: choreForm.recurrence,
          householdId: household.$id,
        });
        Alert.alert(t("common.success"), t("calendar.choreCreated"));
      }

      await fetchData();
      closeModal();
    } catch (error) {
      console.error("Error saving chore:", error);
      handleError(error, 'saveChore', true);
    }
  };

  const handleDeleteEvent = (event) => {
    Alert.alert(
      t("calendar.deleteEvent"),
      t("calendar.deleteEventConfirm").replace("{{title}}", event.title),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEvent(event.$id);
              Alert.alert(t("common.success"), t("calendar.eventDeleted"));
              await fetchData();
            } catch (error) {
              handleError(error, 'deleteEvent', true);
            }
          },
        },
      ]
    );
  };

  const handleDeleteChore = (chore) => {
    Alert.alert(
      t("calendar.deleteChore"),
      t("calendar.deleteChoreConfirm").replace("{{title}}", chore.title),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTask(chore.$id);
              Alert.alert(t("common.success"), t("calendar.choreDeleted"));
              await fetchData();
            } catch (error) {
              Alert.alert(t("common.error"), t("calendar.couldNotDeleteChore"));
            }
          },
        },
      ]
    );
  };

  const handleCompleteChore = async () => {
    if (!editingChore || !user?.$id || !household?.$id) {
      Alert.alert(t("common.error"), t("calendar.missingInfo"));
      return;
    }

    try {
      const now = new Date();
      const weekNumber = getWeekNumberByDate(now);
      
      await createTaskDone({
        taskId: editingChore.$id,
        userId: user.$id,
        householdId: household.$id,
        weekNumber: weekNumber,
      });
      
      // Close modal first
      closeModal();
      
      // Refresh data in background
      await fetchData();
    } catch (error) {
      console.error("Error completing chore:", error);
      Alert.alert(t("common.error"), t("calendar.couldNotCompleteChore") + (error.message || ""));
    }
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
      return { color: "#EF4444", emoji: "🔴", text: t("calendar.neverCompleted") };
    }
    
    const recurrenceDays = {
      daily: 1,
      weekly: 7,
      monthly: 30,
    };
    
    const expectedDays = recurrenceDays[chore.recurrence] || 7;
    const ratio = daysSince / expectedDays;
    
    const daysAgoText = daysSince === 1 
      ? t("calendar.daysAgo").replace("{{days}}", daysSince)
      : t("calendar.daysAgoPlural").replace("{{days}}", daysSince);
    
    if (ratio < 0.8) {
      // Green: less than 80% of expected time
      return { color: "#22C55E", emoji: "🟢", text: daysAgoText };
    } else if (ratio <= 1.2) {
      // Orange: 80-120% of expected time
      return { color: "#F59E0B", emoji: "🟠", text: daysAgoText };
    } else {
      // Red: more than 120% of expected time
      return { color: "#EF4444", emoji: "🔴", text: daysAgoText };
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
    switch (currentView) {
      case VIEW_TYPES.DAILY:
        return (
          <DailyView 
            date={currentDate} 
            items={combinedItems}
            tasks={tasks}
            tasksDone={tasksDone}
            users={users}
            onDayPress={handleDayPress}
            onCreateEvent={(date) => openModal("event", date)}
            onEditEvent={(date, event) => openModal("event", date, event)}
            onDeleteEvent={handleDeleteEvent}
          />
        );
      case VIEW_TYPES.WEEKLY:
        return (
          <WeeklyView 
            date={currentDate} 
            items={combinedItems}
            tasks={tasks}
            tasksDone={tasksDone}
            users={users}
            onDayPress={handleDayPress}
            onCreateEvent={(date) => openModal("event", date)}
            onEditEvent={(date, event) => openModal("event", date, event)}
            onDeleteEvent={handleDeleteEvent}
          />
        );
      case VIEW_TYPES.MONTHLY:
        return (
          <MonthlyView 
            date={currentDate} 
            items={combinedItems}
            tasks={tasks}
            tasksDone={tasksDone}
            users={users}
            onDayPress={handleDayPress}
            onCreateEvent={(date) => openModal("event", date)}
            onEditEvent={(date, event) => openModal("event", date, event)}
            onDeleteEvent={handleDeleteEvent}
          />
        );
      case VIEW_TYPES.ANNUAL:
        return <AnnualView date={currentDate} tasks={tasks} tasksDone={tasksDone} users={users} />;
      default:
        return null;
    }
  };

  // Memoize combined items to avoid recalculation on every render
  const combinedItems = useMemo(() => {
    return getCombinedItems();
  }, [getCombinedItems]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <CalendarSkeleton />
      </View>
    );
  }

  if (error && error.type === 'full' && !loading) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={fetchData}
        title="Failed to load calendar"
      />
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderViewSwitcher()}
      
      {/* Show partial error banner if there's a partial error */}
      {error && error.type === 'partial' && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color="#F59E0B" />
          <Text style={styles.errorBannerText}>{error.message}</Text>
          <TouchableOpacity onPress={fetchData} style={styles.errorBannerButton}>
            <Ionicons name="refresh" size={16} color="#F59E0B" />
          </TouchableOpacity>
        </View>
      )}
      
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
              <Text style={styles.choresListTitle}>{t("calendar.allChores")}</Text>
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
                  <TouchableOpacity
                    style={styles.choreListItem}
                    onPress={() => {
                      setShowChoresList(false);
                      openModal("chore", null, item);
                    }}
                    activeOpacity={0.7}
                  >
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
                        {t("calendar.recurrence")}: {t(`calendar.${item.recurrence}`)}
                      </Text>
                    </View>
                    <View style={styles.choreListItemActions}>
                      <TouchableOpacity
                        style={styles.choreListActionButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteChore(item);
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.choresListEmpty}>
                  <Ionicons name="checkbox-outline" size={64} color="#3F3F46" />
                  <Text style={styles.choresListEmptyText}>{t("calendar.noChoresYet")}</Text>
                  <Text style={styles.choresListEmptySubtext}>{t("calendar.createFirstChore")}</Text>
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
              <Text style={styles.choresListAddButtonText}>{t("calendar.addChore")}</Text>
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
                  ? (editingEvent ? t("calendar.editEvent") : t("calendar.addEvent"))
                  : (editingChore ? t("calendar.editChore") : t("calendar.addChore"))
                }
              </Text>
              <TouchableOpacity onPress={modalType === "event" ? handleSaveEvent : handleSaveChore}>
                <Text style={styles.modalSaveText}>
                  {modalType === "event" 
                    ? (editingEvent ? t("common.save") : t("common.save"))
                    : (editingChore ? t("common.save") : t("common.save"))
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
                  {t("calendar.event")}
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
                  {t("calendar.chore")}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {modalType === "event" ? (
                <>
                  {/* Event Form */}
                  {/* Title */}
                  <Text style={[styles.inputLabel, { marginTop: 0 }]}>{t("calendar.title")} *</Text>
                  <TextInput
                    style={styles.input}
                    value={eventForm.title}
                    onChangeText={(text) => setEventForm(prev => ({ ...prev, title: text }))}
                    placeholder={t("calendar.eventTitlePlaceholder")}
                    placeholderTextColor="#71717A"
                  />

              {/* All Day Toggle */}
              <View style={styles.allDayContainer}>
                <Text style={styles.inputLabel}>{t("calendar.allDay")}</Text>
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
              <Text style={styles.inputLabel}>{t("calendar.start")} {eventForm.allDay ? t("calendar.date") : t("calendar.dateTime")}</Text>
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
              <Text style={styles.inputLabel}>{t("calendar.end")} {eventForm.allDay ? t("calendar.date") : t("calendar.dateTime")}</Text>
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
              <Text style={styles.inputLabel}>{t("calendar.category")}</Text>
              {renderCategorySelector()}

              {/* Assigned To */}
              <Text style={styles.inputLabel}>{t("calendar.assignToOptional")}</Text>
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
                    {t("calendar.unassigned")}
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
              <Text style={styles.inputLabel}>{t("calendar.descriptionOptional")}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={eventForm.description}
                onChangeText={(text) => setEventForm(prev => ({ ...prev, description: text }))}
                placeholder={t("calendar.descriptionPlaceholder")}
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
                  <Text style={styles.deleteEventButtonText}>{t("calendar.deleteEvent")}</Text>
                </TouchableOpacity>
              )}
                </>
              ) : (
                <>
                  {/* Chore Form */}
                  {editingChore && (
                    <>
                      {/* Tab Switcher */}
                      <View style={styles.choreEditTabs}>
                        <TouchableOpacity
                          style={[
                            styles.choreEditTab,
                            choreEditTab === "edit" && styles.choreEditTabActive,
                          ]}
                          onPress={() => setChoreEditTab("edit")}
                        >
                          <Ionicons 
                            name="create-outline" 
                            size={16} 
                            color={choreEditTab === "edit" ? "#06B6D4" : "#71717A"} 
                          />
                          <Text style={[
                            styles.choreEditTabText,
                            choreEditTab === "edit" && styles.choreEditTabTextActive,
                          ]}>
                            {t("common.edit")}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.choreEditTab,
                            choreEditTab === "history" && styles.choreEditTabActive,
                          ]}
                          onPress={() => setChoreEditTab("history")}
                        >
                          <Ionicons 
                            name="time-outline" 
                            size={16} 
                            color={choreEditTab === "history" ? "#06B6D4" : "#71717A"} 
                          />
                          <Text style={[
                            styles.choreEditTabText,
                            choreEditTab === "history" && styles.choreEditTabTextActive,
                          ]}>
                            {t("calendar.history")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {choreEditTab === "edit" ? (
                    <>
                      {/* Title */}
                      <Text style={[styles.inputLabel, { marginTop: 0 }]}>{t("calendar.title")} *</Text>
                      <TextInput
                        style={styles.input}
                        value={choreForm.title}
                        onChangeText={(text) => setChoreForm(prev => ({ ...prev, title: text }))}
                        placeholder={t("calendar.choreTitlePlaceholder")}
                        placeholderTextColor="#71717A"
                      />

                      {/* Recurrence */}
                      <Text style={styles.inputLabel}>{t("calendar.recurrence")}</Text>
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

                      {/* Complete Task Button */}
                      {editingChore && (
                        <TouchableOpacity
                          style={styles.completeChoreButton}
                          onPress={handleCompleteChore}
                        >
                          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                          <Text style={styles.completeChoreButtonText}>{t("calendar.completeTask")}</Text>
                        </TouchableOpacity>
                      )}

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
                          <Text style={styles.deleteEventButtonText}>{t("calendar.deleteChore")}</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <>
                      {choreCompletionHistory.length > 0 ? (
                        choreCompletionHistory.map((item) => {
                          const completionDate = new Date(item.$createdAt);
                          const user = users.find(u => {
                            const itemUserId = typeof item.userId === 'object' ? item.userId?.$id : item.userId;
                            return u.$id === itemUserId;
                          });
                          
                          return (
                            <View key={item.$id} style={styles.choreHistoryItem}>
                              <View style={[
                                styles.choreHistoryAvatar,
                                { backgroundColor: user?.color || "#06B6D4" }
                              ]}>
                                <Text style={styles.choreHistoryAvatarText}>
                                  {user?.username?.[0]?.toUpperCase() || "?"}
                                </Text>
                              </View>
                              <View style={styles.choreHistoryContent}>
                                <Text style={styles.choreHistoryUser}>
                                  {user?.username || "Unknown"} completed this task
                                </Text>
                                <Text style={styles.choreHistoryDate}>
                                  {completionDate.toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Text>
                              </View>
                            </View>
                          );
                        })
                      ) : (
                        <View style={styles.choreHistoryEmpty}>
                          <Ionicons name="time-outline" size={48} color="#3F3F46" />
                          <Text style={styles.choreHistoryEmptyText}>{t("calendar.noCompletionHistory")}</Text>
                          <Text style={styles.choreHistoryEmptySubtext}>
                            {t("calendar.completeTaskToSeeHistory")}
                          </Text>
                        </View>
                      )}
                    </>
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

const DailyView = ({ date, items, tasks, tasksDone, users, onDayPress, onCreateEvent, onEditEvent, onDeleteEvent }) => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  
  const today = new Date();
  const isToday = date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();
  
  // Generate time slots (24 hours, every hour)
  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    timeSlots.push(hour);
  }
  
  // Get items for the selected day
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
        
        if (isNaN(itemStart.getTime()) || isNaN(itemEnd.getTime())) {
          return false;
        }
        
        return (itemStart <= dayEnd && itemEnd >= dayStart);
      } catch (error) {
        return false;
      }
    });
  };
  
  // Get completed tasks for the selected day
  const getCompletedTasksForDay = (dayDate) => {
    if (!dayDate || !tasksDone || !tasks || !Array.isArray(tasksDone)) return [];
    
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    return tasksDone
      .filter(td => {
        if (!td || !td.$createdAt) return false;
        const completionDate = new Date(td.$createdAt);
        return completionDate >= dayStart && completionDate <= dayEnd;
      })
      .map(td => {
        const taskId = typeof td.taskId === 'object' ? td.taskId?.$id : td.taskId;
        const task = tasks.find(t => t.$id === taskId);
        
        if (!task) return null;
        
        const userId = typeof td.userId === 'object' ? td.userId?.$id : td.userId;
        const user = users?.find(u => u.$id === userId);
        
        return {
          id: td.$id,
          type: "completed_task",
          task: task,
          completedBy: user,
          completedAt: new Date(td.$createdAt),
          data: td,
        };
      })
      .filter(item => item !== null);
  };
  
  const dayEvents = getItemsForDay(date).filter(item => item.type === "event");
  const completedTasks = getCompletedTasksForDay(date);
  const allDayEvents = dayEvents.filter(item => item.allDay);
  const timedEvents = dayEvents.filter(item => !item.allDay);
  
  // Get events for a specific hour
  const getEventsForHour = (hour) => {
    return timedEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return eventStart.getHours() <= hour && eventEnd.getHours() >= hour;
    });
  };
  
  // Format time for display
  const formatTime = (hour) => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };
  
  // Get current hour for highlighting
  const currentHour = isToday ? today.getHours() : null;
  
  return (
    <View style={styles.dailyContainer}>
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <View style={styles.allDaySection}>
          <View style={styles.allDayHeader}>
            <Ionicons name="time-outline" size={16} color="#71717A" />
            <Text style={styles.allDayHeaderText}>{t("calendar.allDay")}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.allDayEvents}>
            {allDayEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[styles.allDayEventCard, { borderLeftColor: event.color }]}
                onPress={() => onEditEvent && onEditEvent(null, event.data)}
                activeOpacity={0.7}
              >
                <Text style={styles.allDayEventTitle} numberOfLines={1}>{event.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Completed tasks section */}
      {completedTasks.length > 0 && (
        <View style={styles.completedTasksSection}>
          <View style={styles.completedTasksHeader}>
            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
            <Text style={styles.completedTasksHeaderText}>{t("calendar.completedTasks")}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.completedTasksList}>
            {completedTasks.map((item) => (
              <View key={item.id} style={styles.completedTaskChip}>
                <Text style={styles.completedTaskChipText}>{item.task.title}</Text>
                <Text style={styles.completedTaskChipUser}>
                  {t("calendar.by")} {item.completedBy?.username || t("calendar.unknown")}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Time slots */}
      <ScrollView 
        style={styles.timeSlotsContainer}
        contentContainerStyle={styles.timeSlotsContent}
        showsVerticalScrollIndicator={true}
      >
        {timeSlots.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          const isCurrentHour = currentHour === hour;
          const isPast = currentHour !== null && hour < currentHour;
          
          return (
            <View 
              key={hour} 
              style={[
                styles.timeSlotRow,
                isCurrentHour && styles.timeSlotRowCurrent,
                isPast && styles.timeSlotRowPast,
              ]}
            >
              {/* Time label */}
              <View style={styles.timeLabel}>
                <Text style={[
                  styles.timeLabelText,
                  isCurrentHour && styles.timeLabelTextCurrent,
                ]}>
                  {formatTime(hour)}
                </Text>
              </View>
              
              {/* Time slot content */}
              <View style={styles.timeSlotContent}>
                {/* Hour line */}
                <View style={[
                  styles.hourLine,
                  isCurrentHour && styles.hourLineCurrent,
                ]} />
                
                {/* Events in this hour */}
                {hourEvents.length > 0 && (
                  <View style={styles.hourEvents}>
                    {hourEvents.map((event) => {
                      const eventStart = new Date(event.startDate);
                      const eventEnd = new Date(event.endDate);
                      const startMinute = eventStart.getMinutes();
                      const duration = (eventEnd - eventStart) / (1000 * 60); // Duration in minutes
                      const height = Math.max(40, (duration / 60) * 60); // Minimum 40px, scale by duration
                      
                      return (
                        <TouchableOpacity
                          key={event.id}
                          style={[
                            styles.timedEventCard,
                            {
                              backgroundColor: event.color + "20",
                              borderLeftColor: event.color,
                              height: height,
                              marginTop: startMinute > 0 ? (startMinute / 60) * 60 : 0,
                            },
                          ]}
                          onPress={() => onEditEvent && onEditEvent(null, event.data)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.timedEventTitle} numberOfLines={1}>
                            {event.title}
                          </Text>
                          <Text style={styles.timedEventTime}>
                            {eventStart.toLocaleTimeString("en-US", { 
                              hour: "2-digit", 
                              minute: "2-digit" 
                            })} - {eventEnd.toLocaleTimeString("en-US", { 
                              hour: "2-digit", 
                              minute: "2-digit" 
                            })}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                
                {/* Add event button for empty slots */}
                {hourEvents.length === 0 && (
                  <TouchableOpacity
                    style={styles.addEventSlotButton}
                    onPress={() => {
                      const newDate = new Date(date);
                      newDate.setHours(hour, 0, 0, 0);
                      onCreateEvent && onCreateEvent(newDate);
                    }}
                    activeOpacity={0.5}
                  >
                    <View style={styles.addEventSlotDot} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const WeeklyView = ({ date, items, tasks, tasksDone, users, onDayPress, onCreateEvent, onEditEvent, onDeleteEvent }) => {
  const [expandedDays, setExpandedDays] = useState({});
  
  // Get start of week (Monday)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  
  const weekStart = getWeekStart(date);
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    weekDays.push(day);
  }
  
  const today = new Date();
  const isToday = (dayDate) => {
    return dayDate.getDate() === today.getDate() &&
           dayDate.getMonth() === today.getMonth() &&
           dayDate.getFullYear() === today.getFullYear();
  };
  
  const getDayKey = (dayDate) => {
    return `${dayDate.getFullYear()}-${dayDate.getMonth()}-${dayDate.getDate()}`;
  };
  
  const toggleDay = (dayDate) => {
    const key = getDayKey(dayDate);
    setExpandedDays(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  
  // Get items for a specific day
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
        
        if (isNaN(itemStart.getTime()) || isNaN(itemEnd.getTime())) {
          return false;
        }
        
        return (itemStart <= dayEnd && itemEnd >= dayStart);
      } catch (error) {
        return false;
      }
    });
  };
  
  // Get completed tasks for a specific day
  const getCompletedTasksForDay = (dayDate) => {
    if (!dayDate || !tasksDone || !tasks || !Array.isArray(tasksDone)) return [];
    
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    return tasksDone
      .filter(td => {
        if (!td || !td.$createdAt) return false;
        const completionDate = new Date(td.$createdAt);
        return completionDate >= dayStart && completionDate <= dayEnd;
      })
      .map(td => {
        const taskId = typeof td.taskId === 'object' ? td.taskId?.$id : td.taskId;
        const task = tasks.find(t => t.$id === taskId);
        
        if (!task) return null;
        
        const userId = typeof td.userId === 'object' ? td.userId?.$id : td.userId;
        const user = users?.find(u => u.$id === userId);
        
        return {
          id: td.$id,
          type: "completed_task",
          task: task,
          completedBy: user,
          completedAt: new Date(td.$createdAt),
          data: td,
        };
      })
      .filter(item => item !== null);
  };
  
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  return (
    <ScrollView 
      style={styles.weeklyContainer}
      contentContainerStyle={styles.weeklyContent}
      showsVerticalScrollIndicator={true}
    >
      {weekDays.map((dayDate, dayIndex) => {
        const dayEvents = getItemsForDay(dayDate).filter(item => item.type === "event");
        const completedTasks = getCompletedTasksForDay(dayDate);
        const allItems = [...dayEvents, ...completedTasks];
        const todayDay = isToday(dayDate);
        const dayKey = getDayKey(dayDate);
        const isExpanded = expandedDays[dayKey];
        
        // Sort items by time (all-day first, then by start time)
        const sortedItems = [...allItems].sort((a, b) => {
          if (a.type === "completed_task") return 1;
          if (b.type === "completed_task") return -1;
          if (a.allDay && !b.allDay) return -1;
          if (!a.allDay && b.allDay) return 1;
          if (a.allDay && b.allDay) return 0;
          return new Date(a.startDate) - new Date(b.startDate);
        });
        
        return (
          <View 
            key={dayIndex} 
            style={[
              styles.weeklyDayCard,
              todayDay && styles.weeklyDayCardToday,
            ]}
          >
            {/* Day Header */}
            <TouchableOpacity
              style={styles.weeklyDayCardHeader}
              onPress={() => toggleDay(dayDate)}
              activeOpacity={0.7}
            >
              <View style={styles.weeklyDayCardHeaderLeft}>
                <View style={styles.weeklyDayCardDate}>
                  <Text style={styles.weeklyDayCardDayName}>{dayNames[dayIndex]}</Text>
                  <Text style={[
                    styles.weeklyDayCardDateNumber,
                    todayDay && styles.weeklyDayCardDateNumberToday,
                  ]}>
                    {dayDate.getDate()}
                  </Text>
                </View>
                <View style={styles.weeklyDayCardMonth}>
                  <Text style={styles.weeklyDayCardMonthText}>
                    {dayDate.toLocaleDateString("en-US", { month: "short" })}
                  </Text>
                </View>
              </View>
              
              <View style={styles.weeklyDayCardHeaderRight}>
                {allItems.length > 0 && (
                  <View style={styles.weeklyDayCardBadge}>
                    <Text style={styles.weeklyDayCardBadgeText}>
                      {allItems.length} {allItems.length === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                )}
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#71717A" 
                />
              </View>
            </TouchableOpacity>
            
            {/* Day Content - Expanded */}
            {isExpanded && (
              <View style={styles.weeklyDayCardContent}>
                {sortedItems.length === 0 ? (
                  <View style={styles.weeklyDayCardEmpty}>
                    <Ionicons name="calendar-outline" size={32} color="#3F3F46" />
                    <Text style={styles.weeklyDayCardEmptyText}>No events on this day</Text>
                    {onCreateEvent && (
                      <TouchableOpacity 
                        style={styles.addEventButton}
                        onPress={() => onCreateEvent(dayDate)}
                      >
                        <Ionicons name="add" size={16} color="#FFF" />
                        <Text style={styles.addEventButtonText}>{t("calendar.addEvent")}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={styles.weeklyDayCardItems}>
                    {sortedItems.map((item) => {
                      if (item.type === "completed_task") {
                        return (
                          <View key={item.id} style={styles.completedTaskItem}>
                            <View style={[styles.completedTaskColor, { backgroundColor: "#06B6D4" }]} />
                            <View style={styles.completedTaskContent}>
                              <Text style={styles.completedTaskTitle}>{item.task.title}</Text>
                              <Text style={styles.completedTaskRecurrence}>
                                {item.task.recurrence.charAt(0).toUpperCase() + item.task.recurrence.slice(1)}
                              </Text>
                              <View style={styles.completedTaskUser}>
                                <Ionicons 
                                  name="checkmark-circle" 
                                  size={14} 
                                  color={item.completedBy?.color || "#22C55E"} 
                                />
                                <Text style={styles.completedTaskUserText}>
                                  {t("calendar.completedBy")} {item.completedBy?.username || t("calendar.unknown")}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      } else {
                        return (
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
                        );
                      }
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const MonthlyView = ({ date, items, tasks, tasksDone, users, onDayPress, onCreateEvent, onEditEvent, onDeleteEvent }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Get completed tasks for a specific day
  const getCompletedTasksForDay = (dayDate) => {
    if (!dayDate || !tasksDone || !tasks || !Array.isArray(tasksDone)) return [];
    
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    return tasksDone
      .filter(td => {
        if (!td || !td.$createdAt) return false;
        const completionDate = new Date(td.$createdAt);
        return completionDate >= dayStart && completionDate <= dayEnd;
      })
      .map(td => {
        // Find the task for this completion
        const taskId = typeof td.taskId === 'object' ? td.taskId?.$id : td.taskId;
        const task = tasks.find(t => t.$id === taskId);
        
        if (!task) return null;
        
        // Find the user who completed it
        const userId = typeof td.userId === 'object' ? td.userId?.$id : td.userId;
        const user = users?.find(u => u.$id === userId);
        
        return {
          id: td.$id,
          type: "completed_task",
          task: task,
          completedBy: user,
          completedAt: new Date(td.$createdAt),
          data: td,
        };
      })
      .filter(item => item !== null);
  };
  
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
  
  const t = useTranslation();
  const weekDays = t("calendar.weekDays").split(",").map(d => d.trim());
  
  const renderDayCell = (dayIndex) => {
    const dayNumber = getDayNumber(dayIndex);
    const dayDate = getDateForDay(dayIndex);
    // Get events and completed tasks for this day (exclude recurring tasks)
    const dayEvents = getItemsForDay(dayDate).filter(item => item.type === "event");
    const completedTasks = getCompletedTasksForDay(dayDate);
    const dayItems = [...dayEvents, ...completedTasks];
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
            {dayItems.slice(0, 3).map((item, idx) => {
              // Determine dot color: use user's color for completed tasks, event color for events
              let dotColor = "#71717A"; // default
              if (item.type === "completed_task") {
                dotColor = item.completedBy?.color || "#06B6D4";
              } else if (item.color) {
                dotColor = item.color;
              }
              
              return (
                <View
                  key={item.id}
                  style={[
                    styles.eventDot,
                    { backgroundColor: dotColor },
                  ]}
                />
              );
            })}
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
              {(() => {
                const locale = t("common.locale") || "en-US";
                const weekdayNames = {
                  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                  fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]
                };
                const monthNames = {
                  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
                };
                const lang = locale.startsWith("fr") ? "fr" : "en";
                const weekday = weekdayNames[lang][selectedDate.getDay()];
                const month = monthNames[lang][selectedDate.getMonth()];
                return `${weekday}, ${month} ${selectedDate.getDate()}`;
              })()}
            </Text>
            <TouchableOpacity onPress={() => setSelectedDate(null)}>
              <Ionicons name="close" size={20} color="#71717A" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.selectedDayEvents} 
            contentContainerStyle={styles.selectedDayEventsContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {(() => {
              const dayEvents = getItemsForDay(selectedDate).filter(item => item.type === "event");
              const completedTasks = getCompletedTasksForDay(selectedDate);
              const allItems = [...dayEvents, ...completedTasks];
              
              if (allItems.length === 0) {
                return (
                  <View style={styles.noEventsContainer}>
                    <Ionicons name="calendar-outline" size={32} color="#3F3F46" />
                    <Text style={styles.noEventsText}>{t("calendar.noEventsThisDay")}</Text>
                    {onCreateEvent && (
                      <TouchableOpacity 
                        style={styles.addEventButton}
                        onPress={() => onCreateEvent(selectedDate)}
                      >
                        <Ionicons name="add" size={16} color="#FFF" />
                        <Text style={styles.addEventButtonText}>{t("calendar.addEvent")}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }
              
              return allItems.map((item) => {
                if (item.type === "completed_task") {
                  return (
                    <View key={item.id} style={styles.completedTaskItem}>
                      <View style={[styles.completedTaskColor, { backgroundColor: "#06B6D4" }]} />
                      <View style={styles.completedTaskContent}>
                        <Text style={styles.completedTaskTitle}>{item.task.title}</Text>
                        <Text style={styles.completedTaskRecurrence}>
                          {item.task.recurrence.charAt(0).toUpperCase() + item.task.recurrence.slice(1)}
                        </Text>
                        <View style={styles.completedTaskUser}>
                          <Ionicons 
                            name="checkmark-circle" 
                            size={14} 
                            color={item.completedBy?.color || "#22C55E"} 
                          />
                          <Text style={styles.completedTaskUserText}>
                            {t("calendar.completedBy")} {item.completedBy?.username || t("calendar.unknown")}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                } else {
                  // Regular event
                  return (
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
                  );
                }
              });
            })()}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const AnnualView = ({ date, tasks, tasksDone, users }) => {
  const t = useTranslation();
  const heatmapScrollRef = useRef(null);
  const currentWeekNumber = getWeekNumberByDate(new Date());
  
  useEffect(() => {
    // Auto-scroll to current week when view loads
    if (heatmapScrollRef.current) {
      const CELL_WIDTH = 25; // 22 cell + 3 gap
      const targetX = Math.max(0, (currentWeekNumber - 8) * CELL_WIDTH);
      setTimeout(() => {
        heatmapScrollRef.current?.scrollTo({ x: targetX, animated: true });
      }, 300);
    }
  }, [currentWeekNumber]);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const CELL_SIZE = 22;
  const CELL_GAP = 3;
  const ROW_GAP = 6;
  const LABEL_WIDTH = 80;
  
  // Month positions (approximate week for each month start)
  const monthPositions = [0, 4, 8, 13, 17, 22, 26, 30, 35, 39, 44, 48];
  
  // User colors fallback
  const userColors = [
    "#8B5CF6", // Purple
    "#06B6D4", // Cyan
    "#F59E0B", // Amber
    "#10B981", // Emerald
    "#F43F5E", // Rose
    "#3B82F6", // Blue
  ];
  
  // Calculate weekly activity per user - show ALL household members
  const userWeeklyActivity = (users || []).map((u, index) => {
    const weeks = Array(WEEKS_IN_YEAR).fill(0);
    const color = u.color || userColors[index % userColors.length];
    
    // Count tasks done by this user
    (tasksDone || []).forEach(td => {
      const tdUserId = typeof td.userId === 'object' ? td.userId?.$id : td.userId;
      // Match user ID and check weekNumber
      if (tdUserId === u.$id) {
        // If weekNumber exists, use it; otherwise calculate from $createdAt
        let weekNum = td.weekNumber;
        if (!weekNum && td.$createdAt) {
          const completionDate = new Date(td.$createdAt);
          weekNum = getWeekNumberByDate(completionDate);
        }
        if (weekNum >= 1 && weekNum <= WEEKS_IN_YEAR) {
          weeks[weekNum - 1]++;
        }
      }
    });
    
    return {
      id: u.$id,
      username: u.username,
      color,
      weeks,
      total: weeks.reduce((sum, w) => sum + w, 0),
    };
  }); // Show ALL household members, regardless of activity
  
  // Calculate household total weekly activity (all users combined)
  const weeklyActivity = Array(WEEKS_IN_YEAR).fill(0);
  (tasksDone || []).forEach(td => {
    // Use weekNumber if available, otherwise calculate from $createdAt
    let weekNum = td.weekNumber;
    if (!weekNum && td.$createdAt) {
      const completionDate = new Date(td.$createdAt);
      weekNum = getWeekNumberByDate(completionDate);
    }
    if (weekNum >= 1 && weekNum <= WEEKS_IN_YEAR) {
      weeklyActivity[weekNum - 1]++;
    }
  });
  
  // Get cell color based on count and user color
  const getCellColor = (count, userColor) => {
    if (count === 0) return "#1E1E24"; // Dark empty cell (visible against background)
    const opacity = Math.min(0.3 + (count * 0.2), 1); // 0.3 to 1.0 based on count
    return userColor + Math.round(opacity * 255).toString(16).padStart(2, '0');
  };
  
  return (
    <ScrollView 
      style={styles.annualContainer} 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={styles.annualContent}
    >
      <Text style={styles.annualTitle}>📊 {t("calendar.yearlyActivity")}</Text>
      <Text style={styles.annualSubtitle}>{t("calendar.yearlyActivitySubtitle")}</Text>

      {/* Stacked Heatmap Grid */}
      <View style={styles.stackedHeatmapCard}>
        <ScrollView 
          ref={heatmapScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          <View>
            {/* Month labels row */}
            <View style={[styles.heatmapRow, { marginLeft: LABEL_WIDTH, marginBottom: 8 }]}>
              {months.map((month, i) => (
                <Text 
                  key={month} 
                  style={[
                    styles.stackedMonthLabel, 
                    { left: monthPositions[i] * (CELL_SIZE + CELL_GAP), position: 'absolute' }
                  ]}
                >
                  {month}
                </Text>
              ))}
            </View>

            {/* User rows */}
            {userWeeklyActivity.map((userData) => (
              <View key={userData.id} style={[styles.heatmapRow, { marginBottom: ROW_GAP }]}>
                {/* User label */}
                <View style={[styles.rowLabel, { width: LABEL_WIDTH }]}>
                  <View style={[styles.rowLabelDot, { backgroundColor: userData.color }]} />
                  <Text style={styles.rowLabelText} numberOfLines={1}>
                    {userData.username}
                  </Text>
                </View>
                
                {/* Week cells */}
                <View style={styles.heatmapRowCells}>
                  {userData.weeks.map((count, weekIndex) => (
                    <TouchableOpacity
                      key={weekIndex}
                      style={[
                        styles.stackedCell,
                        { 
                          backgroundColor: getCellColor(count, userData.color),
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          marginRight: CELL_GAP,
                        },
                        weekIndex + 1 === currentWeekNumber && styles.currentWeekCell,
                      ]}
                      onPress={() => {
                        Alert.alert(
                          `${userData.username} • ${t("calendar.week")} ${weekIndex + 1}`,
                          count > 0 ? `${count} ${count > 1 ? t("calendar.tasksCompleted") : t("calendar.taskCompleted")}` : t("calendar.noTasksThisWeek")
                        );
                      }}
                    />
                  ))}
                </View>
              </View>
            ))}

            {/* Household total row */}
            <View style={[styles.heatmapRow]}>
              <View style={[styles.rowLabel, { width: LABEL_WIDTH }]}>
                <Ionicons name="home" size={14} color="#06B6D4" />
                <Text style={[styles.rowLabelText, { color: '#06B6D4', marginLeft: 6, fontWeight: '600' }]}>
                  {t("calendar.total")}
                </Text>
              </View>
              
              <View style={styles.heatmapRowCells}>
                {weeklyActivity.map((count, weekIndex) => (
                  <TouchableOpacity
                    key={weekIndex}
                    style={[
                      styles.stackedCell,
                      { 
                        backgroundColor: count === 0 ? "#1E1E24" : `rgba(6, 182, 212, ${Math.min(0.3 + count * 0.15, 1)})`,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        marginRight: CELL_GAP,
                      },
                      weekIndex + 1 === currentWeekNumber && styles.currentWeekCell,
                    ]}
                    onPress={() => {
                      Alert.alert(
                        `${t("calendar.household")} • ${t("calendar.week")} ${weekIndex + 1}`,
                        count > 0 ? `${count} ${count > 1 ? t("calendar.tasksCompleted") : t("calendar.taskCompleted")}` : t("calendar.noTasksThisWeek")
                      );
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={styles.stackedLegend}>
        <View style={styles.legendRow}>
          {userWeeklyActivity.map((userData) => (
            <View key={userData.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: userData.color }]} />
              <Text style={styles.legendUsername}>{userData.username}</Text>
              <Text style={styles.legendCount}>{userData.total}</Text>
            </View>
          ))}
          {/* Household Total */}
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#06B6D4" }]} />
            <Text style={[styles.legendUsername, { color: "#06B6D4" }]}>{t("calendar.total")}</Text>
            <Text style={[styles.legendCount, { color: "#06B6D4" }]}>{(tasksDone || []).length}</Text>
          </View>
        </View>
      </View>

      {/* Week indicator */}
      <Text style={styles.heatmapWeekIndicator}>
        📍 {t("calendar.currentWeek")}: {t("calendar.week")} {currentWeekNumber} {t("calendar.of")} {WEEKS_IN_YEAR}
      </Text>

      {/* Stats summary */}
      <View style={styles.heatmapStats}>
        <View style={styles.heatmapStatItem}>
          <Text style={styles.heatmapStatValue}>{(tasksDone || []).length}</Text>
          <Text style={styles.heatmapStatLabel}>{t("calendar.totalCompletions")}</Text>
        </View>
        <View style={styles.heatmapStatItem}>
          <Text style={styles.heatmapStatValue}>{weeklyActivity.filter(w => w > 0).length}</Text>
          <Text style={styles.heatmapStatLabel}>{t("calendar.activeWeeks")}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

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
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E24",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    color: "#F59E0B",
    fontSize: 12,
  },
  errorBannerButton: {
    padding: 4,
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
    maxHeight: 500,
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
    maxHeight: 400,
    flexGrow: 0,
  },
  selectedDayEventsContent: {
    paddingBottom: 8,
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
  // Completed Task Item Styles
  completedTaskItem: {
    flexDirection: "row",
    backgroundColor: "#111114",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  completedTaskColor: {
    width: 3,
    borderRadius: 2,
    marginRight: 12,
  },
  completedTaskContent: {
    flex: 1,
  },
  completedTaskTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 4,
  },
  completedTaskRecurrence: {
    fontSize: 12,
    color: "#71717A",
    marginBottom: 6,
    textTransform: "capitalize",
  },
  completedTaskUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  completedTaskUserText: {
    fontSize: 12,
    color: "#71717A",
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
  // Chore Edit Tabs
  choreEditTabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  choreEditTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  choreEditTabActive: {
    backgroundColor: "#06B6D4",
  },
  choreEditTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#71717A",
  },
  choreEditTabTextActive: {
    color: "#FFF",
  },
  // Complete Chore Button
  completeChoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    borderRadius: 12,
    padding: 14,
    marginTop: 24,
    marginBottom: 8,
    gap: 8,
  },
  completeChoreButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
  },
  // Chore History
  choreHistoryContainer: {
    flex: 1,
    minHeight: 300,
  },
  choreHistoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  choreHistoryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  choreHistoryAvatarText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  choreHistoryContent: {
    flex: 1,
  },
  choreHistoryUser: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 4,
  },
  choreHistoryDate: {
    fontSize: 13,
    color: "#71717A",
  },
  choreHistoryEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  choreHistoryEmptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 16,
  },
  choreHistoryEmptySubtext: {
    fontSize: 14,
    color: "#71717A",
    marginTop: 8,
  },
  // Annual View / Heatmap Styles
  annualContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
  },
  annualContent: {
    paddingBottom: 20,
  },
  annualTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 6,
  },
  annualSubtitle: {
    fontSize: 14,
    color: "#71717A",
    marginBottom: 20,
  },
  stackedHeatmapCard: {
    backgroundColor: "#131316",
    borderRadius: 16,
    padding: 18,
    paddingBottom: 40,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  heatmapRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    height: 28,
  },
  rowLabel: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
    position: "absolute",
    left: 0,
  },
  rowLabelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  rowLabelText: {
    fontSize: 12,
    color: "#A1A1AA",
    fontWeight: "500",
    flex: 1,
  },
  heatmapRowCells: {
    flexDirection: "row",
    marginLeft: 80, // LABEL_WIDTH
  },
  stackedCell: {
    borderRadius: 4,
  },
  currentWeekCell: {
    borderWidth: 2,
    borderColor: "#06B6D4",
  },
  stackedMonthLabel: {
    fontSize: 11,
    color: "#71717A",
    fontWeight: "500",
    position: "absolute",
  },
  stackedLegend: {
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendUsername: {
    fontSize: 13,
    color: "#A1A1AA",
    fontWeight: "500",
  },
  legendCount: {
    fontSize: 13,
    color: "#71717A",
    fontWeight: "600",
  },
  heatmapWeekIndicator: {
    textAlign: "center",
    fontSize: 15,
    color: "#06B6D4",
    marginTop: 16,
    fontWeight: "500",
  },
  heatmapStats: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  heatmapStatItem: {
    flex: 1,
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  heatmapStatValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFF",
  },
  heatmapStatLabel: {
    fontSize: 13,
    color: "#71717A",
    marginTop: 6,
  },
  // Daily View Styles
  dailyContainer: {
    flex: 1,
    paddingBottom: 100,
  },
  allDaySection: {
    backgroundColor: "#1A1A1F",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  allDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  allDayHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717A",
    textTransform: "uppercase",
  },
  allDayEvents: {
    flexDirection: "row",
  },
  allDayEventCard: {
    backgroundColor: "#111114",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderLeftWidth: 3,
    minWidth: 120,
  },
  allDayEventTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
  },
  completedTasksSection: {
    backgroundColor: "#1A1A1F",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  completedTasksHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  completedTasksHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717A",
    textTransform: "uppercase",
  },
  completedTasksList: {
    flexDirection: "row",
  },
  completedTaskChip: {
    backgroundColor: "#111114",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#06B6D4",
  },
  completedTaskChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 2,
  },
  completedTaskChipUser: {
    fontSize: 10,
    color: "#71717A",
  },
  timeSlotsContainer: {
    flex: 1,
  },
  timeSlotsContent: {
    paddingBottom: 20,
  },
  timeSlotRow: {
    flexDirection: "row",
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  timeSlotRowCurrent: {
    backgroundColor: "rgba(6, 182, 212, 0.05)",
  },
  timeSlotRowPast: {
    opacity: 0.6,
  },
  timeLabel: {
    width: 70,
    paddingTop: 8,
    paddingRight: 12,
    alignItems: "flex-end",
  },
  timeLabelText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#71717A",
  },
  timeLabelTextCurrent: {
    color: "#06B6D4",
    fontWeight: "700",
  },
  timeSlotContent: {
    flex: 1,
    position: "relative",
    paddingLeft: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  hourLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  hourLineCurrent: {
    backgroundColor: "#06B6D4",
    height: 2,
  },
  hourEvents: {
    position: "relative",
    minHeight: 40,
  },
  timedEventCard: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    borderLeftWidth: 3,
    justifyContent: "center",
  },
  timedEventTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 2,
  },
  timedEventTime: {
    fontSize: 11,
    color: "#71717A",
  },
  addEventSlotButton: {
    width: "100%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  addEventSlotDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3F3F46",
  },
  // Weekly View Styles
  weeklyContainer: {
    flex: 1,
  },
  weeklyContent: {
    padding: 16,
    paddingBottom: 100,
  },
  weeklyDayCard: {
    backgroundColor: "#1A1A1F",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  weeklyDayCardToday: {
    borderColor: "#06B6D4",
    borderWidth: 2,
    backgroundColor: "#0E1F2A",
  },
  weeklyDayCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  weeklyDayCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  weeklyDayCardDate: {
    marginRight: 12,
  },
  weeklyDayCardDayName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A1A1AA",
    marginBottom: 4,
  },
  weeklyDayCardDateNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
  },
  weeklyDayCardDateNumberToday: {
    color: "#06B6D4",
  },
  weeklyDayCardMonth: {
    paddingTop: 4,
  },
  weeklyDayCardMonthText: {
    fontSize: 13,
    color: "#71717A",
    fontWeight: "500",
  },
  weeklyDayCardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  weeklyDayCardBadge: {
    backgroundColor: "#111114",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weeklyDayCardBadgeText: {
    fontSize: 12,
    color: "#71717A",
    fontWeight: "500",
  },
  weeklyDayCardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  weeklyDayCardEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  weeklyDayCardEmptyText: {
    fontSize: 14,
    color: "#71717A",
    marginTop: 12,
    marginBottom: 16,
  },
  weeklyDayCardItems: {
    gap: 8,
  },
});

export default UnifiedCalendar;

