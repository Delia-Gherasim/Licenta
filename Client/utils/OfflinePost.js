import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { uploadToCloudinary } from "./CloudinaryConfig";
import { emitPostAdded } from "./PostEvent";
import Constants from 'expo-constants';
const API_URL = Constants.expoConfig.extra.API_URL_DATA;
const useOfflinePostSync = () => {
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

              const response = await fetch(`${API_URL}/posts`, {
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
};

export default useOfflinePostSync;

export const retryOfflinePosts = async () => {
  try {
    const queue = JSON.parse(await AsyncStorage.getItem('offlinePosts')) || [];
    const successfulUploads = [];

    for (const post of queue) {
      try {
        const response = await fetch(`${API_URL}/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(post),
        });

        if (response.ok) {
          successfulUploads.push(post);
        }
      } catch (error) {
        console.log("Retry failed for a post", error);
      }
    }

    const remainingPosts = queue.filter(p => !successfulUploads.includes(p));
    await AsyncStorage.setItem('offlinePosts', JSON.stringify(remainingPosts));
  } catch (e) {
    console.error("Retry upload failed", e);
  }
};
