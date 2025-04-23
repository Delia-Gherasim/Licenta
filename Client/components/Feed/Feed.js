import {
  Text,
  View,
  Button,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import React, { useState } from "react";
import PostComponent from "./PostComponent";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL =
    Platform.OS === "web"
      ? "https://your-api-domain.com"
      : "http://localhost:8000";

  const fetchFriendsPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/friends/posts`);
      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error("Error fetching friends posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/data/posts/`);
      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error("Error fetching global posts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Feed</Text>
      <View style={styles.buttonsContainer}>
        <Button title="Friends" onPress={fetchFriendsPosts} />
        <Button title="Global" onPress={fetchGlobalPosts} />
      </View>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.postId.toString()}
          renderItem={({ item }) => <PostComponent post={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    justifyContent: "flex-start",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  postContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  caption: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
});
