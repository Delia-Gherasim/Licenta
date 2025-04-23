import { getAuth } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  Button,
  Image,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

export default function Post({ route }) {
  const { imageUri } = route.params;
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/df2iifqrf/image/upload";
  const UPLOAD_PRESET = "ml_default";

  const uploadToCloudinary = async () => {
    const data = new FormData();
    const file = imageUri; // File or URI to be uploaded

    if (Platform.OS === "web") {
      // Web browsers may require you to handle files using an input element.
      data.append("file", file);
    } else {
      // For mobile, imageUri is a local file path
      const fileType = file.split(".").pop(); // Extract the file extension
      data.append("file", {
        uri: file,
        type: `image/${fileType}`,
        name: `image.${fileType}`,
      });
    }

    data.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      console.log("Cloudinary response:", result);

      if (result.secure_url) return result.secure_url;

      throw new Error(
        result.error?.message || "Failed to upload image to Cloudinary"
      );
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      throw err;
    }
  };

  const uploadPost = async () => {
    setUploading(true);

    const user = getAuth().currentUser;
    if (!user) throw new Error("User not authenticated");

    const uid = user.uid;

    try {
      const url = await uploadToCloudinary(imageUri);

      const payload = {
        url,
        uId: uid,
        caption,
        date: new Date().toISOString(),
      };

      const response = await fetch("http://127.0.0.1:8000/data/posts/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to upload");
      }

      Alert.alert("Success", "Post uploaded 🎉");
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.image} />
      <TextInput
        placeholder="Write a Caption"
        value={caption}
        onChangeText={setCaption}
        style={styles.input}
      />
      <Button
        title={uploading ? "Uploading..." : "Save Post"}
        onPress={uploadPost}
        disabled={uploading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    alignItems: "center",
  },
  image: {
    width: 250,
    height: 250,
    marginBottom: 20,
    borderRadius: 10,
  },
  input: {
    width: "80%",
    padding: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 20,
    borderRadius: 5,
  },
});
