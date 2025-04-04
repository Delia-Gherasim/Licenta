import { getAuth } from "firebase/auth";
import { addDoc, collection, doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, Button, Image, StyleSheet, TextInput, View } from "react-native";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/df2iifqrf/image/upload";
const UPLOAD_PRESET = "ml_default";

export default function Post({ route }) {
  const { imageUri } = route.params;
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const uploadToCloudinary = async () => {
    const data = new FormData();
  
    data.append("file", imageUri); 
    data.append("upload_preset", UPLOAD_PRESET);
  
    try {
      const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: data,
      });
  
      const result = await res.json();
      console.log("Cloudinary response:", result);
  
      if (result.secure_url) return result.secure_url;
  
      throw new Error(result.error?.message || "Failed to upload image to Cloudinary");
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      throw err;
    }
  };
  

  const uploadPost = async () => {
    try {
      setUploading(true);
      const user = getAuth().currentUser;
      if (!user) throw new Error("User not authenticated");
  
      const uid = user.uid;
      const firestore = getFirestore();
  
      const photoUrl = await uploadToCloudinary();
  
      const userDocRef = doc(firestore, "UserPosts", uid);
      await setDoc(userDocRef, {}, { merge: true }); 

      const postsCollectionRef = collection(firestore, "UserPosts", uid, "Posts");
      await addDoc(postsCollectionRef, {
        caption,
        date: serverTimestamp(),
        photoUrl,
      });
  
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
      <Button title={uploading ? "Uploading..." : "Save Post"} onPress={uploadPost} disabled={uploading} />
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
