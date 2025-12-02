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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGlobalContext } from "../../context/GlobalProvider";
import {
  getHouseholdEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  EventCategories,
  getHouseholdTasks,
  getAllTasksDone,
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
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const handleCreateEvent = (date) => {
    // Open event creation modal
    console.log("Create event for:", date);
    // TODO: Implement event creation modal
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
            onCreateEvent={handleCreateEvent}
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

const MonthlyView = ({ date, items, onDayPress, onCreateEvent }) => {
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
                <View key={item.id} style={styles.eventItem}>
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
                  </View>
                </View>
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
});

export default UnifiedCalendar;

