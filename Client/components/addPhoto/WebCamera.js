import React from "react";
import Webcam from "react-webcam";
import { StyleSheet, View, TouchableOpacity } from "react-native-web";
import { Ionicons } from "@expo/vector-icons";

export default function WebCamera({ setImageUri }) {
  const webcamRef = React.useRef(null);

  const takePhoto = () => {
    const screenshot = webcamRef.current.getScreenshot();
    setImageUri(screenshot);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.webcamContainer}>
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          width="100%"
          height="100%"
          videoConstraints={{
            facingMode: "user",
            width: 500,
            height: 375,
          }}
        />
      </View>

      <View style={styles.cameraControls}>
        <TouchableOpacity onPress={takePhoto}>
          <View style={styles.captureButton}>
            <Ionicons name="camera" size={24} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
  },
  webcamContainer: {
    width: 500, // Fixed width
    height: 375, // 4:3 aspect ratio height
    backgroundColor: "#000",
    overflow: "hidden",
  },
  cameraControls: {
    marginTop: 20, // Space below webcam
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
  },
  captureButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ff6347",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
});
