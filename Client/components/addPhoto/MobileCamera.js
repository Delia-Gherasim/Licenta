import React, { useState, useRef, useEffect } from "react";
import { Camera } from "expo-camera";
import { Platform, StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MobileCamera({ setImageUri, pickImage }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const toggleCameraType = () => {
    setCameraType((prev) =>
      prev === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  const toggleFlash = () => {
    setFlashMode((prev) =>
      prev === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setImageUri(photo.uri);
    }
  };

  return (
    <>
      {hasPermission ? (
        <Camera
          style={styles.camera}
          type={cameraType}
          flashMode={flashMode}
          zoom={zoom}
          ref={cameraRef}
        >
        </Camera>
      ) : (
        <Text style={styles.statusText}>Requesting permissions...</Text>
      )}
      <TouchableOpacity onPress={pickImage} style={[styles.iconButton, styles.folderButton]}>
        <Ionicons name="folder-open" size={32} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={takePhoto} style={styles.captureButton}>
        <Ionicons name="camera" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={toggleFlash} style={[styles.iconButton, styles.flashButton]}>
        <Ionicons name={flashMode === Camera.Constants.FlashMode.off ? "flash-off" : "flash"} size={32} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={toggleCameraType} style={[styles.iconButton, styles.switchButton]}>
        <Ionicons name="camera-reverse" size={32} color="white" />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  camera: {
    width: "100%",
    height: "100%",
  },
  iconButton: {
    position: "absolute",
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
  flashButton: {
    bottom: 20,
    right: 80,
  },
  switchButton: {
    bottom: 20,
    right: 20, 
  },
  statusText: {
    color: "white",
    textAlign: "center",
    marginTop: 20,
  },
});
