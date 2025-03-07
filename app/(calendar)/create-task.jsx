import { useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  View, 
  Text, 
  Alert, 
  ScrollView, 
  StyleSheet, 
  TextInput,
  TouchableOpacity
} from "react-native";
import { RecurrenceOptions, createChore } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";

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

const CreateTask = () => {
  const { user } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    recurrence: RecurrenceOptions.WEEKLY,
  });

  const handleSubmit = async () => {
    if (form.title.trim() === "") {
      return Alert.alert("Error", "Please provide a chore title");
    }

    setLoading(true);
    try {
      await createChore({
        title: form.title,
        recurrence: form.recurrence.toLowerCase(),
      });

      Alert.alert(
        "Success", 
        "Chore created successfully",
        [
          { 
            text: "OK", 
            onPress: () => router.back() 
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Create New Chore</Text>
          <Text style={styles.subtitle}>
            Add a new chore to your household task list
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Chore Title</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(text) => setForm({ ...form, title: text })}
            placeholder="Enter chore title..."
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>How often should this chore be done?</Text>
          <View style={styles.recurrenceContainer}>
            <RecurrenceButton
              label="Daily"
              value={RecurrenceOptions.DAILY}
              selected={form.recurrence}
              onPress={(value) => setForm({ ...form, recurrence: value })}
            />
            <RecurrenceButton
              label="Weekly"
              value={RecurrenceOptions.WEEKLY}
              selected={form.recurrence}
              onPress={(value) => setForm({ ...form, recurrence: value })}
            />
            <RecurrenceButton
              label="Monthly"
              value={RecurrenceOptions.MONTHLY}
              selected={form.recurrence}
              onPress={(value) => setForm({ ...form, recurrence: value })}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.loadingButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Creating..." : "Create Chore"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161622",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#CDCDE0",
  },
  formContainer: {
    backgroundColor: "#232533",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#333",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "white",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#444",
  },
  recurrenceContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  recurrenceButton: {
    flex: 1,
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  selectedRecurrenceButton: {
    backgroundColor: "#8e9aaf",
    borderColor: "#9facbf",
  },
  recurrenceButtonText: {
    color: "#CDCDE0",
    fontWeight: "bold",
  },
  selectedRecurrenceText: {
    color: "white",
  },
  submitButton: {
    backgroundColor: "#8e9aaf",
    borderRadius: 4,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  loadingButton: {
    backgroundColor: "#6a7382",
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderRadius: 4,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  cancelButtonText: {
    color: "#CDCDE0",
    fontWeight: "bold",
  },
});

export default CreateTask;
