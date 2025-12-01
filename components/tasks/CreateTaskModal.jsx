import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { createTask } from "../../lib/appwrite";

const RecurrenceButton = ({ label, value, selected, onPress }) => (
  <TouchableOpacity
    style={[
      styles.recurrenceButton,
      selected === value && styles.selectedRecurrenceButton
    ]}
    onPress={() => onPress(value)}
  >
    <Text 
      style={[
        styles.recurrenceButtonText,
        selected === value && styles.selectedRecurrenceText
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const CreateTaskModal = ({ visible, onClose, onTaskCreated, householdId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    recurrence: "weekly",
  });

  const handleSubmit = async () => {
    if (form.title.trim() === "") {
      return Alert.alert("Missing Information", "Please provide a task name");
    }

    if (!householdId) {
      return Alert.alert("Error", "No household found. Please join or create a household first.");
    }

    setIsSubmitting(true);
    try {
      const newTask = await createTask({ ...form, householdId });

      Alert.alert("Success", "Task created successfully");
      // Reset form
      setForm({
        title: "",
        recurrence: "weekly",
      });
      
      // Notify parent component to refresh the task list
      if (onTaskCreated) {
        onTaskCreated(newTask);
      }
      
      onClose();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Task</Text>
          
          <Text style={styles.inputLabel}>Task Name</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(text) => setForm({ ...form, title: text })}
            placeholder="Enter task name"
            placeholderTextColor="#AAAAAA"
          />
          
          <Text style={styles.inputLabel}>How often should this task be done?</Text>
          <View style={styles.recurrenceContainer}>
            <RecurrenceButton
              label="Daily"
              value="daily"
              selected={form.recurrence}
              onPress={(value) => setForm({ ...form, recurrence: value })}
            />
            <RecurrenceButton
              label="Weekly"
              value="weekly"
              selected={form.recurrence}
              onPress={(value) => setForm({ ...form, recurrence: value })}
            />
            <RecurrenceButton
              label="Monthly"
              value="monthly"
              selected={form.recurrence}
              onPress={(value) => setForm({ ...form, recurrence: value })}
            />
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.addButton, isSubmitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.addButtonText}>
                {isSubmitting ? "Creating..." : "Create Task"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#1A1A1F",
    padding: 24,
    borderRadius: 16,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    color: "#FFFFFF",
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#A1A1AA",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    backgroundColor: "#111114",
    color: "#FFFFFF",
    fontSize: 16,
  },
  recurrenceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  recurrenceButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginHorizontal: 4,
    backgroundColor: "#111114",
  },
  selectedRecurrenceButton: {
    backgroundColor: "#06B6D4",
    borderColor: "#06B6D4",
  },
  recurrenceButtonText: {
    color: "#A1A1AA",
    fontWeight: "500",
  },
  selectedRecurrenceText: {
    color: "white",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  cancelButton: {
    backgroundColor: "#222228",
    marginRight: 8,
  },
  addButton: {
    backgroundColor: "#06B6D4",
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "rgba(6,182,212,0.4)",
  },
  cancelButtonText: {
    color: "#A1A1AA",
    fontWeight: "600",
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
});

export default CreateTaskModal;
