import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Button,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Rating } from "react-native-elements";
import Comments from "../CommentComponent/Comments";
import AuthObserver from "../../../utils/AuthObserver";
import { useNavigation } from "@react-navigation/native";
import PostSettingsModal from "./PostSettingsModel";
import { emitPostChange } from "../../../utils/PostEvent";
import { subscribeToPostChange } from "../../../utils/PostEvent";
import Toast from "react-native-toast-message";
import { emit } from "../../../utils/EventBus";
import Constants from 'expo-constants';
import authorizedFetch from "../../../utils/authorizedFetch";
const API_URL = Constants.expoConfig.extra.API_URL_DATA;


export default function PostDetails({ post, userId, showClose, onClose, onPostDeleted}) {
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [rating, setRating] = useState(post.rating);
  const [showComments, setShowComments] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption);
  const navigation = useNavigation();
  const [userName, setUserName] = useState("");
  const [commentsHeight, setCommentsHeight] = useState(200); 

  const fetchUserData = async (userId) => {
    try {
      const response = await authorizedFetch(`${API_URL}/users/${userId}`);
      const data = await response.json();
      setUserName(data.name);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      Toast.show({
        type: 'error',
        text1: 'User Error',
        text2: 'Failed to load user info.',
      });
    }
  };

  useEffect(() => {
    const fetchUpdatedPost = async () => {
      try {
        const res = await authorizedFetch(`${API_URL}/posts/${post.postId}`);
        if (!res.ok) throw new Error("Failed to refetch post data");
        const updatedPost = await res.json();
        setEditedCaption(updatedPost.caption);
        setRating(updatedPost.rating);
      } catch (err) {
        console.error("Post update error:", err);
        Toast.show({
          type: 'error',
          text1: 'Post Update Error',
          text2: 'Failed to refresh post data.',
        });
      }
    };
  
    const unsubscribe = subscribeToPostChange(fetchUpdatedPost);
    return () => unsubscribe();
  }, [post.postId]);
  

  useEffect(() => {
    const loadUserId = async () => {
      const id = await AuthObserver.getCurrentUserId();
      setCurrentUserId(id);
    };
    loadUserId();
  }, []);

  useEffect(() => {
    if (post.userId) {
      fetchUserData(post.userId);
    }
  }, [post.userId]);

  useEffect(() => {
    const fetchUserRating = async () => {
      try {
        const res = await authorizedFetch(`${API_URL}/rating/${post.postId}/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch user rating");
        const data = await res.json();
        setUserRating(data ?? 0);
      } catch (err) {
        console.error(err);
        setUserRating(0);
        Toast.show({
          type: 'error',
          text1: 'Rating Error',
          text2: 'Failed to load your rating.',
        });
      }
    };
    
    const fetchAverageRating = async () => {
      try {
        const res = await authorizedFetch(`${API_URL}/rating/average/${post.postId}`);
        if (!res.ok) throw new Error("Failed to fetch average rating");
        const data = await res.json();
        setAverageRating(data ?? 0);
      } catch (err) {
        console.error(err);
        setAverageRating(0);
        Toast.show({
          type: 'error',
          text1: 'Rating Error',
          text2: 'Failed to load average rating.',
        });
      }
    };

    fetchUserRating();
    fetchAverageRating();
  }, [post.postId, userId]);

  const handleRatingChange = async (newRating) => {
    setRating(newRating);
    try {
      await authorizedFetch(`${API_URL}/rating/${post.postId}/${userId}/${newRating}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
  
      const res = await authorizedFetch(`${API_URL}/rating/average/${post.postId}`);
      if (!res.ok) throw new Error("Failed to fetch average rating");
      setAverageRating(await res.json());
      emitPostChange();
      const userName = await AuthObserver.fetchUserName(userId);
      emit("notifyUser", {
        userId: post.userId,
        message: `User ${userName} rated your post with ${newRating} stars.`, 
        thumbnail: post.url,
      });
    } catch (err) {
      console.error(err);
      Toast.show({
        type: 'error',
        text1: 'Rating Error',
        text2: 'Failed to update rating.',
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.postContainer}>
  {showClose && <Button title="Close" onPress={onClose} />}
  <View style={styles.contentContainer}>
    <Image source={{ uri: post.url }} style={styles.image} />
    <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("ProfileStack", {
            screen: "AnotherProfile",
            params: { userId: post.userId },
          })
        }
      >
        <Text style={styles.userName}>@{userName}</Text>
      </TouchableOpacity>

      <View style={styles.headerRightColumn}>
        <Text style={styles.postDate}>
          {new Date(post.date).toLocaleDateString()}
        </Text>
        {currentUserId === post.userId && (
          <>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>

            <PostSettingsModal
              visible={modalVisible}
              onClose={() => setModalVisible(false)}
              post={post}
              currentUserId={currentUserId}
              onPostUpdated={(newCaption) => setEditedCaption(newCaption)}
              onPostDeleted={() => {
                emitPostChange();
                onClose?.();
              }}
            />
          </>
        )}
      </View>
    </View>

    <Text style={styles.caption}>{editedCaption}</Text>

    <View style={styles.ratingAndCommentsContainer}>
      <View style={styles.ratingContainer}>
        {currentUserId && (
          <Rating
            imageSize={30}
            startingValue={userRating !== null && userRating !== undefined ? userRating : rating}
            onFinishRating={handleRatingChange}
            style={styles.rating}
          />
        )}
        <Text> {averageRating.toFixed(1)}</Text>
      </View>

      <Button
        title="Show Comments"
        onPress={() => setShowComments(!showComments)}
        color="#372554"
      />
    </View>

    {showComments && (
      <View style={[styles.commentsContainerWrapper, { maxHeight: commentsHeight }]}>
        <Comments postId={post.postId} />
      </View>
    )}
  </View>
</ScrollView>

  );
}

const styles = StyleSheet.create({
  postContainer: {
    padding: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    width: Platform.OS === "web" ? "80%" : "100%",
    alignSelf: "center",
    marginBottom: 10, 
  },
  contentContainer: {
    flexDirection: "column",
  },
  userName: {
    color: "#007AFF",
    textDecorationLine: "underline",
    fontWeight: "bold",
    fontSize: 20, 
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  headerRightColumn: {
    flexDirection: "column",
    alignItems: "flex-end", 
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  postDate: {
    fontSize: 14,
    color: "#888",
    marginBottom: 2,
  },
  settingsButton: {
    paddingVertical: 2,
  },
  settingsButtonInline: {
    padding: 2,
  },
  settingsIcon: {
    fontSize: 22,
  },
  caption: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 5,
    color: "#333",
  },
  image: {
    width: "100%",
    height: undefined,
    aspectRatio: 1,
    resizeMode: "cover",
    marginTop: 0,
    marginBottom: 0, 
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8", 
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  rating: {
    backgroundColor: "transparent", 
    marginRight: 6,
  },
  
  ratingAndCommentsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 0,
  },
  
});
