import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CreateTaskModal from "./CreateTaskModal";

// Edit Task Modal Component
const EditTaskModal = ({ visible, task, onClose, onSave }) => {
  const [title, setTitle] = useState("");
  const [recurrence, setRecurrence] = useState("weekly");

  useEffect(() => {
    if (task) {
      setTitle(task.name || task.title || "");
      setRecurrence(task.recurrence || "weekly");
    }
  }, [task]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a task name");
      return;
    }
    onSave(title.trim(), recurrence);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={editStyles.overlay}>
        <View style={editStyles.content}>
          <Text style={editStyles.title}>Edit Task</Text>
          
          <Text style={editStyles.label}>Task Name</Text>
          <TextInput
            style={editStyles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Task name"
            placeholderTextColor="#71717A"
          />
          
          <Text style={editStyles.label}>Recurrence</Text>
          <View style={editStyles.recurrenceRow}>
            {["daily", "weekly", "monthly"].map((r) => (
              <TouchableOpacity
                key={r}
                style={[editStyles.recurrenceBtn, recurrence === r && editStyles.recurrenceBtnActive]}
                onPress={() => setRecurrence(r)}
              >
                <Text style={[editStyles.recurrenceText, recurrence === r && editStyles.recurrenceTextActive]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={editStyles.buttons}>
            <TouchableOpacity style={editStyles.cancelBtn} onPress={onClose}>
              <Text style={editStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={editStyles.saveBtn} onPress={handleSave}>
              <Text style={editStyles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const editStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#1A1A1F",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#A1A1AA",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#111114",
    borderRadius: 12,
    padding: 14,
    color: "#FFF",
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  recurrenceRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  recurrenceBtn: {
    flex: 1,
    backgroundColor: "#111114",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  recurrenceBtnActive: {
    backgroundColor: "#06B6D4",
    borderColor: "#06B6D4",
  },
  recurrenceText: {
    color: "#A1A1AA",
    fontWeight: "500",
  },
  recurrenceTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#222228",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelText: {
    color: "#A1A1AA",
    fontWeight: "600",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#06B6D4",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
import { useGlobalContext } from "../../context/GlobalProvider";
import { getWeekNumberByDate } from "../../lib/utils";
import {
  createTaskDone,
  deleteTaskDone,
  deleteTask,
  updateTask,
  getHouseholdMembers,
  getHouseholdTasks,
  getAllTasksDone,
  getLatestTasksImplByTaskId,
} from "../../lib/appwrite";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const WEEKS_IN_YEAR = 52;

// Color scale for heatmap (dark theme friendly)
const HEATMAP_COLORS = [
  "#1A1A1F",   // 0 - no activity
  "#0E4429",   // 1-2 tasks
  "#006D32",   // 3-4 tasks
  "#26A641",   // 5-6 tasks
  "#39D353",   // 7+ tasks
];

const TasksTracker = ({ initialTasks, householdId }) => {
  const { user } = useGlobalContext();
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState(initialTasks || []);
  const [tasksDone, setTasksDone] = useState([]);
  const [currentWeekNumber] = useState(getWeekNumberByDate(new Date()));
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [stats, setStats] = useState({
    totalTasksThisMonth: 0,
    userTasksThisMonth: 0,
    weekStreak: 0,
    userContributions: {},
    weeklyActivity: Array(WEEKS_IN_YEAR).fill(0),
  });

  // Modals
  const [createTaskModalVisible, setCreateTaskModalVisible] = useState(false);
  const [editTaskModalVisible, setEditTaskModalVisible] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [selectedTab, setSelectedTab] = useState("tasks"); // tasks, heatmap, fairness

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heatmapScrollRef = useRef(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    if (householdId) {
      fetchAllData();
    }
  }, [householdId]);

  useEffect(() => {
    setTasks(initialTasks || []);
  }, [initialTasks]);

  useEffect(() => {
    if (users.length > 0 && tasksDone.length >= 0) {
      calculateStats();
    }
  }, [tasks, tasksDone, users]);

  // Scroll heatmap to current week when tab selected
  useEffect(() => {
    if (selectedTab === "heatmap" && heatmapScrollRef.current) {
      const CELL_WIDTH = 25; // 22 cell + 3 gap
      const LABEL_OFFSET = 80; // label width
      // Center current week in view (scroll so week is ~1/3 from left)
      const targetX = Math.max(0, (currentWeekNumber - 8) * CELL_WIDTH);
      setTimeout(() => {
        heatmapScrollRef.current?.scrollTo({ x: targetX, animated: true });
      }, 150);
    }
  }, [selectedTab, currentWeekNumber]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [members, allTasksDone] = await Promise.all([
        getHouseholdMembers(householdId),
        getAllTasksDone(householdId),
      ]);
      setUsers(members || []);
      setTasksDone(allTasksDone || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Tasks done this month
    const monthTasksDone = tasksDone.filter(td => new Date(td.doneDate) >= startOfMonth);
    const userMonthTasks = monthTasksDone.filter(td => {
      const tdUserId = typeof td.userId === 'object' ? td.userId.$id : td.userId;
      return tdUserId === user?.$id;
    });

    // User contributions (all time for fairness)
    const contributions = {};
    users.forEach(u => {
      contributions[u.$id] = {
        username: u.username,
        color: u.color || "#8B5CF6",
        count: 0,
      };
    });

    tasksDone.forEach(td => {
      const tdUserId = typeof td.userId === 'object' ? td.userId.$id : td.userId;
      if (contributions[tdUserId]) {
        contributions[tdUserId].count++;
      }
    });

    // Weekly activity for heatmap
    const weeklyActivity = Array(WEEKS_IN_YEAR).fill(0);
    tasksDone.forEach(td => {
      if (td.weekNumber && td.weekNumber >= 1 && td.weekNumber <= WEEKS_IN_YEAR) {
        weeklyActivity[td.weekNumber - 1]++;
      }
    });

    // Calculate streak
    let streak = 0;
    for (let week = currentWeekNumber - 1; week >= 0; week--) {
      if (weeklyActivity[week] > 0) {
        streak++;
      } else {
        break;
      }
    }

    setStats({
      totalTasksThisMonth: monthTasksDone.length,
      userTasksThisMonth: userMonthTasks.length,
      weekStreak: streak,
      userContributions: contributions,
      weeklyActivity,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [householdTasks, allTasksDone] = await Promise.all([
        getHouseholdTasks(householdId),
        getAllTasksDone(householdId),
      ]);
      setTasks(householdTasks || []);
      setTasksDone(allTasksDone || []);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await createTaskDone({
        taskId,
        userId: user.$id,
        weekNumber: currentWeekNumber,
        doneDate: new Date().toISOString(),
        householdId,
      });
      Alert.alert("✅ Done!", "Task marked as complete");
      await onRefresh();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteTask = (taskId, taskName) => {
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${taskName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTask(taskId);
              await onRefresh();
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setEditTaskModalVisible(true);
  };

  const handleUpdateTask = async (newTitle, newRecurrence) => {
    if (!taskToEdit) return;
    
    try {
      await updateTask(taskToEdit.id || taskToEdit.$id, {
        title: newTitle,
        recurrence: newRecurrence,
      });
      setEditTaskModalVisible(false);
      setTaskToEdit(null);
      await onRefresh();
      Alert.alert("Success", "Task updated!");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Helper to get task name (handles both 'name' and 'title' properties)
  const getTaskName = (task) => {
    return task?.name || task?.title || "Unnamed Task";
  };

  // Helper to get task ID
  const getTaskId = (task) => {
    return task?.id || task?.$id;
  };

  const getTaskStatus = (task) => {
    const taskId = getTaskId(task);
    
    // Check if completed this week
    const taskDoneThisWeek = tasksDone.find(td => {
      const tdTaskId = typeof td.taskId === 'object' ? td.taskId.$id : td.taskId;
      return tdTaskId === taskId && td.weekNumber === currentWeekNumber;
    });

    if (taskDoneThisWeek) {
      const completedBy = typeof taskDoneThisWeek.userId === 'object' 
        ? taskDoneThisWeek.userId 
        : users.find(u => u.$id === taskDoneThisWeek.userId);
      return {
        completed: true,
        completedBy: completedBy?.username || "Someone",
        completedByColor: completedBy?.color || "#22C55E",
        doneDate: taskDoneThisWeek.doneDate,
      };
    }

    // Find last completion
    const lastCompletion = tasksDone
      .filter(td => {
        const tdTaskId = typeof td.taskId === 'object' ? td.taskId.$id : td.taskId;
        return tdTaskId === taskId;
      })
      .sort((a, b) => new Date(b.doneDate) - new Date(a.doneDate))[0];

    if (lastCompletion) {
      const completedBy = typeof lastCompletion.userId === 'object'
        ? lastCompletion.userId
        : users.find(u => u.$id === lastCompletion.userId);
      
      const daysAgo = Math.floor((new Date() - new Date(lastCompletion.doneDate)) / (1000 * 60 * 60 * 24));
      
      return {
        completed: false,
        lastCompletedBy: completedBy?.username || "Unknown",
        lastCompletedByColor: completedBy?.color || "#71717A",
        daysAgo,
        weekNumber: lastCompletion.weekNumber,
      };
    }

    return { completed: false, neverDone: true };
  };

  const getHeatmapColor = (count) => {
    if (count === 0) return HEATMAP_COLORS[0];
    if (count <= 2) return HEATMAP_COLORS[1];
    if (count <= 4) return HEATMAP_COLORS[2];
    if (count <= 6) return HEATMAP_COLORS[3];
    return HEATMAP_COLORS[4];
  };

  // ==================== RENDER COMPONENTS ====================

  // Stats Header
  const renderStatsHeader = () => {
    const totalContributions = Object.values(stats.userContributions).reduce((sum, u) => sum + u.count, 0);
    const userContribution = stats.userContributions[user?.$id]?.count || 0;
    const userPercentage = totalContributions > 0 ? Math.round((userContribution / totalContributions) * 100) : 0;

    return (
      <View style={styles.statsHeader}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.userTasksThisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.weekStreak}🔥</Text>
            <Text style={styles.statLabel}>Week Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userPercentage}%</Text>
            <Text style={styles.statLabel}>Your Share</Text>
          </View>
        </View>
      </View>
    );
  };

  // Tab Switcher
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === "tasks" && styles.tabActive]}
        onPress={() => setSelectedTab("tasks")}
      >
        <Ionicons name="checkbox" size={18} color={selectedTab === "tasks" ? "#06B6D4" : "#71717A"} />
        <Text style={[styles.tabText, selectedTab === "tasks" && styles.tabTextActive]}>Tasks</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedTab === "heatmap" && styles.tabActive]}
        onPress={() => setSelectedTab("heatmap")}
      >
        <Ionicons name="grid" size={18} color={selectedTab === "heatmap" ? "#06B6D4" : "#71717A"} />
        <Text style={[styles.tabText, selectedTab === "heatmap" && styles.tabTextActive]}>Activity</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedTab === "fairness" && styles.tabActive]}
        onPress={() => setSelectedTab("fairness")}
      >
        <Ionicons name="people" size={18} color={selectedTab === "fairness" ? "#06B6D4" : "#71717A"} />
        <Text style={[styles.tabText, selectedTab === "fairness" && styles.tabTextActive]}>Fairness</Text>
      </TouchableOpacity>
    </View>
  );

  // Task Card
  const renderTaskCard = ({ item: task }) => {
    const status = getTaskStatus(task);
    const taskName = getTaskName(task);
    const taskId = getTaskId(task);
    
    return (
      <View style={[styles.taskCard, status.completed && styles.taskCardCompleted]}>
        <View style={styles.taskCardLeft}>
          <View style={[styles.taskIcon, status.completed && styles.taskIconCompleted]}>
            <Ionicons 
              name={status.completed ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={status.completed ? "#22C55E" : "#06B6D4"} 
            />
          </View>
          <View style={styles.taskInfo}>
            <Text style={[styles.taskName, status.completed && styles.taskNameCompleted]}>
              {taskName}
            </Text>
            {status.completed ? (
              <Text style={styles.taskStatus}>
                ✓ Done by <Text style={{ color: status.completedByColor }}>{status.completedBy}</Text>
              </Text>
            ) : status.neverDone ? (
              <Text style={styles.taskStatusWarning}>Never completed</Text>
            ) : (
              <Text style={styles.taskStatus}>
                Last: <Text style={{ color: status.lastCompletedByColor }}>{status.lastCompletedBy}</Text>
                {status.daysAgo !== undefined && ` • ${status.daysAgo}d ago`}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.taskCardRight}>
          {!status.completed && (
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={() => handleCompleteTask(taskId)}
            >
              <Text style={styles.completeButtonText}>Done</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.editTaskButton}
            onPress={() => handleEditTask(task)}
          >
            <Ionicons name="pencil-outline" size={16} color="#8B5CF6" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteTaskButton}
            onPress={() => handleDeleteTask(taskId, taskName)}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Tasks List
  const renderTasksList = () => {
    const completedTasks = tasks.filter(t => getTaskStatus(t).completed);
    const pendingTasks = tasks.filter(t => !getTaskStatus(t).completed);

    return (
      <ScrollView 
        style={styles.tasksList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Week Info */}
        <View style={styles.weekBanner}>
          <Ionicons name="calendar" size={16} color="#06B6D4" />
          <Text style={styles.weekBannerText}>Week {currentWeekNumber} of {WEEKS_IN_YEAR}</Text>
        </View>

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>⏳ To Do ({pendingTasks.length})</Text>
            {pendingTasks.map(task => (
              <View key={task.id}>{renderTaskCard({ item: task })}</View>
            ))}
          </>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>✅ Done This Week ({completedTasks.length})</Text>
            {completedTasks.map(task => (
              <View key={task.id}>{renderTaskCard({ item: task })}</View>
            ))}
          </>
        )}

        {tasks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkbox-outline" size={64} color="#3F3F46" />
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptySubtitle}>Create your first household task</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  // Heatmap Calendar (GitHub style) - Stacked per user
  const renderHeatmap = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const CELL_SIZE = 22;
    const CELL_GAP = 3;
    const ROW_GAP = 6;
    const LABEL_WIDTH = 80;
    const GRID_WIDTH = (CELL_SIZE + CELL_GAP) * WEEKS_IN_YEAR;
    
    // Month positions (approximate week for each month start)
    const monthPositions = [0, 4, 8, 13, 17, 22, 26, 30, 35, 39, 44, 48];
    
    // User colors
    const userColors = [
      "#8B5CF6", // Purple
      "#06B6D4", // Cyan
      "#F59E0B", // Amber
      "#10B981", // Emerald
      "#F43F5E", // Rose
      "#3B82F6", // Blue
    ];
    
    // Calculate weekly activity per user
    const userWeeklyActivity = users.map((u, index) => {
      const weeks = Array(WEEKS_IN_YEAR).fill(0);
      const color = u.color || userColors[index % userColors.length];
      
      tasksDone.forEach(td => {
        const tdUserId = typeof td.userId === 'object' ? td.userId.$id : td.userId;
        if (tdUserId === u.$id && td.weekNumber >= 1 && td.weekNumber <= WEEKS_IN_YEAR) {
          weeks[td.weekNumber - 1]++;
        }
      });
      
      return {
        id: u.$id,
        username: u.username,
        color,
        weeks,
        total: weeks.reduce((sum, w) => sum + w, 0),
      };
    });
    
    // Get cell color based on count and user color
    const getCellColor = (count, userColor) => {
      if (count === 0) return "#1E1E24"; // Dark empty cell (visible against background)
      const opacity = Math.min(0.3 + (count * 0.2), 1); // 0.3 to 1.0 based on count
      return userColor + Math.round(opacity * 255).toString(16).padStart(2, '0');
    };
    
    return (
      <ScrollView style={styles.heatmapContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.heatmapTitle}>📊 Yearly Activity</Text>
        <Text style={styles.heatmapSubtitle}>Tasks completed per week • Scroll → to see full year</Text>

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
                            `${userData.username} • Week ${weekIndex + 1}`,
                            count > 0 ? `${count} task${count > 1 ? 's' : ''} completed` : "No tasks this week"
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
                    Total
                  </Text>
                </View>
                
                <View style={styles.heatmapRowCells}>
                  {stats.weeklyActivity.map((count, weekIndex) => (
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
                          `Household • Week ${weekIndex + 1}`,
                          count > 0 ? `${count} task${count > 1 ? 's' : ''} completed` : "No tasks this week"
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
              <Text style={[styles.legendUsername, { color: "#06B6D4" }]}>Total</Text>
              <Text style={[styles.legendCount, { color: "#06B6D4" }]}>{tasksDone.length}</Text>
            </View>
          </View>
        </View>

        {/* Week indicator */}
        <Text style={styles.heatmapWeekIndicator}>
          📍 Current: Week {currentWeekNumber} of {WEEKS_IN_YEAR}
        </Text>

        {/* Stats summary */}
        <View style={styles.heatmapStats}>
          <View style={styles.heatmapStatItem}>
            <Text style={styles.heatmapStatValue}>{tasksDone.length}</Text>
            <Text style={styles.heatmapStatLabel}>Total Completions</Text>
          </View>
          <View style={styles.heatmapStatItem}>
            <Text style={styles.heatmapStatValue}>{stats.weeklyActivity.filter(w => w > 0).length}</Text>
            <Text style={styles.heatmapStatLabel}>Active Weeks</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Fairness View
  const renderFairness = () => {
    const contributions = Object.values(stats.userContributions);
    const totalContributions = contributions.reduce((sum, u) => sum + u.count, 0);
    const maxContribution = Math.max(...contributions.map(u => u.count), 1);

    // Task breakdown per user
    const taskBreakdown = {};
    tasks.forEach(task => {
      const taskId = getTaskId(task);
      const taskName = getTaskName(task);
      taskBreakdown[taskId] = { name: taskName, completions: {} };
      users.forEach(u => {
        taskBreakdown[taskId].completions[u.$id] = 0;
      });
    });

    tasksDone.forEach(td => {
      const tdTaskId = typeof td.taskId === 'object' ? td.taskId.$id : td.taskId;
      const tdUserId = typeof td.userId === 'object' ? td.userId.$id : td.userId;
      if (taskBreakdown[tdTaskId] && taskBreakdown[tdTaskId].completions[tdUserId] !== undefined) {
        taskBreakdown[tdTaskId].completions[tdUserId]++;
      }
    });

    return (
      <ScrollView style={styles.fairnessContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.fairnessTitle}>📊 Contribution Breakdown</Text>
        
        {/* Overall Contributions */}
        <View style={styles.contributionBars}>
          {contributions.sort((a, b) => b.count - a.count).map((userContrib, index) => {
            const percentage = totalContributions > 0 ? Math.round((userContrib.count / totalContributions) * 100) : 0;
            const barWidth = (userContrib.count / maxContribution) * 100;
            
            return (
              <View key={index} style={styles.contributionRow}>
                <View style={styles.contributionUser}>
                  <View style={[styles.userAvatar, { backgroundColor: userContrib.color }]}>
                    <Text style={styles.userAvatarText}>{userContrib.username?.[0]?.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.contributionUsername}>{userContrib.username}</Text>
                </View>
                <View style={styles.contributionBarContainer}>
                  <View style={[styles.contributionBar, { width: `${barWidth}%`, backgroundColor: userContrib.color }]} />
                </View>
                <Text style={styles.contributionPercent}>{percentage}%</Text>
              </View>
            );
          })}
        </View>

        {/* Task-specific breakdown */}
        <Text style={styles.fairnessSubtitle}>🎯 Who Does What</Text>
        {Object.values(taskBreakdown).map((task, index) => {
          const totalForTask = Object.values(task.completions).reduce((sum, c) => sum + c, 0);
          if (totalForTask === 0) return null;
          
          return (
            <View key={index} style={styles.taskBreakdown}>
              <Text style={styles.taskBreakdownName}>{task.name}</Text>
              <View style={styles.taskBreakdownBars}>
                {users.map(u => {
                  const count = task.completions[u.$id] || 0;
                  const percentage = totalForTask > 0 ? Math.round((count / totalForTask) * 100) : 0;
                  if (percentage === 0) return null;
                  
                  return (
                    <View 
                      key={u.$id} 
                      style={[styles.taskBreakdownSegment, { width: `${percentage}%`, backgroundColor: u.color || "#8B5CF6" }]}
                    >
                      {percentage >= 15 && <Text style={styles.segmentText}>{u.username?.split(' ')[0]}</Text>}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        {totalContributions === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={64} color="#3F3F46" />
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptySubtitle}>Complete some tasks to see the breakdown</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chores</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setCreateTaskModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Header */}
      {renderStatsHeader()}

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      <View style={styles.content}>
        {selectedTab === "tasks" && renderTasksList()}
        {selectedTab === "heatmap" && renderHeatmap()}
        {selectedTab === "fairness" && renderFairness()}
      </View>

      {/* Refresh indicator */}
      {refreshing && (
        <View style={styles.refreshOverlay}>
          <Text style={styles.refreshText}>Refreshing...</Text>
        </View>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        visible={createTaskModalVisible}
        onClose={() => setCreateTaskModalVisible(false)}
        onTaskCreated={onRefresh}
        householdId={householdId}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        visible={editTaskModalVisible}
        task={taskToEdit}
        onClose={() => {
          setEditTaskModalVisible(false);
          setTaskToEdit(null);
        }}
        onSave={handleUpdateTask}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#111114",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFF",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#06B6D4",
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Stats Header
  statsHeader: {
    backgroundColor: "#111114",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
  },
  statLabel: {
    fontSize: 11,
    color: "#71717A",
    marginTop: 4,
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#111114",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1A1A1F",
    gap: 6,
  },
  tabActive: {
    backgroundColor: "rgba(6, 182, 212, 0.15)",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#71717A",
  },
  tabTextActive: {
    color: "#06B6D4",
  },

  content: {
    flex: 1,
  },

  // Week Banner
  weekBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6, 182, 212, 0.1)",
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  weekBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#06B6D4",
  },

  // Tasks List
  tasksList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A1A1AA",
    marginBottom: 12,
    marginTop: 8,
  },

  // Task Card
  taskCard: {
    backgroundColor: "#1A1A1F",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskCardCompleted: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  taskCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  taskIconCompleted: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 4,
  },
  taskNameCompleted: {
    color: "#22C55E",
  },
  taskStatus: {
    fontSize: 13,
    color: "#71717A",
  },
  taskStatusWarning: {
    fontSize: 13,
    color: "#F59E0B",
  },
  taskCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  completeButton: {
    backgroundColor: "#06B6D4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  completeButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  editTaskButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteTaskButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Heatmap
  heatmapContainer: {
    flex: 1,
    padding: 20,
  },
  heatmapTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 6,
  },
  heatmapSubtitle: {
    fontSize: 14,
    color: "#71717A",
    marginBottom: 20,
  },
  heatmapScroll: {
    marginBottom: 12,
  },
  stackedHeatmapCard: {
    backgroundColor: "#131316",
    borderRadius: 16,
    padding: 18,
    paddingBottom: 40,
    marginBottom: 16,
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
    paddingRight: 10,
  },
  rowLabelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  rowLabelText: {
    fontSize: 13,
    color: "#A1A1AA",
    fontWeight: "500",
  },
  heatmapRowCells: {
    flexDirection: "row",
  },
  stackedCell: {
    borderRadius: 4,
  },
  currentWeekCell: {
    borderWidth: 2,
    borderColor: "#FFF",
  },
  stackedMonthLabel: {
    fontSize: 12,
    color: "#71717A",
    fontWeight: "500",
  },
  stackedLegend: {
    backgroundColor: "#131316",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendUsername: {
    fontSize: 14,
    color: "#A1A1AA",
    marginRight: 6,
  },
  legendCount: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
  },
  monthRow: {
    flexDirection: "row",
    height: 22,
    marginBottom: 6,
    position: "relative",
  },
  monthLabel: {
    position: "absolute",
    fontSize: 11,
    color: "#71717A",
    fontWeight: "500",
  },
  monthLabels: {
    flexDirection: "row",
    height: 20,
    marginBottom: 8,
    position: "relative",
    width: WEEKS_IN_YEAR * 18,
  },
  monthLabel: {
    fontSize: 11,
    color: "#71717A",
    position: "absolute",
  },
  heatmapLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
  },
  legendText: {
    fontSize: 11,
    color: "#71717A",
    marginHorizontal: 4,
  },
  legendCell: {
    width: 20,
    height: 20,
    borderRadius: 4,
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

  // Fairness
  fairnessContainer: {
    flex: 1,
    padding: 20,
  },
  fairnessTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 20,
  },
  fairnessSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 24,
    marginBottom: 16,
  },
  contributionBars: {
    gap: 12,
  },
  contributionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contributionUser: {
    flexDirection: "row",
    alignItems: "center",
    width: 100,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  userAvatarText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 12,
  },
  contributionUsername: {
    fontSize: 13,
    color: "#A1A1AA",
    flex: 1,
  },
  contributionBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#1A1A1F",
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: "hidden",
  },
  contributionBar: {
    height: "100%",
    borderRadius: 4,
  },
  contributionPercent: {
    width: 40,
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
    textAlign: "right",
  },

  // Task Breakdown
  taskBreakdown: {
    marginBottom: 16,
  },
  taskBreakdownName: {
    fontSize: 13,
    color: "#A1A1AA",
    marginBottom: 8,
  },
  taskBreakdownBars: {
    flexDirection: "row",
    height: 24,
    borderRadius: 6,
    overflow: "hidden",
  },
  taskBreakdownSegment: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  segmentText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFF",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#71717A",
    marginTop: 4,
  },

  // Refresh
  refreshOverlay: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  refreshText: {
    backgroundColor: "#1A1A1F",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    color: "#FFF",
    fontSize: 13,
  },
});

export default TasksTracker;

