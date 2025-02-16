import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import LegendModal from "./LegendModal";
import CreateTaskModal from "./CreateTaskModal";
import { useGlobalContext } from "../context/GlobalProvider";
import { getFirstDayOfWeek, getWeekNumberByDate } from "../lib/utils";
import { createTaskDone, deleteTaskDone, getAllUsers } from "../lib/appwrite";

const WEEKS_IN_YEAR = 52;
const COLUMN_WIDTH = 60;
const ROW_HEIGHT = 40;
const TASK_COLUMN_WIDTH = 120;

const TasksTracker = ({ initialTasks }) => {
  const { user } = useGlobalContext();
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState(initialTasks);
  const [currentWeekNumber, setCurrentWeekNumber] = useState(
    getWeekNumberByDate(new Date())
  );

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
    scrollRef.current?.scrollTo({ x: currentWeekXPos, animated: true });
  };

  const fetchUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const toggleTask = async (taskId, weekIndex) => {
    console.log("toggleTask() - taskId", taskId);
    console.log("toggleTask() - weekIndex", weekIndex);
    console.log("toggleTask() - user", user);
    const task = tasks.find((task) => task.id === taskId);
    console.log("toggleTask() - task", task);
    const isCompletedByUser = task.completedWeeks[weekIndex]?.$id === user.$id;

    const taskDoneToCreate = {
      done: true,
      doneDate: weekIndex + 1,
      userId: user.$id,
      taskId: task.id,
    };

    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const updatedCompletedWeeks = task.completedWeeks.map(
          (prevUser, index) => {
            if (index === weekIndex) {
              if (isCompletedByUser) {
                // Task is being unchecked, so delete the task completion record
                try {
                  deleteTaskDone(taskId, user.$id, weekIndex + 1);
                } catch (error) {
                  console.error("Error deleting task implementation:", error);
                }
                return ""; // Clear the completed task for this week
              }
              return user; // Mark the task as completed by this user
            }
            return prevUser;
          }
        );

        return { ...task, completedWeeks: updatedCompletedWeeks };
      }
      return task;
    });

    // Update the tasks state
    setTasks(updatedTasks);

    // If the task was uncompleted, no need to create a new task completion record
    if (isCompletedByUser) return;

    // Create TaskDone when the task is completed
    try {
      await createTaskDone(taskDoneToCreate);
    } catch (error) {
      console.error("Error creating task implementation:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.taskColumn}>
        <TouchableOpacity
          style={[styles.headerCell, { width: TASK_COLUMN_WIDTH }]}
          onPress={() => setLegendModalVisible(true)}
        >
          <Text style={styles.headerText}>Legend</Text>
        </TouchableOpacity>
        <ScrollView>
          {tasks.map((task) => (
            <View
              key={task.id}
              style={[styles.cell, { width: TASK_COLUMN_WIDTH }]}
            >
              <Text style={styles.taskText}>{task.name}</Text>
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.addTaskButton}
          onPress={() => setCreateTaskModalVisible(true)}
        >
          <Text style={styles.addTaskButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      >
        <View>
          <View style={styles.header}>
            {[...Array(WEEKS_IN_YEAR)].map((_, index) => (
              <View
                key={index}
                style={[styles.headerCell, { width: COLUMN_WIDTH }]}
              >
                <Text style={styles.headerText}>
                  {getFirstDayOfWeek(index + 1)}
                </Text>
              </View>
            ))}
          </View>
          <ScrollView>
            {tasks.map((task) => (
              <View key={task.id} style={styles.row}>
                {task.completedWeeks.map((completed, index) => (
                  <TouchableOpacity
                    key={index}
                    onLayout={(event) => {
                      if (index + 3 === currentWeekNumber) {
                        const layout = event.nativeEvent.layout;
                        setCurrentWeekXPos(layout.x);
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
                        completed && {
                          backgroundColor: task.completedWeeks[index].color,
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
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
  },
  taskColumn: {
    width: TASK_COLUMN_WIDTH,
    borderRightWidth: 1,
    borderRightColor: "#ccc",
    backgroundColor: "#f0f0f0",
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
  },
  headerCell: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#ccc",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 10,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#ccc",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  currentCell: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#ccc",
    backgroundColor: "#d4d4d4",
  },
  taskText: {
    fontSize: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 3,
  },
  checked: {
    backgroundColor: "#4CAF50",
  },
  addTaskButton: {
    position: "absolute",
    bottom: 10,
    left: 10,
    width: 40,
    height: 40,
    backgroundColor: "#8e9aaf",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    elevation: 3,
  },
  addTaskButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: "45%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  addButton: {
    backgroundColor: "#8e9aaf",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default TasksTracker;
