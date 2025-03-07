import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getPlantImageUrl, getPlantEvents } from "../lib/appwrite";

const PlantCard = ({ plant, onSelect, onAddEvent }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (plant && plant.$id) {
      fetchPlantData();
    }
  }, [plant]);

  const fetchPlantData = async () => {
    setIsLoading(true);
    try {
      // Get plant image if available
      if (plant.mainImageId) {
        const url = await getPlantImageUrl(plant.mainImageId);
        setImageUrl(url);
      }
      
      // Get recent events
      const events = await getPlantEvents(plant.$id);
      setRecentEvents(events.slice(0, 3)); // Get the 3 most recent events
    } catch (error) {
      console.error("Error fetching plant data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'water': return "water-outline";
      case 'fertilize': return "nutrition-outline";
      case 'prune': return "cut-outline";
      case 'harvest': return "basket-outline";
      case 'sow': return "seed-outline";
      case 'plant': return "leaf-outline";
      case 'transplant': return "git-branch-outline";
      case 'cutting': return "cut-outline";
      case 'note': return "create-outline";
      default: return "information-circle-outline";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  // Get the plant type for styling
  const getPlantTypeColor = () => {
    switch (plant.type) {
      case 'vegetable': return "#4CAF50"; // Green
      case 'fruit': return "#FF9800";     // Orange
      case 'herb': return "#8BC34A";      // Light Green
      case 'flower': return "#E91E63";    // Pink
      case 'tree': return "#795548";      // Brown
      default: return "#607D8B";          // Blue Grey
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { borderLeftColor: getPlantTypeColor() }]}
      onPress={() => onSelect(plant)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.plantImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: getPlantTypeColor() + '33' }]}>
              <Ionicons 
                name={plant.type === 'vegetable' ? 'leaf' : 
                      plant.type === 'herb' ? 'leaf' : 
                      plant.type === 'fruit' ? 'nutrition' : 
                      plant.type === 'flower' ? 'flower' : 
                      plant.type === 'tree' ? 'leaf' : 'leaf'} 
                size={32} 
                color={getPlantTypeColor()} 
              />
            </View>
          )}
        </View>
        
        <View style={styles.plantDetails}>
          <Text style={styles.plantName}>{plant.name}</Text>
          {plant.variety && (
            <Text style={styles.varietyText}>{plant.variety}</Text>
          )}
          <Text style={styles.plantType}>
            {plant.type.charAt(0).toUpperCase() + plant.type.slice(1)}
          </Text>
          
          {/* Recent activity */}
          <View style={styles.recentActivity}>
            {recentEvents.length > 0 ? (
              recentEvents.map((event, index) => (
                <View key={index} style={styles.eventItem}>
                  <Ionicons 
                    name={getEventTypeIcon(event.eventType)} 
                    size={14} 
                    color="#666666" 
                  />
                  <Text style={styles.eventText}>
                    {formatDate(event.date)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noEventsText}>No recent activity</Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.addEventButton}
          onPress={() => onAddEvent(plant)}
        >
          <Ionicons name="add-circle" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
  },
  cardContent: {
    flexDirection: "row",
    padding: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 16,
  },
  plantImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
  },
  plantDetails: {
    flex: 1,
    justifyContent: "center",
  },
  plantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 2,
  },
  varietyText: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#666666",
    marginBottom: 4,
  },
  plantType: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 6,
  },
  recentActivity: {
    marginTop: 4,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  eventText: {
    fontSize: 12,
    color: "#666666",
    marginLeft: 4,
  },
  noEventsText: {
    fontSize: 12,
    color: "#999999",
    fontStyle: "italic",
  },
  addEventButton: {
    justifyContent: "center",
    padding: 8,
  },
});

export default PlantCard;
