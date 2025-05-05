import { useNavigation } from "@react-navigation/native";  
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MobileCamera from "./MobileCamera";
import WebCamera from "./WebCamera";
import { useIsFocused } from "@react-navigation/native";
import { ScrollView } from "react-native";

export default function Add() {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    (async () => {
      const { status: camStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(camStatus === "granted");

      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        setCameraPermission(cameraStatus === "granted");
      }
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

  if (hasPermission === null || (Platform.OS !== "web" && cameraPermission === null)) {
    return <Text style={styles.statusText}>Requesting permissions...</Text>;
  }

  if (hasPermission === false || (Platform.OS !== "web" && !cameraPermission)) {
    return <Text style={styles.statusText}>No access to camera or gallery.</Text>;
  }

  return (
    <View style={styles.container}>
      {!imageUri && (
        <View style={styles.cameraContainer}>
          {Platform.OS === "web" ? (
            <WebCamera setImageUri={setImageUri} pickImage={pickImage} isFocused={isFocused} />
          ) : (
            <MobileCamera setImageUri={setImageUri} pickImage={pickImage} isFocused={isFocused} />
          )}
        </View>
      )}

      {imageUri && (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <Text style={styles.imageText}>Image Selected!</Text>
          <Text style={styles.imageText}>What do you want to do now?</Text>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate("Publish", { imageUri })}
          >
            <Text style={styles.buttonText}>Post</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate("Analyze", { imageUri })}
          >
            <Text style={styles.buttonText}>Analyze</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: "#B55D60" }]}
            onPress={() => setImageUri(null)}
          >
            <Text style={styles.buttonText}>Choose Another</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  
  container: {
    flex: 1,
    backgroundColor: "#E0E0E2",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  cameraContainer: {
    width: "100%",
    height: "100%",
  },
  imageContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 500,
  },
  image: {
    width: "100%",
    height: undefined,
    aspectRatio: 4 / 3,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#946E83",
    resizeMode: "cover",
  },
  imageText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#231123",
    textAlign: "center",
  },
  navButton: {
    backgroundColor: "#7389AE",
    paddingVertical: 14,
    marginVertical: 10,
    borderRadius: 10,
    width: "70%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  statusText: {
    textAlign: "center",
    fontSize: 18,
    color: "#7E1946",
    marginTop: 50,
  },
});
