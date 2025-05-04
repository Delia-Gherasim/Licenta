import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PostItem from "../Post/PostComponent/PostItem";

const POST_STORAGE_KEY = "cachedPosts";

export default function Feed({ userId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFeed, setActiveFeed] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeout)
      ),
    ]);
  };

  const savePostsToLocalStorage = async (posts) => {
    try {
      const sorted = [...posts].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      const top30 = sorted.slice(0, 30);
      await AsyncStorage.setItem(POST_STORAGE_KEY, JSON.stringify(top30));
    } catch (error) {
      console.error("Error saving to AsyncStorage", error);
    }
  };

  const loadPostsFromLocalStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(POST_STORAGE_KEY);
      if (stored) {
        setPosts(JSON.parse(stored));
        setFetchError(true);
      }
    } catch (error) {
      console.error("Error loading from AsyncStorage", error);
    }
  };

  const fetchPosts = async (type) => {
    const endpoint =
      type === "friends"
        ? `http://localhost:8000/data/posts/all_friends/${userId}`
        : "http://localhost:8000/data/posts/";

    setActiveFeed(type);
    setLoading(true);
    setFetchError(false);

    try {
      const response = await fetchWithTimeout(endpoint);
      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      setPosts(data.posts);
      await savePostsToLocalStorage(data.posts);
    } catch (error) {
      console.error(`Error fetching ${type} posts:`, error);
      await loadPostsFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrentFeed = () => {
    setShowRefreshButton(false);
    if (activeFeed) fetchPosts(activeFeed);
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const nowConnected = state.isConnected;

      if (!nowConnected && isConnected) {
        setIsConnected(false);
        setWasOffline(true);
        Alert.alert(
          "No Internet Connection",
          "You are offline. Showing cached posts if available.",
          [{ text: "OK" }]
        );
        loadPostsFromLocalStorage();
      }

      if (nowConnected && !isConnected) {
        setIsConnected(true);
        if (wasOffline) {
          setShowRefreshButton(true);
          setWasOffline(false);
          Alert.alert("Back Online", "You can now refresh the feed.");
        }
      }
    });

    return () => unsubscribe();
  }, [isConnected, wasOffline, activeFeed]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Feed</Text>
      <View style={styles.buttonsContainer}>
        <Button title="Friends" onPress={() => fetchPosts("friends")} />
        <Button title="Global" onPress={() => fetchPosts("global")} />
      </View>

      {showRefreshButton && (
        <TouchableOpacity style={styles.refreshButton} onPress={refreshCurrentFeed}>
          <Text style={styles.refreshText}>🔄 Refresh Feed</Text>
        </TouchableOpacity>
      )}

{loading ? (
  <Text>Loading...</Text>
) : fetchError ? (
  <Text style={styles.errorText}>
    {typeof fetchError === 'string' ? fetchError : 'Unable to load live data. Showing cached posts.'}
  </Text>
) : null}

      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
      >
        {posts.map((post) => (
          <View key={post.postId} style={styles.postWrapper}>
            <PostItem post={post} userId={userId} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  flexGrow: 1,
  },
  postWrapper: {
    marginBottom: 10,
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
  refreshButton: {
    alignItems: "center",
    marginVertical: 10,
    padding: 10,
    backgroundColor: "#e0e0ff",
    borderRadius: 8,
  },
  refreshText: {
    fontSize: 16,
    color: "#6200ea",
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});