import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Animated,
  Image,
  FlatList,
  Dimensions,
  Pressable,
  Easing,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import LegendModal from "./LegendModal";
import CreateTaskModal from "./CreateTaskModal";
import { useGlobalContext } from "../../context/GlobalProvider";
import { getFirstDayOfWeek, getWeekNumberByDate } from "../../lib/utils";
import {
  createTaskDone,
  deleteTaskDone,
  deleteTask,
  getHouseholdMembers,
  getHouseholdTasks,
  getAllTasksDone,
} from "../../lib/appwrite";

const WEEKS_IN_YEAR = 52;
const COLUMN_WIDTH = 60;
const ROW_HEIGHT = 45;
const TASK_COLUMN_WIDTH = 150;
const VIEW_MODES = {
  CALENDAR: "calendar",
  LIST: "list",
};

const TasksTracker = ({ initialTasks, householdId }) => {
  const { user } = useGlobalContext();
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState(initialTasks);
  const [currentWeekNumber, setCurrentWeekNumber] = useState(
    getWeekNumberByDate(new Date())
  );
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // all, completed, pending
  const [viewMode, setViewMode] = useState(VIEW_MODES.CALENDAR); // Add view mode state

  // Scrolling to current week
  const scrollRef = useRef();

  // Modals
  const [legendModalVisible, setLegendModalVisible] = useState(false);
  const [createTaskModal, setCreateTaskModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToViewHistory, setTaskToViewHistory] = useState(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  // For animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Add state to track which stats are expanded
  const [expandedStats, setExpandedStats] = useState({});

  // Replace long press state with double tap state
  const [tappedTaskId, setTappedTaskId] = useState(null);
  const [doubleTapTaskId, setDoubleTapTaskId] = useState(null);
  const lastTapTimeRef = useRef(0);
  const doubleTapTimeoutRef = useRef(null);
  const completeAnimationRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    setTasks(initialTasks);
    fetchUsers();
    scrollToCurrentWeek();
  }, [initialTasks]);

  const scrollToCurrentWeek = () => {
    // Calculate the x position based on current week number
    // Each column is COLUMN_WIDTH wide, we want to center current week on screen
    const screenWidth = Dimensions.get("window").width;
    const targetX = (currentWeekNumber - 1) * COLUMN_WIDTH - (screenWidth / 2) + TASK_COLUMN_WIDTH + (COLUMN_WIDTH / 2);
    
    // Add a slight delay to ensure the component is rendered
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: Math.max(0, targetX), animated: true });
    }, 500);
  };

  const fetchUsers = async () => {
    if (!householdId) return;
    try {
      const members = await getHouseholdMembers(householdId);
      setUsers(members);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const onRefresh = async () => {
    if (!householdId) return;
    setRefreshing(true);
    try {
      // Get all tasks done first
      const taskDoneList = await getAllTasksDone();
      
      // Build a map of completed weeks per task
      const completedWeeksMap = {};
      taskDoneList.forEach((taskDone) => {
        const taskId = taskDone?.taskId?.$id;
        if (!taskId) return;
        
        if (!completedWeeksMap[taskId]) {
          completedWeeksMap[taskId] = {
            name: taskDone?.taskId?.title,
            completedWeeks: Array(52).fill(""),
          };
        }
        if (taskDone.weekNumber >= 1 && taskDone.weekNumber <= 52) {
          completedWeeksMap[taskId].completedWeeks[taskDone.weekNumber - 1] = taskDone.userId;
        }
      });
      
      // Get household tasks
      const householdTasks = await getHouseholdTasks(householdId);
      
      // Merge tasks with completed weeks data
      const refreshedTasks = householdTasks.map(task => ({
        id: task.$id,
        name: task.title,
        completedWeeks: completedWeeksMap[task.$id]?.completedWeeks || Array(52).fill(""),
      }));
      
      setTasks(refreshedTasks);
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleTask = async (taskId, weekIndex) => {
    if (!user && !user.$id) {
      return Alert.alert("Error", "User not found. Please try again later.");
    }

    const task = tasks.find((task) => task.id === taskId);

    // Check if the task is completed by this user
    const isCompletedByCurrentUser =
      task.completedWeeks[weekIndex]?.$id === user.$id;

    // If completed by another user, show who completed it
    if (task.completedWeeks[weekIndex] && !isCompletedByCurrentUser) {
      const completedByUser = users.find(
        (u) => u.$id === task.completedWeeks[weekIndex].$id
      );
      const username = completedByUser?.username || "Another user";

      Alert.alert(
        "Task Already Completed",
        `This task was completed by ${username}. You can mark it as completed by you as well.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Mark as done",
            onPress: () => addUserCompletion(taskId, weekIndex),
          },
        ]
      );
      return;
    }

    // If completed by this user, remove the completion
    if (isCompletedByCurrentUser) {
      try {
        await deleteTaskDone(taskId, user.$id, weekIndex + 1);

        // Update UI
        const updatedTasks = tasks.map((t) => {
          if (t.id === taskId) {
            const updatedWeeks = [...t.completedWeeks];
            updatedWeeks[weekIndex] = ""; // Remove completion
            return { ...t, completedWeeks: updatedWeeks };
          }
          return t;
        });

        setTasks(updatedTasks);
      } catch (error) {
        console.error("Error removing task completion:", error);
        Alert.alert("Error", "Could not remove task completion");
      }
    } else {
      // Not completed by anyone, add completion
      addUserCompletion(taskId, weekIndex);
    }
  };

  const addUserCompletion = async (taskId, weekIndex) => {
    const taskDoneToCreate = {
      done: true,
      doneDate: weekIndex + 1,
      userId: user.$id,
      taskId: taskId,
    };

    try {
      await createTaskDone(taskDoneToCreate);

      // Update UI
      const updatedTasks = tasks.map((task) => {
        if (task.id === taskId) {
          const updatedWeeks = [...task.completedWeeks];
          updatedWeeks[weekIndex] = user; // Mark as completed by current user
          return { ...task, completedWeeks: updatedWeeks };
        }
        return task;
      });

      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error creating task completion:", error);
      Alert.alert("Error", "Could not mark task as completed");
    }
  };

  // Filter tasks based on completion status
  const handleTaskCreated = (newTask) => {
    onRefresh();
  };

  const confirmDeleteTask = (taskId) => {
    setTaskToDelete(taskId);
    setDeleteModalVisible(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      // await deleteTaskDone(taskId, user.$id, 0); // This is a placeholder - not sure if this API works for task deletion
      await deleteTask(taskId);
      // Update UI
      const updatedTasks = tasks.filter((t) => t.id !== taskId);
      setTasks(updatedTasks);
      setTaskToDelete(null);

      Alert.alert("Success", "Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      Alert.alert("Error", "Could not delete task. Please try again.");
      setTaskToDelete(null);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;

    // Check if any week is completed
    const hasCompletions = task.completedWeeks.some(
      (completion) => completion !== ""
    );

    if (filter === "completed") return hasCompletions;
    if (filter === "pending") return !hasCompletions;

    return true;
  });

  // Get completion stats by user
  const getTaskCompletionStats = useCallback(() => {
    if (!tasks.length || !users.length) return [];

    const stats = users.map((user) => {
      let totalCompleted = 0;
      const completedTasks = [];

      tasks.forEach((task) => {
        const userCompletions = task.completedWeeks.filter(
          (completion) => completion && completion.$id === user.$id
        );

        const completionCount = userCompletions.length;

        if (completionCount > 0) {
          // Store detailed info about this task completion
          completedTasks.push({
            taskId: task.id,
            taskName: task.name,
            completionCount: completionCount,
            // Find the latest completion week
            latestCompletionWeek: task.completedWeeks.findIndex(
              (completion) => completion && completion.$id === user.$id
            ),
          });

          totalCompleted += completionCount;
        }
      });

      return {
        user,
        completedCount: totalCompleted,
        color: user.color || "#4F86C6",
        completedTasks: completedTasks.sort(
          (a, b) =>
            // Sort by most recently completed
            b.latestCompletionWeek - a.latestCompletionWeek
        ),
      };
    });

    return stats.sort((a, b) => b.completedCount - a.completedCount);
  }, [tasks, users]);

  // Toggle expanded state for a user
  const toggleStatsExpanded = (userId) => {
    setExpandedStats((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Add this function back
  const toggleViewMode = () => {
    setViewMode((prevMode) =>
      prevMode === VIEW_MODES.CALENDAR ? VIEW_MODES.LIST : VIEW_MODES.CALENDAR
    );
  };

  // Task completion stats
  const userStats = getTaskCompletionStats();

  // Function to get the last completion info for a task
  const getLastCompletionInfo = (task) => {
    if (!task.completedWeeks || !task.completedWeeks.length) {
      return { text: "Never completed", user: null, weeksAgo: null };
    }

    // Find the last completed week (going backwards from current week)
    const currentWeek = getWeekNumberByDate(new Date());
    let lastCompletedWeekIndex = -1;
    let lastCompletedUser = null;

    // Start from current week and go backwards
    for (let i = currentWeek - 1; i >= 0; i--) {
      const completion = task.completedWeeks[i];
      if (
        completion &&
        ((Array.isArray(completion) && completion.length > 0) ||
          (!Array.isArray(completion) && completion))
      ) {
        lastCompletedWeekIndex = i;
        lastCompletedUser = Array.isArray(completion)
          ? completion[0]
          : completion;
        break;
      }
    }

    if (lastCompletedWeekIndex === -1) {
      return { text: "Never completed", user: null, weeksAgo: null };
    }

    const weeksAgo = currentWeek - lastCompletedWeekIndex - 1;
    let timeText;

    if (weeksAgo === 0) {
      timeText = "This week";
    } else if (weeksAgo === 1) {
      timeText = "Last week";
    } else {
      timeText = `${weeksAgo} weeks ago`;
    }

    const username = lastCompletedUser.username || "Unknown user";

    // Add a status message and urgency level based on how long ago it was completed
    let statusMessage = "";
    let urgencyLevel = "normal"; // "normal", "soon", "urgent", "overdue"

    // Task urgency levels based on weeks since last completion
    if (weeksAgo > 6) {
      statusMessage = " (it's really overdue!)";
      urgencyLevel = "overdue";
    } else if (weeksAgo > 3) {
      statusMessage = " (it's starting to get sticky)";
      urgencyLevel = "urgent";
    } else if (weeksAgo > 1) {
      urgencyLevel = "soon";
    }

    return {
      text: `${timeText}${statusMessage}`,
      user: username,
      weeksAgo: weeksAgo,
      color: lastCompletedUser.color || "#4F86C6",
      urgencyLevel: urgencyLevel,
    };
  };

  // Calculate task urgency score for sorting
  const getTaskUrgencyScore = (task) => {
    const lastCompletion = getLastCompletionInfo(task);

    // Tasks never completed have highest urgency
    if (!lastCompletion.user) {
      return 1000;
    }

    // Otherwise base urgency on how long since last completion
    const weeksAgo = lastCompletion.weeksAgo || 0;
    return weeksAgo * 10;
  };

  // Sort filtered tasks by urgency
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    return getTaskUrgencyScore(b) - getTaskUrgencyScore(a);
  });

  // Function to handle task click for viewing history
  const showTaskHistory = (task) => {
    setTaskToViewHistory(task);
    setHistoryModalVisible(true);
  };

  // Function to get all completions for a task
  const getTaskCompletions = (task) => {
    if (!task || !task.completedWeeks) return [];

    const completions = [];

    task.completedWeeks.forEach((completion, weekIndex) => {
      if (completion && completion.$id) {
        const weekNumber = weekIndex + 1;
        const dateString = getFirstDayOfWeek(weekNumber);

        completions.push({
          id: `${weekNumber}-${completion.$id}`,
          weekNumber,
          dateString,
          user: users.find((u) => u.$id === completion.$id) || completion,
        });
      }
    });

    // Sort by most recent first
    return completions.sort((a, b) => b.weekNumber - a.weekNumber);
  };

  // Add this new function to count completions by user for a specific task
  const getTaskCompletionsByUser = (task) => {
    if (!task || !task.completedWeeks || !users.length) return [];

    // Create a counter object for each user
    const completionCounts = {};

    // Count completions for each user
    task.completedWeeks.forEach((completion) => {
      if (completion && completion.$id) {
        const userId = completion.$id;
        if (completionCounts[userId]) {
          completionCounts[userId]++;
        } else {
          completionCounts[userId] = 1;
        }
      }
    });

    // Convert to array of user objects with counts
    const userCompletions = Object.keys(completionCounts)
      .map((userId) => {
        const userObj = users.find((u) => u.$id === userId);
        if (!userObj) return null;

        return {
          user: userObj,
          count: completionCounts[userId],
        };
      })
      .filter(Boolean); // Remove null entries

    // Sort by count (highest first)
    return userCompletions.sort((a, b) => b.count - a.count);
  };

  // Group tasks by urgency level for grid layout
  const groupTasksByUrgency = (tasks) => {
    const groupedTasks = {};

    // First pass: group tasks by urgency level
    tasks.forEach((task) => {
      const lastCompletion = getLastCompletionInfo(task);
      const urgencyLevel = lastCompletion.urgencyLevel;

      if (!groupedTasks[urgencyLevel]) {
        groupedTasks[urgencyLevel] = [];
      }

      groupedTasks[urgencyLevel].push(task);
    });

    // Return an array of sections with title and data
    return Object.keys(groupedTasks).map((urgencyLevel) => ({
      urgencyLevel,
      data: groupedTasks[urgencyLevel],
      // Create pairs of tasks for the grid
      pairs: chunk(groupedTasks[urgencyLevel], 2),
    }));
  };

  // Helper function to split array into chunks of specified size
  const chunk = (array, size) => {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  };

  // Group the sorted tasks for grid layout
  const groupedTasks = groupTasksByUrgency(sortedTasks);

  // Get the screen width to calculate item width
  const screenWidth = Dimensions.get("window").width;
  const itemWidth = (screenWidth - 32) / 2; // 32 accounts for margins/padding

  // Function to handle tap on a task
  const handleTaskTap = (taskId) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms between taps to count as double-tap

    // If this is the first tap or tap on a different task
    if (tappedTaskId !== taskId) {
      // Clear any existing timeout
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }

      // Set this task as tapped
      setTappedTaskId(taskId);
      lastTapTimeRef.current = now;

      // Clear the tapped state after a delay if no second tap happens
      doubleTapTimeoutRef.current = setTimeout(() => {
        setTappedTaskId(null);
      }, DOUBLE_TAP_DELAY);

      return;
    }

    // If tapping the same task that was just tapped
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
      // This is a double tap - mark task as complete
      clearTimeout(doubleTapTimeoutRef.current);
      setDoubleTapTaskId(taskId);
      setTappedTaskId(null);

      // Show completion animation
      completeAnimationRef.setValue(0);
      Animated.timing(completeAnimationRef, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.bezier(0.175, 0.885, 0.32, 1.275), // Bounce-like easing
      }).start(() => {
        // Actually complete the task after animation finishes
        const currentWeek = getWeekNumberByDate(new Date()) - 1;
        toggleTask(taskId, currentWeek);

        // Reset animation state after a brief delay
        setTimeout(() => {
          setDoubleTapTaskId(null);
        }, 200);
      });
    } else {
      // If the second tap was too slow, treat as a new first tap
      clearTimeout(doubleTapTimeoutRef.current);
      lastTapTimeRef.current = now;

      doubleTapTimeoutRef.current = setTimeout(() => {
        setTappedTaskId(null);
      }, DOUBLE_TAP_DELAY);
    }

    // Function to show task history on a new single tap
    const showHistory = (taskId) => {
      if (tappedTaskId === null && doubleTapTaskId === null) {
        showTaskHistory(taskId);
      }
    };
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Chores Calendar</Text>
        <TouchableOpacity
          style={styles.addTaskButton}
          onPress={() => setCreateTaskModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterHeader}>
        <View style={styles.filterButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "all" && styles.activeFilterButton,
            ]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === "all" && styles.activeFilterText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "pending" && styles.activeFilterButton,
            ]}
            onPress={() => setFilter("pending")}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === "pending" && styles.activeFilterText,
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "completed" && styles.activeFilterButton,
            ]}
            onPress={() => setFilter("completed")}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === "completed" && styles.activeFilterText,
              ]}
            >
              Completed
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
            <Text style={styles.legendButtonText}>👤 Users</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === VIEW_MODES.CALENDAR ? (
        <View style={styles.calendarContainer}>
          <View style={styles.taskColumn}>
            <View style={[styles.headerCell, { width: TASK_COLUMN_WIDTH }]}>
              <Text style={styles.headerText}>Tasks</Text>
            </View>
            <ScrollView>
              {filteredTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.cell, { width: TASK_COLUMN_WIDTH }]}
                  onPress={() => handleTaskTap(task.id)}
                >
                  <View style={styles.taskTextContainer}>
                    <Text style={styles.taskText}>{task.name}</Text>
                    <TouchableOpacity
                      style={styles.deleteIcon}
                      onPress={() => confirmDeleteTask(task.id)}
                    >
                      <Text style={styles.deleteIconText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.taskAddButton}
                onPress={() => setCreateTaskModalVisible(true)}
              >
                <Text style={styles.taskAddButtonText}>+ Add Task</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <ScrollView
            ref={scrollRef}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#06B6D4"
                  colors={["#06B6D4"]}
                />
              }
          >
            <View>
              <View style={styles.header}>
                {[...Array(WEEKS_IN_YEAR)].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.headerCell,
                      { width: COLUMN_WIDTH },
                      index + 1 === currentWeekNumber &&
                        styles.currentWeekHeader,
                    ]}
                  >
                    <Text
                      style={[
                        styles.headerText,
                        index + 1 === currentWeekNumber &&
                          styles.currentWeekText,
                      ]}
                    >
                      {getFirstDayOfWeek(index + 1)}
                    </Text>
                  </View>
                ))}
              </View>
              <ScrollView>
                {filteredTasks.map((task) => (
                  <View key={task.id} style={styles.row}>
                    {task.completedWeeks.map((completed, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.cell,
                          { width: COLUMN_WIDTH },
                          index + 1 === currentWeekNumber && styles.currentCell,
                        ]}
                        onPress={() => toggleTask(task.id, index)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            completed && styles.checkboxCompleted,
                            completed && {
                              backgroundColor: completed.color || "#4F86C6",
                            },
                          ]}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4F86C6"]}
            />
          }
          style={styles.listContainer}
        >
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>Tasks</Text>
          </View>

          {/* Render tasks grouped by urgency */}
          {groupedTasks.map((group, groupIndex) => (
            <View key={`group-${groupIndex}-${group.urgencyLevel}`}>
              <View style={styles.urgencyHeader}>
                <Text style={styles.urgencyHeaderText}>
                  {group.urgencyLevel === "overdue" && "Overdue Tasks"}
                  {group.urgencyLevel === "urgent" && "Urgent Tasks"}
                  {group.urgencyLevel === "soon" && "Tasks Due Soon"}
                  {group.urgencyLevel === "normal" && "Normal Tasks"}
                </Text>
              </View>

              {/* Render each pair of tasks in a row */}
              {group.pairs.map((pair, pairIndex) => (
                <View
                  key={`pair-${groupIndex}-${pairIndex}`}
                  style={styles.taskRow}
                >
                  {pair.map((task, taskIndex) => {
                    const lastCompletion = getLastCompletionInfo(task);
                    return (
                      <TouchableOpacity
                        key={task.id}
                        onPress={() => handleTaskTap(task.id)}
                        style={[
                          styles.taskItemContainer,
                          styles[`${group.urgencyLevel}Item`],
                          { width: itemWidth },
                          tappedTaskId === task.id && styles.taskItemTapped,
                        ]}
                        activeOpacity={0.7}
                      >
                        {/* Large centered "Complete?" message on first tap */}
                        {tappedTaskId === task.id && (
                          <View style={styles.completePromptOverlay}>
                            <Text
                              style={[
                                styles.completePromptText,
                                {
                                  color:
                                    styles[`${group.urgencyLevel}Text`].color ||
                                    "#4F86C6",
                                  textShadowColor: "rgba(255, 255, 255, 0.8)",
                                  textShadowOffset: { width: 1, height: 1 },
                                  textShadowRadius: 3,
                                },
                              ]}
                            >
                              Complete?
                            </Text>
                            <Text style={styles.completePromptSubtext}>
                              Tap again to confirm
                            </Text>
                          </View>
                        )}

                        {/* Show completion animation when double-tapped */}
                        {doubleTapTaskId === task.id && (
                          <Animated.View
                            style={[
                              styles.completionOverlay,
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
                              name="check-circle"
                              size={60}
                              color="#4CAF50"
                            />
                          </Animated.View>
                        )}

                        <View style={styles.taskItemHeader}>
                          <Text
                            style={[
                              styles.taskItemTitle,
                              styles[`${group.urgencyLevel}Text`],
                            ]}
                          >
                            {task.name}
                          </Text>

                          <View style={styles.taskItemActions}>
                            {/* History button */}
                            <TouchableOpacity
                              style={styles.historyButton}
                              onPress={() => showTaskHistory(task)}
                            >
                              <Text style={styles.historyButtonText}>?</Text>
                            </TouchableOpacity>

                            {/* Delete button */}
                            <TouchableOpacity
                              style={styles.deleteIcon}
                              onPress={() => confirmDeleteTask(task.id)}
                            >
                              <Text style={styles.deleteIconText}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* User avatars and other content */}
                        <View style={styles.userCompletionsContainer}>
                          {getTaskCompletionsByUser(task).map(
                            ({ user, count }) => (
                              <View
                                key={user.$id}
                                style={styles.userCompletionItem}
                              >
                                <View
                                  style={[
                                    styles.userCompletionAvatar,
                                    {
                                      backgroundColor: user.color || "#4F86C6",
                                    },
                                  ]}
                                >
                                  <Text style={styles.userCompletionInitial}>
                                    {user.username.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <View style={styles.userCompletionCount}>
                                  <Text style={styles.userCompletionCountText}>
                                    {count}
                                  </Text>
                                </View>
                              </View>
                            )
                          )}
                        </View>

                        <View style={styles.taskItemFooter}>
                          <Text style={styles.taskItemCompletionInfo}>
                            {lastCompletion.text}
                          </Text>
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

          {/* Fancy Add Button */}
          <TouchableOpacity
            style={styles.fancyAddButton}
            onPress={() => setCreateTaskModalVisible(true)}
          >
            <View style={styles.fancyAddButtonInner}>
              <MaterialCommunityIcons name="plus" size={24} color="#fff" />
              <Text style={styles.fancyAddButtonText}>Add New Task</Text>
            </View>
          </TouchableOpacity>

          {/* Enhanced User Stats Section with Task Details */}
          <View style={styles.fancyStatsContainer}>
            <Text style={styles.fancyStatsSectionTitle}>
              <MaterialCommunityIcons
                name="trophy-outline"
                size={20}
                color="#333"
              />{" "}
              Task Completion Leaderboard
            </Text>
            {userStats.map((stat, index) => (
              <View key={stat.user.$id}>
                <TouchableOpacity
                  onPress={() => toggleStatsExpanded(stat.user.$id)}
                  activeOpacity={0.7}
                >
                  <View key={stat.user.$id} style={styles.fancyStatItem}>
                    <View
                      style={[
                        styles.fancyStatRank,
                        index === 0 && styles.firstPlaceRank,
                        index === 1 && styles.secondPlaceRank,
                        index === 2 && styles.thirdPlaceRank,
                      ]}
                    >
                      <Text style={styles.fancyStatRankText}>{index + 1}</Text>
                    </View>
                    <View
                      style={[
                        styles.fancyStatBar,
                        { borderLeftColor: stat.color },
                      ]}
                    >
                      <View style={styles.fancyStatBarHeader}>
                        <Text style={styles.fancyStatUsername}>
                          {stat.user.username}
                        </Text>
                        <View style={styles.statCountContainer}>
                          <Text style={styles.fancyStatCount}>
                            {stat.completedCount} tasks completed
                          </Text>
                          <MaterialCommunityIcons
                            name={
                              expandedStats[stat.user.$id]
                                ? "chevron-up"
                                : "chevron-down"
                            }
                            size={18}
                            color="#666"
                            style={styles.expandIcon}
                          />
                        </View>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View
                          style={[
                            styles.progressBar,
                            {
                              width: `${Math.min(
                                100,
                                stat.completedCount * 5
                              )}%`,
                              backgroundColor: stat.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Expanded Task Details */}
                {expandedStats[stat.user.$id] && (
                  <View style={styles.expandedTasksContainer}>
                    {stat.completedTasks.length > 0 ? (
                      stat.completedTasks.map((task) => (
                        <View key={task.taskId} style={styles.expandedTaskItem}>
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={16}
                            color={stat.color}
                          />
                          <View style={styles.expandedTaskDetails}>
                            <Text style={styles.expandedTaskName}>
                              {task.taskName}
                            </Text>
                            <Text style={styles.expandedTaskCompletions}>
                              Completed {task.completionCount}{" "}
                              {task.completionCount === 1 ? "time" : "times"}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noTasksText}>
                        No tasks completed yet
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <LegendModal
        title="Users"
        users={users}
        visible={legendModalVisible}
        onClose={() => setLegendModalVisible(false)}
      />
      <CreateTaskModal
        visible={createTaskModal}
        onClose={() => setCreateTaskModalVisible(false)}
        onTaskCreated={handleTaskCreated}
        householdId={householdId}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => {
          setDeleteModalVisible(false);
          setTaskToDelete(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Text style={styles.deleteModalTitle}>Delete Task</Text>
            </View>

            <View style={styles.deleteModalBody}>
              <Text style={styles.deleteModalMessage}>
                Are you sure you want to delete this task?
              </Text>
            </View>

            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setTaskToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  handleDeleteTask(taskToDelete);
                }}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Task History Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={historyModalVisible}
        onRequestClose={() => {
          setHistoryModalVisible(false);
          setTaskToViewHistory(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.historyModalContainer}>
            <View style={styles.historyModalHeader}>
              <Text style={styles.historyModalTitle}>
                {taskToViewHistory?.name} History
              </Text>
              <TouchableOpacity
                style={styles.historyModalCloseButton}
                onPress={() => {
                  setHistoryModalVisible(false);
                  setTaskToViewHistory(null);
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.historyModalBody}>
              {taskToViewHistory ? (
                <>
                  <Text style={styles.historyModalSubtitle}>
                    Completion Timeline
                  </Text>

                  {getTaskCompletions(taskToViewHistory).length > 0 ? (
                    <FlatList
                      data={getTaskCompletions(taskToViewHistory)}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <View style={styles.historyItem}>
                          <View style={styles.historyItemLeft}>
                            <View
                              style={[
                                styles.historyUserAvatar,
                                {
                                  backgroundColor: item.user.color || "#4F86C6",
                                },
                              ]}
                            >
                              <Text style={styles.historyUserInitial}>
                                {item.user.username
                                  ? item.user.username.charAt(0).toUpperCase()
                                  : "?"}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.historyItemContent}>
                            <Text style={styles.historyItemDate}>
                              Week {item.weekNumber} ({item.dateString})
                            </Text>
                            <Text style={styles.historyItemUser}>
                              Completed by{" "}
                              {item.user.username || "Unknown user"}
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
                        No completion history found for this task
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
                setTaskToViewHistory(null);
              }}
            >
              <Text style={styles.historyModalCloseFullButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#111114",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  addTaskButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#06B6D4",
    justifyContent: "center",
    alignItems: "center",
  },
  filterHeader: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111114",
    justifyContent: "space-between",
  },
  filterButtonsContainer: {
    flexDirection: "row",
  },
  rightButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: "#1A1A1F",
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: "#1A1A1F",
  },
  activeFilterButton: {
    backgroundColor: "#06B6D4",
  },
  filterButtonText: {
    fontSize: 12,
    color: "#A1A1AA",
  },
  activeFilterText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  legendButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#1A1A1F",
  },
  legendButtonText: {
    fontSize: 12,
    color: "#A1A1AA",
  },
  calendarContainer: {
    flex: 1,
    flexDirection: "row",
  },
  taskColumn: {
    width: TASK_COLUMN_WIDTH,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111114",
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  taskTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingRight: 4,
  },
  deleteIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(244,63,94,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIconText: {
    color: "#F43F5E",
    fontSize: 12,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#111114",
  },
  headerCell: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.05)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  currentWeekHeader: {
    backgroundColor: "rgba(6,182,212,0.15)",
  },
  headerText: {
    fontWeight: "500",
    fontSize: 12,
    color: "#71717A",
  },
  currentWeekText: {
    fontWeight: "bold",
    color: "#06B6D4",
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.05)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  currentCell: {
    backgroundColor: "rgba(6,182,212,0.08)",
  },
  taskText: {
    fontSize: 14,
    color: "#FFFFFF",
    paddingHorizontal: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#3F3F46",
    borderRadius: 4,
  },
  checkboxCompleted: {
    borderColor: "transparent",
  },
  // List view styles
  listContainer: {
    flex: 1,
    padding: 16,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    marginBottom: 12,
  },
  listHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A1A1AA",
  },
  listItemContainer: {
    backgroundColor: "#1A1A1F",
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    padding: 8,
  },
  listItemTitleWrapper: {
    flex: 1,
  },
  listItemTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  listItemBody: {
    marginTop: 4,
  },
  listItemCompletionInfo: {
    fontSize: 12,
    color: "#A1A1AA",
  },
  // User completion avatars
  userCompletionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
    marginTop: 4,
    paddingHorizontal: 0,
  },
  userCompletionItem: {
    marginRight: 8,
    marginBottom: 4,
    position: "relative",
  },
  userCompletionAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "white",
  },
  userCompletionInitial: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  userCompletionCount: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#06B6D4",
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1A1A1F",
  },
  userCompletionCountText: {
    color: "white",
    fontSize: 8,
    fontWeight: "bold",
  },
  // Quick action buttons
  taskActionButton: {
    backgroundColor: "#06B6D4",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  taskActionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  // Delete modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteModalContainer: {
    backgroundColor: "#1A1A1F",
    borderRadius: 16,
    width: "80%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  deleteModalHeader: {
    backgroundColor: "#111114",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  deleteModalBody: {
    padding: 20,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: "#A1A1AA",
    textAlign: "center",
  },
  deleteModalActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.1)",
  },
  deleteButton: {
    backgroundColor: "rgba(244,63,94,0.15)",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#A1A1AA",
    fontWeight: "500",
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#F43F5E",
    fontWeight: "600",
  },
  // Urgency styles for task items (dark theme)
  normalItem: {
    backgroundColor: "rgba(34,197,94,0.15)",
  },
  soonItem: {
    backgroundColor: "rgba(234,179,8,0.15)",
  },
  urgentItem: {
    backgroundColor: "rgba(249,115,22,0.15)",
  },
  overdueItem: {
    backgroundColor: "rgba(239,68,68,0.15)",
  },

  // Text styles for different urgency levels
  normalText: {
    color: "#22C55E",
    fontWeight: "500",
  },
  soonText: {
    color: "#EAB308",
    fontWeight: "500",
  },
  urgentText: {
    color: "#F97316",
    fontWeight: "500",
  },
  overdueText: {
    color: "#EF4444",
    fontWeight: "600",
  },

  // Enhanced list item styles
  fancyListItem: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  fancyListItemContent: {
    padding: 16,
  },
  fancyListItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  taskTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  urgencyIcon: {
    marginRight: 8,
  },
  fancyListItemTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  fancyDeleteIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(244,63,94,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  fancyListItemBody: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  lastCompletionInfoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: "100%",
  },
  lastCompletionHeading: {
    fontSize: 12,
    color: "#71717A",
    marginBottom: 4,
  },
  lastCompletionText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  normalCompletionText: {
    color: "#22C55E",
  },
  soonCompletionText: {
    color: "#EAB308",
  },
  urgentCompletionText: {
    color: "#F97316",
  },
  overdueCompletionText: {
    color: "#EF4444",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  userInitial: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  neverCompletedMessage: {
    flexDirection: "row",
    alignItems: "center",
  },
  neverCompletedText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  normalActionButton: {
    backgroundColor: "#4CAF50",
  },
  soonActionButton: {
    backgroundColor: "#FF9800",
  },
  urgentActionButton: {
    backgroundColor: "#F57C00",
  },
  overdueActionButton: {
    backgroundColor: "#E53935",
  },
  quickActionText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "500",
  },

  // Fancy add button
  fancyAddButton: {
    backgroundColor: "#4F86C6",
    borderRadius: 12,
    marginVertical: 16,
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

  // Enhanced stats container
  fancyStatsContainer: {
    marginTop: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: "#F5F7FA",
    borderRadius: 16,
    padding: 16,
  },
  fancyStatsSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 16,
    textAlign: "center",
  },
  fancyStatItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  fancyStatRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  firstPlaceRank: {
    backgroundColor: "#FFD700",
  },
  secondPlaceRank: {
    backgroundColor: "#C0C0C0",
  },
  thirdPlaceRank: {
    backgroundColor: "#CD7F32",
  },
  fancyStatRankText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  fancyStatBar: {
    flex: 1,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  fancyStatBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fancyStatUsername: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  fancyStatCount: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },

  // Task History Modal styles
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
  historyUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  historyUserInitial: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
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
  historyItemUser: {
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
    color: "#4F86C6",
  },
  // Add new styles for the expanded task details
  expandedTasksContainer: {
    marginLeft: 44,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#E0E0E0",
    marginTop: -8,
  },
  expandedTaskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  expandedTaskDetails: {
    marginLeft: 8,
    flex: 1,
  },
  expandedTaskName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  expandedTaskCompletions: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  noTasksText: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  statCountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  expandIcon: {
    marginLeft: 4,
  },
  // New styles for the grid layout
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 8,
    marginBottom: 16,
  },
  taskItemContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    padding: 12,
    margin: 4,
  },
  taskItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  taskItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  taskItemFooter: {
    marginTop: 4,
  },
  taskItemCompletionInfo: {
    fontSize: 12,
    color: "#666666",
  },
  urgencyHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F5F7FA",
    marginVertical: 4,
  },
  urgencyHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555555",
  },
  // Add styles for the double-tap functionality
  taskItemTapped: {
    backgroundColor: "#F5F9FF",
  },
  tappedIndicator: {
    fontStyle: "italic",
    color: "#4F86C6",
  },
  completionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    zIndex: 5,
  },
  completePromptOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    zIndex: 5,
  },
  completePromptText: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
    textShadowColor: "rgba(255, 255, 255, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  completePromptSubtext: {
    fontSize: 12,
    color: "#444",
    fontWeight: "500",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskItemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EEF2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4F86C6",
  },
});

export default TasksTracker;
