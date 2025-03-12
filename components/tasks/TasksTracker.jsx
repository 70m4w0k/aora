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
  const [taskToViewHistory, setTaskToViewHistory] = useState(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  // For animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
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
          {/* Task List View with Enhanced UI */}
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>Tasks</Text>
            <Text style={styles.listHeaderText}>Last Completed</Text>
          </View>

          {sortedTasks.map((task) => {
            const lastCompletion = getLastCompletionInfo(task);
            const urgencyLevel = lastCompletion.urgencyLevel;

            // Get urgency icon
            let urgencyIcon;
            switch (urgencyLevel) {
              case "overdue":
                urgencyIcon = "alarm-light";
                break;
              case "urgent":
                urgencyIcon = "alert-circle-outline";
                break;
              case "soon":
                urgencyIcon = "clock-time-four-outline";
                break;
              default:
                urgencyIcon = "check-circle-outline";
            }

            return (
              <TouchableOpacity
                key={task.id}
                onPress={() => showTaskHistory(task)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.fancyListItem, styles[`${urgencyLevel}Item`]]}
                >
                  <View style={styles.fancyListItemContent}>
                    <View style={styles.fancyListItemHeader}>
                      <View style={styles.taskTitleContainer}>
                        <MaterialCommunityIcons
                          name={urgencyIcon}
                          size={20}
                          color={styles[`${urgencyLevel}Text`].color}
                          style={styles.urgencyIcon}
                        />
                        <Text
                          style={[
                            styles.fancyListItemTitle,
                            styles[`${urgencyLevel}Text`],
                          ]}
                        >
                          {task.name}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.fancyDeleteIcon}
                        onPress={() => confirmDeleteTask(task.id)}
                      >
                        <Text style={styles.deleteIconText}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.fancyListItemBody}>
                      <View style={styles.lastCompletionInfoCard}>
                        <Text style={styles.lastCompletionHeading}>
                          Last Completed
                        </Text>
                        <Text
                          style={[
                            styles.lastCompletionText,
                            styles[`${urgencyLevel}CompletionText`],
                          ]}
                        >
                          {lastCompletion.text}
                        </Text>

                        {lastCompletion.user && (
                          <View style={styles.userInfoContainer}>
                            <View
                              style={[
                                styles.userAvatar,
                                { backgroundColor: lastCompletion.color },
                              ]}
                            >
                              <Text style={styles.userInitial}>
                                {lastCompletion.user.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.userName}>
                              {lastCompletion.user}
                            </Text>
                          </View>
                        )}

                        {!lastCompletion.user && (
                          <View style={styles.neverCompletedMessage}>
                            <MaterialCommunityIcons
                              name="alert-outline"
                              size={16}
                              color="#888"
                            />
                            <Text style={styles.neverCompletedText}>
                              Never been completed
                            </Text>
                          </View>
                        )}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.quickActionButton,
                          styles[`${urgencyLevel}ActionButton`],
                        ]}
                        onPress={() => {
                          const currentWeek =
                            getWeekNumberByDate(new Date()) - 1;
                          toggleTask(task.id, currentWeek);
                        }}
                      >
                        <MaterialCommunityIcons
                          name="checkbox-marked-circle-outline"
                          size={18}
                          color="#fff"
                        />
                        <Text style={styles.quickActionText}>Mark Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

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

          {/* User Stats Section with Enhanced UI */}
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
                  style={[styles.fancyStatBar, { borderLeftColor: stat.color }]}
                >
                  <View style={styles.fancyStatBarHeader}>
                    <Text style={styles.fancyStatUsername}>
                      {stat.user.username}
                    </Text>
                    <Text style={styles.fancyStatCount}>
                      {stat.completedCount} tasks
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${Math.min(100, stat.completedCount * 5)}%`,
                          backgroundColor: stat.color,
                        },
                      ]}
                    />
                  </View>
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

  // Enhanced list item styles
  fancyListItem: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  },
  fancyDeleteIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  fancyListItemBody: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  lastCompletionInfoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: "100%",
  },
  lastCompletionHeading: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  lastCompletionText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  normalCompletionText: {
    color: "#2E7D32",
  },
  soonCompletionText: {
    color: "#F57F17",
  },
  urgentCompletionText: {
    color: "#E65100",
  },
  overdueCompletionText: {
    color: "#C62828",
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
    color: "#333",
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
});

export default TasksTracker;
