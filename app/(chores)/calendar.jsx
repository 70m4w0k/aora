import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const WEEKS_IN_YEAR = 52;
const COLUMN_WIDTH = 60;
const ROW_HEIGHT = 40;
const TASK_COLUMN_WIDTH = 120;

const getFirstDayOfWeek = (weekNumber, year = 2024) => {
  // Create a date for January 1st of the given year
  const firstDayOfYear = new Date(year, 0, 1);

  // Get the day of the week for January 1st (0 = Sunday, 6 = Saturday)
  const firstDayWeekDay = firstDayOfYear.getDay();

  // Calculate the day difference to reach the first Monday (week starts on Monday)
  const dayOffset = firstDayWeekDay === 0 ? 6 : firstDayWeekDay - 1;

  // Calculate the first Monday of the year
  const firstMonday = new Date(firstDayOfYear);
  firstMonday.setDate(firstDayOfYear.getDate() + ((7 - dayOffset) % 7));

  // Calculate the start date of the requested week number
  const firstDayOfRequestedWeek = new Date(firstMonday);
  firstDayOfRequestedWeek.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);

  return firstDayOfRequestedWeek.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const ChoreTaskDisplay = ({ initialTasks }) => {
  const [tasks, setTasks] = useState(initialTasks);

  const toggleTask = (taskId, weekIndex) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completedWeeks: task.completedWeeks.map((completed, index) =>
                index === weekIndex ? !completed : completed
              ),
            }
          : task
      )
    );
  };

  console.log(tasks);
  return (
    <View style={styles.container}>
      <View style={styles.taskColumn}>
        <View style={[styles.headerCell, { width: TASK_COLUMN_WIDTH }]}>
          <Text style={styles.headerText}>Tasks</Text>
        </View>
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
                    style={[styles.cell, { width: COLUMN_WIDTH }]}
                    onPress={() => toggleTask(task.id, index)}
                  >
                    <View
                      style={[styles.checkbox, completed && styles.checked]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#e0e0e0",
  },
  headerCell: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#ccc",
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  cell: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#ccc",
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

const initialTasks = [
  {
    id: "1",
    name: "Clean gutters",
    completedWeeks: Array(52).fill(false), // Initialize all weeks as not completed
  },
  {
    id: "2",
    name: "Mow lawn",
    completedWeeks: Array(52).fill(false),
  },
  // Add more tasks...
];

const calendar = () => {
  return <ChoreTaskDisplay initialTasks={initialTasks} />;
};
export default calendar;
