import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import LegendModal from "./LegendModal";
import useAppwrite from "../lib/useAppwrite";
import { getAllUsers } from "../lib/appwrite";
import { useGlobalContext } from "../context/GlobalProvider";
import { getFirstDayOfWeek, getWeekNumberByDate } from "../lib/utils";

const USERS = [
  { id: "1", name: "Alice", color: "#FF5733" },
  { id: "2", name: "Bob", color: "#33FF57" },
  { id: "3", name: "Charlie", color: "#3357FF" },
  { id: "4", name: "Diana", color: "#FF33F1" },
];

const WEEKS_IN_YEAR = 52;
const COLUMN_WIDTH = 60;
const ROW_HEIGHT = 40;
const TASK_COLUMN_WIDTH = 120;

const TasksTracker = ({ initialTasks }) => {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState(initialTasks);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentWeekNumber, setCurrentWeekNumber] = useState(
    getWeekNumberByDate(new Date())
  );
  const { user } = useGlobalContext();

  useEffect(() => {
    setTasks(initialTasks);
    fetchUsers();
  }, [initialTasks]);

  const fetchUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error fetching chores:", error);
    }
  };

  const toggleTask = (taskId, weekIndex) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completedWeeks: task.completedWeeks.map((prevUser, index) =>
                index === weekIndex ? (prevUser === user ? "" : user) : prevUser
              ),
            }
          : task
      )
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.taskColumn}>
        <TouchableOpacity
          style={[styles.headerCell, { width: TASK_COLUMN_WIDTH }]}
          onPress={() => setModalVisible(true)}
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
      </View>
      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
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
        users={users}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
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
});

export default TasksTracker;
