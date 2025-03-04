import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import LegendModal from "./LegendModal";
import CreateTaskModal from "./CreateTaskModal";
import { useGlobalContext } from "../context/GlobalProvider";
import { getFirstDayOfWeek, getWeekNumberByDate } from "../lib/utils";
import { createTaskDone, deleteTaskDone, getAllUsers, getAllTasks } from "../lib/appwrite";

const WEEKS_IN_YEAR = 52;
const COLUMN_WIDTH = 60;
const ROW_HEIGHT = 45;
const TASK_COLUMN_WIDTH = 150;

const TasksTracker = ({ initialTasks }) => {
  const { user } = useGlobalContext();
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState(initialTasks);
  const [currentWeekNumber, setCurrentWeekNumber] = useState(
    getWeekNumberByDate(new Date())
  );
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // all, completed, pending

  // Scrolling to current week
  const scrollRef = useRef();
  const [currentWeekXPos, setCurrentWeekXPos] = useState(0);

  // Modals
  const [legendModalVisible, setLegendModalVisible] = useState(false);
  const [createTaskModal, setCreateTaskModalVisible] = useState(false);

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
    const isCompletedByCurrentUser = task.completedWeeks[weekIndex]?.$id === user.$id;

    // If completed by another user, show who completed it
    if (task.completedWeeks[weekIndex] && !isCompletedByCurrentUser) {
      const completedByUser = users.find(u => u.$id === task.completedWeeks[weekIndex].$id);
      const username = completedByUser?.username || "Another user";
      
      Alert.alert(
        "Task Already Completed",
        `This task was completed by ${username}. You can mark it as completed by you as well.`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Mark as done", 
            onPress: () => addUserCompletion(taskId, weekIndex)
          }
        ]
      );
      return;
    }

    // If completed by this user, remove the completion
    if (isCompletedByCurrentUser) {
      try {
        await deleteTaskDone(taskId, user.$id, weekIndex + 1);
        
        // Update UI
        const updatedTasks = tasks.map(t => {
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
      const updatedTasks = tasks.map(task => {
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
  const filteredTasks = tasks.filter(task => {
    if (filter === "all") return true;
    
    // Check if any week is completed
    const hasCompletions = task.completedWeeks.some(completion => completion !== "");
    
    if (filter === "completed") return hasCompletions;
    if (filter === "pending") return !hasCompletions;
    
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.filterHeader}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "all" && styles.activeFilterButton
          ]}
          onPress={() => setFilter("all")}
        >
          <Text style={[
            styles.filterButtonText,
            filter === "all" && styles.activeFilterText
          ]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "pending" && styles.activeFilterButton
          ]}
          onPress={() => setFilter("pending")}
        >
          <Text style={[
            styles.filterButtonText,
            filter === "pending" && styles.activeFilterText
          ]}>Pending</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "completed" && styles.activeFilterButton
          ]}
          onPress={() => setFilter("completed")}
        >
          <Text style={[
            styles.filterButtonText,
            filter === "completed" && styles.activeFilterText
          ]}>Completed</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.legendButton}
          onPress={() => setLegendModalVisible(true)}
        >
          <Text style={styles.legendButtonText}>👤 Users</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.calendarContainer}>
        <View style={styles.taskColumn}>
          <View
            style={[styles.headerCell, { width: TASK_COLUMN_WIDTH }]}
          >
            <Text style={styles.headerText}>Tasks</Text>
          </View>
          <ScrollView>
            {filteredTasks.map((task) => (
              <View
                key={task.id}
                style={[styles.cell, { width: TASK_COLUMN_WIDTH }]}
              >
                <Text style={styles.taskText}>{task.name}</Text>
              </View>
            ))}
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
                    index + 1 === currentWeekNumber && styles.currentWeekHeader
                  ]}
                >
                  <Text 
                    style={[
                      styles.headerText,
                      index + 1 === currentWeekNumber && styles.currentWeekText
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
      
      <TouchableOpacity
        style={styles.addTaskButton}
        onPress={() => setCreateTaskModalVisible(true)}
      >
        <Text style={styles.addTaskButtonText}>+</Text>
      </TouchableOpacity>
      
      <LegendModal
        title="Users"
        users={users}
        visible={legendModalVisible}
        onClose={() => setLegendModalVisible(false)}
      />
      <CreateTaskModal
        visible={createTaskModal}
        onClose={() => setCreateTaskModalVisible(false)}
      />
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
  },
  filterButton: {
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
    marginLeft: "auto",
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
  addTaskButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: "#4F86C6",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 28,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addTaskButtonText: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
});

export default TasksTracker;
