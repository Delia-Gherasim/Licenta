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

const API_URL = "http://localhost:8000";

export default function PostDetails({ post, userId, showClose, onClose }) {
  const [userRating, setUserRating] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [rating, setRating] = useState(post.rating);
  const [showComments, setShowComments] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption);
  const navigation = useNavigation();
  const [userName, setUserName] = useState("");

  // Function to fetch user data based on userId
  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/data/users/${userId}`);
      const data = await response.json();
      setUserName(data.name); // Assuming the response contains a 'name' field
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  // Load the current userId (for rating logic)
  useEffect(() => {
    const loadUserId = async () => {
      const id = await AuthObserver.getCurrentUserId();
      setCurrentUserId(id);
    };
    loadUserId();
  }, []);

  // Fetch the post user data based on post.userId
  useEffect(() => {
    if (post.userId) {
      fetchUserData(post.userId);
    }
  }, [post.userId]);

  useEffect(() => {
    const fetchUserRating = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/data/rating/${post.postId}/${userId}`
        );
        if (!res.ok) throw new Error("Failed to fetch user rating");
        setUserRating(await res.json());
      } catch (err) {
        console.error(err);
      }
    };

    const fetchAverageRating = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/data/rating/average/${post.postId}`
        );
        if (!res.ok) throw new Error("Failed to fetch average rating");
        setAverageRating(await res.json());
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserRating();
    fetchAverageRating();
  }, [post.postId, userId]);

  const handleRatingChange = async (newRating) => {
    setRating(newRating);
    try {
      await fetch(
        `http://localhost:8000/data/rating/${post.postId}/${userId}/${newRating}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const res = await fetch(
        `http://localhost:8000/data/rating/average/${post.postId}`
      );
      if (!res.ok) throw new Error("Failed to fetch average rating");
      setAverageRating(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.postContainer}>
      {showClose && <Button title="Close" onPress={onClose} />}
      <View style={styles.contentContainer}>
        <Image source={{ uri: post.url }} style={styles.image} />
        <Text style={styles.caption}>{editedCaption}</Text>
        <Text>Date: {new Date(post.date).toLocaleDateString()}</Text>
        <Text>Views: {post.views}</Text>
        <View style={styles.ratingContainer}>
          <Text>Rating:</Text>
          {currentUserId && (
            <Rating
              imageSize={20}
              startingValue={userRating || rating}
              onFinishRating={handleRatingChange}
              style={styles.rating}
            />
          )}
          <Text>Average: {averageRating.toFixed(1)}</Text>
        </View>

        <Text>Hashtags: {post.hashtags.join(", ")}</Text>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate("Profile", {
              screen: "AnotherProfile",
              params: { userId: post.userId },
            })
          }
        >
          {/* Display the user's name based on post.userId */}
          <Text style={styles.userName}>@{userName}</Text>
        </TouchableOpacity>
        <Button
          title="Toggle Comments"
          onPress={() => setShowComments(!showComments)}
        />
        {showComments && <Comments postId={post.postId} />}
        {currentUserId === post.userId && (
          <>
            <TouchableOpacity
              style={{ alignSelf: "flex-end", padding: 5 }}
              onPress={() => setModalVisible(true)}
            >
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>

            <PostSettingsModal
              visible={modalVisible}
              onClose={() => setModalVisible(false)}
              post={post}
              currentUserId={currentUserId}
              onPostUpdated={(newCaption) => setEditedCaption(newCaption)}
              onPostDeleted={onClose}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    width: Platform.OS === "web" ? "80%" : "100%",
    alignSelf: "center",
  },
  contentContainer: {
    flexDirection: "column",
  },
  caption: {
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 10,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    resizeMode: "cover",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  rating: {
    marginLeft: 5,
  },
  userName: {
    color: "#007AFF",
    textDecorationLine: "underline",
    marginTop: 10,
  },
});
