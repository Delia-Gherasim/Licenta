import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function Analyze({ route }) {
  const { imageUri } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analyze Your Image</Text>
      <Image source={{ uri: imageUri }} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
});
