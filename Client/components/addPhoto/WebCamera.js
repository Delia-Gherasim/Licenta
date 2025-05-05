import React from "react";
import Webcam from "react-webcam";
import { StyleSheet, View, TouchableOpacity } from "react-native-web";
import { Ionicons } from "@expo/vector-icons";

export default function WebCamera({ setImageUri, pickImage }) {
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
            width: window.innerWidth, 
            height: window.innerHeight,
          }}
        />
      </View>

      <TouchableOpacity onPress={pickImage} style={[styles.iconButton, styles.folderButton]}>
        <Ionicons name="folder-open" size={32} color="white" />
      </TouchableOpacity>

      <TouchableOpacity onPress={takePhoto} style={styles.captureButton}>
        <Ionicons name="camera" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100vh",
    backgroundColor: "#E0E0E2",
    paddingBottom: 0, 
    userSelect: "none",
    margin: 0, 
  },
  webcamContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
  },
  iconButton: {
    position: "absolute",
    padding: 10,
    borderRadius: 50,
  },
  folderButton: {
    left: "10%",
    bottom: "10vh", 
    backgroundColor: "#416788", 
  },
  captureButton: {
    position: "absolute",
    bottom: "10vh", 
    left: "50%", 
    transform: [{ translateX: "-50%" }], 
    padding: 10,
    backgroundColor: "#B2675E", 
    borderRadius: 50,
  },
});
