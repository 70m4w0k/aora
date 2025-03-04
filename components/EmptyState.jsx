import { router } from "expo-router";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { images } from "../constants";

const EmptyState = ({ title, subtitle, buttonText, onButtonPress }) => {
  return (
    <View style={styles.container}>
      <Image
        source={images.empty}
        resizeMode="contain"
        style={styles.image}
      />

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {buttonText && (
        <TouchableOpacity
          style={styles.button}
          onPress={onButtonPress || (() => router.push("/home"))}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 180,
    height: 150,
    marginBottom: 20,
    opacity: 0.7,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4F86C6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default EmptyState;
