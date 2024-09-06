import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Picker,
  Alert,
} from "react-native";
import { createTask } from "../lib/appwrite";

const CreateTaskModal = ({ visible, onClose }) => {
  // Tasks
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    recurrence: "weekly",
  });
  const submit = async () => {
    if ((form.title.trim() === "") | (form.recurrence.trim() === "")) {
      return Alert.alert("Please provide a name");
    }

    console.log("in summit");
    setUploading(true);
    try {
      await createTask(form);

      Alert.alert("Success", "Post uploaded successfully");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setForm({
        title: "",
        recurrence: "weekly",
      });
      setUploading(false);
      onClose();
    }
  };
  return (
    <Modal visible={visible} transparent={true}>
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
  );
};

const styles = StyleSheet.create({
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

export default CreateTaskModal;
