import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Webcam from "react-webcam"; // For web webcam

export default function Add() {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef(null);
  const webcamRef = useRef(null);
  const [CameraComponent, setCameraComponent] = useState(null); // For mobile camera
  const [devices, setDevices] = useState(null); // For mobile devices (if needed)

  useEffect(() => {
    getPermissionsAsync();
  }, []);

  const getPermissionsAsync = async () => {
    // Request permissions for media library (for gallery access)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    // Request camera permission for mobile devices if not on web
    let cameraStatus = "authorized";
    if (Platform.OS !== "web") {
      const { Camera } = await import("react-native-vision-camera");
      cameraStatus = await Camera.requestCameraPermission();
    }
    setHasPermission(status === "granted" && cameraStatus === "authorized");
  };

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

  const takePhoto = async () => {
    if (Platform.OS === "web") {
      const capturedImage = webcamRef.current.getScreenshot();
      setImageUri(capturedImage);
      setShowCamera(false);
    } else {
      if (cameraRef.current) {
        cameraRef.current
          .takeSnapshot({ quality: 85, format: "jpeg" })
          .then((photo) => {
            setImageUri(photo.path);
            setShowCamera(false);
          });
      }
    }
  };

  // Permission loading state
  if (hasPermission === null) {
    return <Text>Requesting permissions...</Text>;
  }

  // No access to camera/gallery
  if (hasPermission === false) {
    return <Text>No access to camera or gallery.</Text>;
  }

  return (
    <View style={styles.container}>
      {!showCamera && (
        <View style={styles.topButtons}>
          <TouchableOpacity style={styles.smallButton} onPress={pickImage}>
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={() => setShowCamera(true)}
          >
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>
        </View>
      )}

      {showCamera && (
        <View>
          {Platform.OS === "web" ? (
            <Webcam audio={false} ref={webcamRef} style={styles.webcam} />
          ) : (
            <View style={styles.cameraWrapper}>
              <Text>Camera Loading...</Text>
              {/* Mobile Camera Component (can use react-native-vision-camera) */}
            </View>
          )}
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto} />
        </View>
      )}

      {imageUri && !showCamera && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <Text style={styles.imageText}>Image Selected!</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Post", { imageUri })}
          >
            <Text style={styles.buttonText}>Post</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Analyze", { imageUri })}
          >
            <Text style={styles.buttonText}>Analyze</Text>
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
  topButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    position: "absolute",
    top: 20,
  },
  smallButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  captureButton: {
    position: "absolute",
    bottom: 30, // Positioned at the bottom
    alignSelf: "center", // Centers it horizontally
    width: 80, // Bigger button
    height: 80,
    borderRadius: 40, // Circular shape
    backgroundColor: "#fff", // White button for visibility
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#000", // Black border for contrast
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5, // Shadow effect for Android
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  imageContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  imageText: {
    marginTop: 10,
    fontSize: 16,
    color: "green",
  },
  actionButton: {
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 10,
  },
  webcam: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  cameraWrapper: {
    height: 400, // Adjust as per screen size
    width: "100%",
    backgroundColor: "#555", // Placeholder while camera is loading
  },
});
