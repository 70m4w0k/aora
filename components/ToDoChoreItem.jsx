import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const ToDoChoreItem = ({
  title,
  lastTimeDone,
  byUser,
  onPress,
  isDone,
  recurrence,
}) => {
  // Helper to get badge color based on recurrence
  const getRecurrenceColor = (rec) => {
    switch(rec) {
      case 'daily':
        return '#e74c3c'; // Red
      case 'weekly':
        return '#3498db'; // Blue
      case 'monthly':
        return '#9b59b6'; // Purple
      default:
        return '#95a5a6'; // Gray
    }
  };

  // Format recurrence for display
  const getRecurrenceLabel = (rec) => {
    if (!rec) return '';
    return rec.charAt(0).toUpperCase() + rec.slice(1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.itemContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            {recurrence && (
              <View 
                style={[
                  styles.recurrenceBadge, 
                  { backgroundColor: getRecurrenceColor(recurrence) }
                ]}
              >
                <Text style={styles.recurrenceText}>
                  {getRecurrenceLabel(recurrence)}
                </Text>
              </View>
            )}
          </View>
          
          {lastTimeDone && <Text style={styles.subtitle}>{lastTimeDone}</Text>}
          {byUser && <Text style={styles.subtitle}>{byUser}</Text>}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.button,
            isDone ? styles.doneButton : styles.pendingButton
          ]}
          onPress={onPress}
        >
          <Text style={styles.buttonText}>
            {isDone ? "✓" : "Do it"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  itemContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  contentContainer: {
    flex: 1,
    marginRight: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginRight: 8,
    flex: 1,
  },
  recurrenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  recurrenceText: {
    fontSize: 10,
    color: "white",
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 4,
  },
  button: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  doneButton: {
    backgroundColor: "#4CAF50",
  },
  pendingButton: {
    backgroundColor: "#4F86C6",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ToDoChoreItem;
