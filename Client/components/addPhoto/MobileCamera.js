import React, { useState, useRef } from "react";
import { Camera } from "expo-camera";
import { Platform, Slider, StyleSheet, View } from "react-native";

export default function MobileCamera({ setImageUri }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef(null);

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
          <View style={styles.zoomContainer}>
            <Slider
              style={{ width: 200 }}
              minimumValue={0}
              maximumValue={1}
              value={zoom}
              onValueChange={(value) => setZoom(value)}
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="#888"
            />
          </View>
        </Camera>
      ) : (
        <Text style={styles.statusText}>Requesting permissions...</Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  camera: {
    width: "100%",
    height: "100%",
  },
  zoomContainer: {
    position: "absolute",
    bottom: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
  },
});
