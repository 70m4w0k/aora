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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LegendModal from "./LegendModal";
import CreateTaskModal from "./CreateTaskModal";
import { useGlobalContext } from "../../context/GlobalProvider";
import { getFirstDayOfWeek, getWeekNumberByDate } from "../../lib/utils";
import {
  createTaskDone,
  deleteTaskDone,
  deleteTask,
  getAllUsers,
  getAllTasks,
} from "../../lib/appwrite";

const WEEKS_IN_YEAR = 52;
const COLUMN_WIDTH = 60;
const ROW_HEIGHT = 45;
const TASK_COLUMN_WIDTH = 150;
const VIEW_MODES = {
  CALENDAR: "calendar",
  LIST: "list",
};

const TasksTracker = ({ initialTasks }) => {
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
  const [currentWeekXPos, setCurrentWeekXPos] = useState(0);

  // Modals
  const [legendModalVisible, setLegendModalVisible] = useState(false);
  const [createTaskModal, setCreateTaskModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
    fetchUsers();
    scrollToCurrentWeek();
  }, [initialTasks]);

  const scrollToCurrentWeek = () => {
    // Add a slight delay to ensure the component is rendered
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: currentWeekXPos, animated: true });
    }, 300);
  };

  const fetchUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const allTasks = await getAllTasks();
      // Refresh tasks logic would be here
      // For now, we just refresh the current list
      setTasks([...tasks]);
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

      tasks.forEach((task) => {
        const userCompletions = task.completedWeeks.filter(
          (completion) => completion && completion.$id === user.$id
        ).length;

        totalCompleted += userCompletions;
      });

      return {
        user,
        completedCount: totalCompleted,
        color: user.color || "#4F86C6",
      };
    });

    return stats.sort((a, b) => b.completedCount - a.completedCount);
  }, [tasks, users]);

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

  return (
    <View style={styles.container}>
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
                  onLongPress={() => confirmDeleteTask(task.id)}
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
                colors={["#4F86C6"]} // Blue color that matches our theme
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
                        onLayout={(event) => {
                          if (index + 1 === currentWeekNumber) {
                            const layout = event.nativeEvent.layout;
                            setCurrentWeekXPos(layout.x - 120); // Scroll to show a bit before current week
                          }
                        }}
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
          {/* Task List View */}
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>Tasks</Text>
            <Text style={styles.listHeaderText}>Last Completed</Text>
          </View>

          {sortedTasks.map((task) => {
            const lastCompletion = getLastCompletionInfo(task);

            // Apply different styles based on urgency level
            const urgencyLevel = lastCompletion.urgencyLevel;

            return (
              <View
                key={task.id}
                style={[
                  styles.listItemContainer,
                  styles[`${urgencyLevel}Item`],
                ]}
              >
                <TouchableOpacity
                  style={styles.listItemTitleWrapper}
                  onLongPress={() => confirmDeleteTask(task.id)}
                >
                  <View style={styles.listItemTitleContainer}>
                    <Text
                      style={[
                        styles.listItemTitle,
                        styles[`${urgencyLevel}Text`],
                      ]}
                    >
                      {task.name}
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteIcon}
                      onPress={() => confirmDeleteTask(task.id)}
                    >
                      <Text style={styles.deleteIconText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
                <View style={styles.listItemCompletionWrapper}>
                  <View style={styles.lastCompletionContainer}>
                    <Text style={styles.lastCompletionText}>
                      {lastCompletion.text}
                    </Text>
                    {lastCompletion.user && (
                      <View style={styles.lastCompletionUserContainer}>
                        <Text style={styles.lastCompletionByText}>by: </Text>
                        <View
                          style={[
                            styles.userColorDot,
                            { backgroundColor: lastCompletion.color },
                          ]}
                        />
                        <Text style={styles.lastCompletionUserText}>
                          {lastCompletion.user}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}

          {/* Add button in list view */}
          <TouchableOpacity
            style={styles.listAddButton}
            onPress={() => setCreateTaskModalVisible(true)}
          >
            <Text style={styles.listAddButtonText}>+ Add Task</Text>
          </TouchableOpacity>

          {/* User Stats Section */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsSectionTitle}>
              Task Completion by User
            </Text>
            {userStats.map((stat, index) => (
              <View key={stat.user.$id} style={styles.statItem}>
                <View style={styles.statRank}>
                  <Text style={styles.statRankText}>{index + 1}</Text>
                </View>
                <View style={[styles.statBar, { borderLeftColor: stat.color }]}>
                  <Text style={styles.statUsername}>{stat.user.username}</Text>
                  <Text style={styles.statCount}>
                    {stat.completedCount} tasks completed
                  </Text>
                </View>
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
    </View>
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
    backgroundColor: "#F0F0F0",
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: "#F0F0F0",
  },
  activeFilterButton: {
    backgroundColor: "#4F86C6",
  },
  filterButtonText: {
    fontSize: 12,
    color: "#666666",
  },
  activeFilterText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  legendButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#F0F0F0",
  },
  legendButtonText: {
    fontSize: 12,
    color: "#666666",
  },
  calendarContainer: {
    flex: 1,
    flexDirection: "row",
  },
  taskColumn: {
    width: TASK_COLUMN_WIDTH,
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIconText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
  },
  headerCell: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  currentWeekHeader: {
    backgroundColor: "#E3F2FD", // Light blue background
  },
  headerText: {
    fontWeight: "500",
    fontSize: 12,
    color: "#666666",
  },
  currentWeekText: {
    fontWeight: "bold",
    color: "#4F86C6",
  },
  row: {
    flexDirection: "row",
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
  currentCell: {
    backgroundColor: "#F5F5F5",
  },
  taskText: {
    fontSize: 14,
    color: "#333333",
    paddingHorizontal: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#CCCCCC",
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
    borderBottomColor: "#E0E0E0",
    marginBottom: 12,
  },
  listHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
  },
  listItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  listItemTitleWrapper: {
    flex: 0.4,
  },
  listItemTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listItemTitle: {
    fontSize: 16,
    color: "#333333",
  },
  listItemCompletionWrapper: {
    flex: 0.6,
    alignItems: "flex-end",
  },
  lastCompletionContainer: {
    flex: 1,
    justifyContent: "center",
  },
  lastCompletionText: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  lastCompletionUserContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastCompletionByText: {
    fontSize: 12,
    color: "#888888",
  },
  lastCompletionUserText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#444444",
  },
  userColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  // User stats section
  statsContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statRankText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666666",
  },
  statBar: {
    flex: 1,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  statUsername: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  statCount: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
  },
  // New styles for the add task buttons
  taskAddButton: {
    margin: 10,
    padding: 10,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  taskAddButtonText: {
    color: "#4F86C6",
    fontSize: 14,
    fontWeight: "500",
  },
  listAddButton: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  listAddButtonText: {
    color: "#4F86C6",
    fontSize: 16,
    fontWeight: "500",
  },
  // Delete modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "80%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  deleteModalHeader: {
    backgroundColor: "#F8F8F8",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  deleteModalBody: {
    padding: 20,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  deleteModalActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderRightWidth: 1,
    borderRightColor: "#EEEEEE",
  },
  deleteButton: {
    backgroundColor: "#FFEFEF",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  // Urgency styles for task items
  normalItem: {
    backgroundColor: "#E8F5E9", // Stronger light green
  },
  soonItem: {
    backgroundColor: "#FFF8E1", // Stronger light yellow
  },
  urgentItem: {
    backgroundColor: "#FFE0B2", // Stronger light orange
  },
  overdueItem: {
    backgroundColor: "#FFCDD2", // Stronger light red
  },

  // Text styles for different urgency levels
  normalText: {
    color: "#2E7D32",
    fontWeight: "500",
  },
  soonText: {
    color: "#F57F17",
    fontWeight: "500",
  },
  urgentText: {
    color: "#E65100",
    fontWeight: "500",
  },
  overdueText: {
    color: "#C62828",
    fontWeight: "600",
  },
});

export default TasksTracker;
