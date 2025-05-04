import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MobileCamera from "./MobileCamera"; // Mobile camera component
import WebCamera from "./WebCamera"; // Web camera component
import { Ionicons } from "@expo/vector-icons";

export default function Add() {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const { status: camStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(camStatus === "granted");
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  if (hasPermission === null) {
    return <Text style={styles.statusText}>Requesting permissions...</Text>;
  }

  if (hasPermission === false) {
    return <Text style={styles.statusText}>No access to camera or gallery.</Text>;
  }

  return (
    <View style={styles.container}>
      {!imageUri && (
        <View style={styles.cameraContainer}>
          {Platform.OS === "web" ? (
            <WebCamera setImageUri={setImageUri} />
          ) : (
            <MobileCamera setImageUri={setImageUri} />
          )}

          <View style={styles.cameraControls}>
            <TouchableOpacity
              onPress={pickImage}
              style={[styles.iconButton, styles.folderButton]}
            >
              <Ionicons name="folder-open" size={32} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <Text style={styles.imageText}>Image Selected!</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Publish", { imageUri })}
          >
            <Text style={styles.buttonText}>Post</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Analyze", { imageUri })}
          >
            <Text style={styles.buttonText}>Analyze</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#ff6347" }]}
            onPress={() => setImageUri(null)}
          >
            <Text style={styles.buttonText}>Choose Another</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 50,
    backgroundColor: "#222",
  },
  cameraContainer: {
    width: "80%",
    height: "80%", // Occupy 80% of the screen height
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cameraControls: {
    position: "absolute",
    bottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  iconButton: {
    padding: 10,
  },
  folderButton: {
    position: "absolute",
    left: 700,
    top: 12, // 375px webcam + 20px spacing,
  },  
  imageContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  image: {
    width: "50%",
    height: "50%",
    borderRadius: 10,
  },
  imageText: {
    marginTop: 10,
    fontSize: 16,
    color: "green",
  },
  actionButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
