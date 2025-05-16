import React, { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MobileCamera({ setImageUri, pickImage }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status === "granted") {
          setHasPermission(true);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        setErrorMessage("Failed to get camera permissions. Please try again.");
        setHasPermission(false);
      }
    };

    requestPermissions();
  }, []);

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.uri);
      } else {
        setErrorMessage("Photo capture was canceled.");
      }
    } catch (error) {
      setErrorMessage("An error occurred while capturing the photo. Please try again.");
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (hasPermission === false) {
    return <Text>{errorMessage || "No access to camera"}</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraControls}>
        <TouchableOpacity onPress={pickImage} style={[styles.iconButton, styles.folderButton]}>
          <Ionicons name="folder-open" size={32} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={takePhoto} style={styles.captureButton}>
          <Ionicons name="camera" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraControls: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconButton: {
    padding: 10,
    backgroundColor: "#416788",
    borderRadius: 50,
  },
  folderButton: {
    bottom: 20,
    left: 20,
  },
  captureButton: {
    bottom: 20,
    left: "50%",
    transform: [{ translateX: -30 }],
  },
  errorMessage: {
    position: "absolute",
    bottom: 60,
    color: "red",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
  },
});
