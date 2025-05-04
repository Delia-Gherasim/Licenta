import React, { useState, useEffect } from "react";
import { ScrollView, Alert, Button, Image, StyleSheet, TextInput, View, Text, TouchableOpacity } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import useOfflinePostSync from "../../utils/OfflinePost";
import { uploadToCloudinary } from "../../utils/CloudinaryConfig";  
import AuthObserver from "../../utils/AuthObserver";
import { emitPostAdded } from "../../utils/PostEvent";

export default function Publish({ route }) {
  const { imageUri } = route.params;
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigation = useNavigation();

  useOfflinePostSync();

  const extractHashtags = (text) => {
    const matches = text.match(/#\w+/g);
    return matches ? matches.map((tag) => tag.slice(1).toLowerCase()) : [];
  };

  const savePostOffline = async (payloadWithImageUri) => {
    try {
      const existing = JSON.parse(await AsyncStorage.getItem("offlinePosts")) || [];
      await AsyncStorage.setItem("offlinePosts", JSON.stringify([...existing, payloadWithImageUri]));
    } catch (err) {
      console.error("Failed to save post offline:", err);
    }
  };

  const uploadPost = async () => {
    setUploading(true);
    setErrorMessage("");

    const userId = await AuthObserver.getCurrentUserId(); 
    console.log("User ID:", userId);
    if (!userId) {
        setErrorMessage("User not authenticated.");
        setUploading(false);
        return;
    }

    const network = await NetInfo.fetch();
    if (!network.isConnected) {
        setErrorMessage("You're offline. The post will be saved and uploaded when back online.");
        await savePostOffline({ imageUri, caption, userId });
        setUploading(false);
        return;
    }

    let imageUrl;
    try {
        imageUrl = await uploadToCloudinary(imageUri);
        if (!imageUrl) throw new Error("Cloudinary upload failed");
    } catch (err) {
        console.error("Cloudinary upload failed:", err);
        setErrorMessage("Could not upload image. Post saved for later upload.");
        await savePostOffline({ imageUri, caption, userId });
        setUploading(false);
        return;
    }

    const hashtags = extractHashtags(caption); 

    const postPayload = {
        user_id: userId, 
        caption, 
        date: new Date().toISOString().split("T")[0], 
        rating: 0,
        url: imageUrl, 
        views: 0, 
        hashtags,
    };

    let response;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        response = await fetch("http://localhost:8000/data/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postPayload), 
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to upload to server");
        }
    } catch (err) {
        console.error("Server upload failed:", err);
        setErrorMessage("Server is not responding. Post will be saved for later.");
        await savePostOffline({ ...postPayload, imageUri });
        setUploading(false);
        return;
    }

    emitPostAdded();  
    setUploadSuccess(true);  
    setUploading(false); 
};

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        try {
          const savedPosts = JSON.parse(await AsyncStorage.getItem("offlinePosts")) || [];
          if (!savedPosts.length) return;

          const remainingPosts = [];

          for (const post of savedPosts) {
            try {
              let imageUrl = post.url;

              if (!imageUrl && post.imageUri) {
                imageUrl = await uploadToCloudinary(post.imageUri);
                if (!imageUrl) throw new Error("Image upload failed");
              }

              const payload = {
                user_id: post.user_id,
                caption: post.caption || "",
                date: post.date || new Date().toISOString(),
                rating: 0,
                url: imageUrl,
                views: 0,
                hashtags: post.hashtags || [],
              };

              const response = await fetch("http://localhost:8000/data/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });

              if (!response.ok) {
                throw new Error("Server responded with error");
              }

              emitPostAdded();
            } catch (err) {
              console.warn("Post retry failed:", err.message);
              remainingPosts.push(post); 
            }
          }

          await AsyncStorage.setItem("offlinePosts", JSON.stringify(remainingPosts));
        } catch (err) {
          console.error("Auto-sync failed:", err.message);
        }
      }
    });

    return () => unsubscribe();
  }, []); 

  if (uploading) {
    return (
      <View style={styles.centered}>
        <Image source={require("../../utils/Animation - 1745528060831.gif")} />
        <Text style={{ marginTop: 20 }}>Uploading your post...</Text>
      </View>
    );
  }

  if (uploadSuccess) {
    return (
      <View style={styles.centered}>
        <Text style={styles.successText}>Uploaded successfully!</Text>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("AddMain")}>
          <Text style={styles.buttonText}>Add Another</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Analyze", { imageUri })}>
          <Text style={styles.buttonText}>Go to Analyze</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
      <View style={styles.fixedContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <TextInput
          placeholder="Write a Caption"
          value={caption}
          onChangeText={setCaption}
          style={styles.input}
        />
        {errorMessage ? (
          <View style={{ alignItems: "center" }}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("AddMain")}>
              <Text style={styles.buttonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity onPress={uploadPost} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Post</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  errorText: {
    color: "red",
    marginBottom: 15,
    textAlign: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 40,
  },
  fixedContainer: {
    width: 520,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    paddingTop: 80,
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  image: {
    width: 500,
    height: 375,
    marginBottom: 20,
  },
  input: {
    width: "80%",
    padding: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 20,
    borderRadius: 5,
  },
  successText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 30,
  },
  navButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    width: "70%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});
