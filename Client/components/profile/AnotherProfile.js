import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AuthObserver from "../../utils/AuthObserver";

const AnotherProfile = () => {
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {};

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await AuthObserver.getCurrentUser();
        if (user?.uid) {
          setCurrentUserId(user.uid);
          if (user.uid === userId) {
            navigation.replace("Profile");
          }
        } else {
          setIsGuest(true);
        }
      } catch (err) {
        console.warn("Auth error:", err);
        setIsGuest(true);
      }
    };

    fetchCurrentUser();
  }, [userId]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`http://localhost:8000/data/users/${userId}`);
        if (!res.ok) throw new Error("Server error");

        const json = await res.json();
        setUserData(json);

        if (currentUserId) {
          setIsFollowing(json.followers.includes(currentUserId));
        }
      } catch (err) {
        console.warn("Error fetching user data:", err);
        Alert.alert("Error", "Failed to load user profile.");
      }
    };

    const fetchUserPosts = async () => {
      try {
        const res = await fetch(`http://localhost:8000/data/posts/all/${userId}`);
        if (!res.ok) throw new Error("Server error");
        const json = await res.json();
        setPosts(json.posts || []);
      } catch (err) {
        console.warn("Error fetching posts:", err);
      }
    };

    fetchUserData();
    fetchUserPosts();
  }, [userId, currentUserId]);

  const handleFollow = async () => {
    if (!currentUserId) {
      Alert.alert("Sign in required", "Please log in to follow users.");
      return;
    }

    try {
      const action = isFollowing ? "unfollow" : "follow";
      const url = `http://localhost:8000/data/users/${currentUserId}/${action}/${userId}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Request failed");

      setIsFollowing(!isFollowing);
      Alert.alert(
        isFollowing ? "Unfollowed" : "Followed",
        `${isFollowing ? "Unfollowed" : "Followed"} ${userData?.name}`
      );
      const updatedRes = await fetch(`http://localhost:8000/data/users/${userId}`);
      const updatedData = await updatedRes.json();
      setUserData(updatedData);
    } catch (err) {
      console.warn("Follow/unfollow error:", err);
      Alert.alert("Error", "Failed to update follow status.");
    }
  };

  if (!userData) return <Text style={styles.loading}>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileBox}>
        <Text style={styles.name}>{userData.name}</Text>
        <Text style={styles.bio}>{userData.bio}</Text>
        <Text style={styles.followers}>Followers: {userData.followers.length}</Text>
        <Text style={styles.following}>Following: {userData.following.length}</Text>

        {!isGuest && currentUserId !== userId && (
          <Button
            title={isFollowing ? "Unfollow" : "Follow"}
            onPress={handleFollow}
          />
        )}
      </View>

      <View style={styles.postsContainer}>
        {posts.length > 0 ? (
          posts.map((post) => (
            <View key={post.postId} style={styles.post}>
              <Image source={{ uri: post.url }} style={styles.postImage} />
              <Text>{post.caption}</Text>
            </View>
          ))
        ) : (
          <Text style={{ textAlign: "center", marginTop: 20 }}>No posts yet.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  profileBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    alignItems: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: "#ddd",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
  },
  bio: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 6,
  },
  followers: {
    fontSize: 16,
    marginTop: 8,
  },
  following: {
    fontSize: 16,
    marginTop: 4,
  },
  postsContainer: {
    marginTop: 20,
  },
  post: {
    marginBottom: 10,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    resizeMode: "cover",
  },
  loading: {
    textAlign: "center",
    fontSize: 18,
    marginTop: 50,
  },
});

export default AnotherProfile;
