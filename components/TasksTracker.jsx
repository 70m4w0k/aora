import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Picker,
  Alert,
} from "react-native";
import LegendModal from "./LegendModal";
import { createTask, getAllUsers } from "../lib/appwrite";
import { useGlobalContext } from "../context/GlobalProvider";
import { getFirstDayOfWeek, getWeekNumberByDate } from "../lib/utils";

const WEEKS_IN_YEAR = 52;
const COLUMN_WIDTH = 60;
const ROW_HEIGHT = 40;
const TASK_COLUMN_WIDTH = 120;

const TasksTracker = ({ initialTasks }) => {
  // Data
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
  const [newTaskModalVisible, setNewTaskModalVisible] = useState(false);

  // Tasks
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskRecurrence, setNewTaskRecurrence] = useState("weekly");
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    recurrence: "",
  });

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
    // Find out if the task is already completed by the user
    const task = tasks.find((task) => task.id === taskId);
    const isCompletedByUser = task.completedWeeks[weekIndex]?.$id === user.$id;

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completedWeeks: task.completedWeeks.map((prevUser, index) =>
                index === weekIndex ? (isCompletedByUser ? "" : user) : prevUser
              ),
            }
          : task
      )
    );
    const percentageDone = isCompletedByUser ? 0 : 100;

    // Make an async call to createTaskImplementation to persist the task completion
    try {
      await createTaskImplementation({
        percentageDone,
        userId: user.$id,
        taskId: taskId,
        doneDate: weekIndex,
      });
    } catch (error) {
      console.error("Error creating task implementation:", error);
    }
  };

  const submit = async () => {
    if ((form.title.trim() === "") | (form.recurrence.trim() === "")) {
      return Alert.alert("Please provide a name");
    }

    setUploading(true);
    try {
      await createTask(form);

      Alert.alert("Success", "Post uploaded successfully");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setForm({
        title: "",
        recurrence: "",
      });
      setUploading(false);
      setNewTaskModalVisible(false);
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
          onPress={() => setNewTaskModalVisible(true)}
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
      <Modal visible={newTaskModalVisible} transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Task</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(e) => setForm({ ...form, title: e })}
              placeholder="Enter task name"
            />
            <Text style={styles.pickerLabel}>Recurrence:</Text>
            <Picker
              selectedValue={form.recurrence}
              style={styles.picker}
              onValueChange={(itemValue) =>
                setForm({ ...form, recurrence: itemValue })
              }
            >
              <Picker.Item label="Weekly" value="weekly" />
              <Picker.Item label="Monthly" value="monthly" />
            </Picker>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setNewTaskModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={submit}
              >
                <Text style={styles.modalButtonText}>Add</Text>
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
