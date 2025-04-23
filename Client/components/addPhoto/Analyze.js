import React from "react";
import { Image, StyleSheet, Text, View, Platform } from "react-native";

export default function Analyze({ route }) {
  const { imageUri } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analyze Your Image</Text>
      <Image
        source={{ uri: imageUri }}
        style={[styles.image, Platform.OS === "web" && styles.webImage]} // Add conditional style for web
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0", // Add a light background for better contrast
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  webImage: {
    // Conditional styles for the web, if needed
    width: "100%", // For web, make it responsive
    height: "auto", // Adjust height automatically for web
    maxWidth: 600, // Optional: Limit the max size for better UI on larger screens
  },
});
