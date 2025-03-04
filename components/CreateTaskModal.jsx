import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { createTask } from "../lib/appwrite";
import { RecurrenceOptions } from "../lib/appwrite";

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

const CreateTaskModal = ({ visible, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    recurrence: "weekly",
  });

  const handleSubmit = async () => {
    if (form.title.trim() === "") {
      return Alert.alert("Missing Information", "Please provide a task name");
    }

    setIsSubmitting(true);
    try {
      await createTask(form);

      Alert.alert("Success", "Task created successfully");
      // Reset form
      setForm({
        title: "",
        recurrence: "weekly",
      });
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
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 12,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    color: "#333333",
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#666666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: "#F9F9F9",
    color: "#333333",
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
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginHorizontal: 4,
    backgroundColor: "#F9F9F9",
  },
  selectedRecurrenceButton: {
    backgroundColor: "#4F86C6",
    borderColor: "#4F86C6",
  },
  recurrenceButtonText: {
    color: "#666666",
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
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  cancelButton: {
    backgroundColor: "#F0F0F0",
    marginRight: 8,
  },
  addButton: {
    backgroundColor: "#4F86C6",
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#A5BFE0",
  },
  cancelButtonText: {
    color: "#666666",
    fontWeight: "600",
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
});

export default CreateTaskModal;
