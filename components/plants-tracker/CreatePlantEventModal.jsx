import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Alert,
  ScrollView,
  Switch,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { useGlobalContext } from "../../context/GlobalProvider";
// import DateTimePicker from '@react-native-community/datetimepicker';
import { createPlantEvent, PlantEventTypes } from "../../lib/appwrite";

const EventTypeButton = ({ label, value, selected, onPress }) => (
  <TouchableOpacity
    style={[
      styles.typeButton,
      selected === value && styles.selectedTypeButton
    ]}
    onPress={() => onPress(value)}
  >
    <Text 
      style={[
        styles.typeButtonText,
        selected === value && styles.selectedTypeText
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const CreatePlantEventModal = ({ visible, onClose, onEventCreated, plant }) => {
  const { user } = useGlobalContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [form, setForm] = useState({
    eventType: PlantEventTypes.WATER,
    date: new Date(),
    notes: "",
    images: [],
    includeWeather: true
  });

  const pickImage = async () => {
    try {
      // Request media library permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'You need to grant permission to access your photos');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        
        // Create the image object in the format expected by appwrite.js
        const imageFile = {
          uri: selectedAsset.uri,
          name: selectedAsset.fileName || 'plant_event.jpg',
          mimeType: selectedAsset.mimeType || 'image/jpeg',
          size: selectedAsset.fileSize || 0,
        };
        
        setForm(prev => ({
          ...prev,
          images: [...prev.images, imageFile]
        }));
        
        setImagePreview(selectedAsset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || form.date;
    setShowDatePicker(false);
    setForm(prev => ({ ...prev, date: currentDate }));
  };

  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      return Alert.alert("Error", "User not found. Please sign in again.");
    }

    if (!plant || !plant.$id) {
      return Alert.alert("Error", "Plant information is missing.");
    }

    setIsSubmitting(true);
    try {
      const newEvent = await createPlantEvent({
        ...form,
        plantId: plant.$id,
        userId: user.$id,
        date: form.date.toISOString(),
      });

      Alert.alert("Success", "Plant event recorded successfully");
      
      // Reset form
      setForm({
        eventType: PlantEventTypes.WATER,
        date: new Date(),
        notes: "",
        images: [],
        includeWeather: true
      });
      setImagePreview(null);
      
      // Notify parent component
      if (onEventCreated) {
        onEventCreated(newEvent);
      }
      
      onClose();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventTypeLabel = (type) => {
    switch(type) {
      case PlantEventTypes.SOW: return "Sow";
      case PlantEventTypes.PLANT: return "Plant";
      case PlantEventTypes.WATER: return "Water";
      case PlantEventTypes.FERTILIZE: return "Fertilize";
      case PlantEventTypes.PRUNE: return "Prune";
      case PlantEventTypes.HARVEST: return "Harvest";
      case PlantEventTypes.TRANSPLANT: return "Transplant";
      case PlantEventTypes.CUTTING: return "Cutting";
      case PlantEventTypes.NOTE: return "Note";
      default: return "Event";
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>
              Record a {getEventTypeLabel(form.eventType)} Event
            </Text>
            
            {plant && (
              <Text style={styles.plantName}>{plant.name}</Text>
            )}
            
            <Text style={styles.inputLabel}>Event Type</Text>
            <View style={styles.typeContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <EventTypeButton
                  label="Water"
                  value={PlantEventTypes.WATER}
                  selected={form.eventType}
                  onPress={(value) => setForm({ ...form, eventType: value })}
                />
                <EventTypeButton
                  label="Fertilize"
                  value={PlantEventTypes.FERTILIZE}
                  selected={form.eventType}
                  onPress={(value) => setForm({ ...form, eventType: value })}
                />
                <EventTypeButton
                  label="Prune"
                  value={PlantEventTypes.PRUNE}
                  selected={form.eventType}
                  onPress={(value) => setForm({ ...form, eventType: value })}
                />
                <EventTypeButton
                  label="Harvest"
                  value={PlantEventTypes.HARVEST}
                  selected={form.eventType}
                  onPress={(value) => setForm({ ...form, eventType: value })}
                />
                <EventTypeButton
                  label="Note"
                  value={PlantEventTypes.NOTE}
                  selected={form.eventType}
                  onPress={(value) => setForm({ ...form, eventType: value })}
                />
              </ScrollView>
            </View>
            
            <View style={styles.secondaryTypeContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <EventTypeButton
                  label="Sow"
                  value={PlantEventTypes.SOW}
                  selected={form.eventType}
                  onPress={(value) => setForm({ ...form, eventType: value })}
                />
                <EventTypeButton
                  label="Plant"
                  value={PlantEventTypes.PLANT}
                  selected={form.eventType}
                  onPress={(value) => setForm({ ...form, eventType: value })}
                />
                <EventTypeButton
                  label="Transplant"
                  value={PlantEventTypes.TRANSPLANT}
                  selected={form.eventType}
                  onPress={(value) => setForm({ ...form, eventType: value })}
                />
                <EventTypeButton
                  label="Cutting"
                  value={PlantEventTypes.CUTTING}
                  selected={form.eventType}
                  onPress={(value) => setForm({ ...form, eventType: value })}
                />
              </ScrollView>
            </View>
            
            <Text style={styles.inputLabel}>Date</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(form.date)}</Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={form.date}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Include Weather Data</Text>
              <Switch
                value={form.includeWeather}
                onValueChange={(value) => setForm(prev => ({ ...prev, includeWeather: value }))}
                trackColor={{ false: "#E0E0E0", true: "#A5D6A7" }}
                thumbColor={form.includeWeather ? "#4CAF50" : "#F5F5F5"}
              />
            </View>
            
            <Text style={styles.inputLabel}>Event Image <Text style={styles.optionalText}>(Optional)</Text></Text>
            <View style={styles.imageUploadContainer}>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={pickImage}
              >
                <Text style={styles.uploadButtonText}>
                  {imagePreview ? 'Add Another Image' : 'Add Image'}
                </Text>
              </TouchableOpacity>
              
              {imagePreview && (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: imagePreview }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setImagePreview(null);
                      setForm(prev => ({ 
                        ...prev, 
                        images: prev.images.filter((_, i) => i !== prev.images.length - 1)
                      }));
                    }}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {form.images.length > 0 && (
                <Text style={styles.imagesCountText}>
                  {form.images.length} image{form.images.length !== 1 ? 's' : ''} selected
                </Text>
              )}
            </View>
            
            <Text style={styles.inputLabel}>Notes <Text style={styles.optionalText}>(Optional)</Text></Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={form.notes}
              onChangeText={(text) => setForm({ ...form, notes: text })}
              placeholder="Add any notes about this event"
              placeholderTextColor="#AAAAAA"
              multiline
            />
            
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
                  {isSubmitting ? "Saving..." : "Save Event"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333333",
    textAlign: "center",
  },
  plantName: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#666666",
  },
  optionalText: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#999999",
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
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  typeContainer: {
    marginBottom: 12,
  },
  secondaryTypeContainer: {
    marginBottom: 24,
  },
  typeButton: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#F9F9F9",
    minWidth: 80,
  },
  selectedTypeButton: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  typeButtonText: {
    color: "#666666",
    fontWeight: "500",
  },
  selectedTypeText: {
    color: "white",
    fontWeight: "600",
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#F9F9F9",
    marginBottom: 20,
  },
  dateText: {
    color: "#333333",
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: 14,
    color: "#666666",
  },
  imageUploadContainer: {
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  uploadButtonText: {
    color: "white",
    fontWeight: "500",
  },
  imagePreviewContainer: {
    position: "relative",
    marginVertical: 8,
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  imagesCountText: {
    textAlign: "center",
    color: "#666666",
    fontSize: 12,
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
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
    backgroundColor: "#4CAF50",
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#A5D6A7",
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

export default CreatePlantEventModal;
