import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Switch,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PostItem from "../Post/PostComponent/PostItem";
import { Dimensions } from "react-native";
import Toast from "react-native-toast-message";
import Constants from 'expo-constants';
import authorizedFetch from "../../utils/authorizedFetch";
import AuthObserver from "../../utils/AuthObserver";

const API_URL = Constants.expoConfig.extra.API_URL_DATA;
const POST_STORAGE_KEY = Constants.expoConfig.extra.POST_STORAGE_KEY;

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFeed, setActiveFeed] = useState("global");
  const [isConnected, setIsConnected] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  const fetchWithTimeout = useCallback((url, options = {}, timeout = 5000) => {
    return Promise.race([
      authorizedFetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeout)
      ),
    ]);
  }, []);

  const savePostsToLocalStorage = useCallback(async (posts) => {
    try {
      if (!Array.isArray(posts)) return;
      const sorted = [...posts].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      const top30 = sorted.slice(0, 30);
      await AsyncStorage.setItem(POST_STORAGE_KEY, JSON.stringify(top30));
    } catch (error) {
      console.error("Error saving to AsyncStorage", error);
    }
  }, []);

  const loadPostsFromLocalStorage = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(POST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPosts(parsed);
        setFetchError(true);
        return parsed;
      } else {
        setPosts([]);
        return [];
      }
    } catch (error) {
      console.error("Error loading from AsyncStorage", error);
      setPosts([]);
      return [];
    }
  }, []);

  const fetchPosts = useCallback(
    async (type) => {
      const endpoint =
        type === "friends"
          ? `${API_URL}/posts/all_friends/${userId}`
          : API_URL + "/posts/";

      setActiveFeed(type);
      setLoading(true);
      setFetchError(false);
      setIsRefreshing(false);

      try {
        const response = await fetchWithTimeout(endpoint);
        if (!response.ok) throw new Error("Server error");

        const data = await response.json();
        console.log("Fetched data:", data);
        if (!Array.isArray(data.posts)) throw new Error("Invalid posts data");

        setPosts(data.posts);
        await savePostsToLocalStorage(data.posts);
      } catch (error) {
        console.error(`Error fetching ${type} posts:`, error);
        const localPosts = await loadPostsFromLocalStorage();
        if (!Array.isArray(localPosts)) {
          setPosts([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [fetchWithTimeout, savePostsToLocalStorage, loadPostsFromLocalStorage, userId]
  );

  const refreshCurrentFeed = useCallback(() => {
    setShowRefreshButton(false);
    setIsRefreshing(true);
    if (activeFeed) fetchPosts(activeFeed);
  }, [activeFeed, fetchPosts]);

  useEffect(() => {
    const getUserId = async () => {
      const id = await AuthObserver.getCurrentUserId();
      if (id) {
        setUserId(id);
      } else {
        console.error("User ID not found in AuthObserver");
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchPosts(activeFeed);
    }
  }, [fetchPosts, activeFeed, userId]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const nowConnected = state.isConnected;

      if (!nowConnected && isConnected) {
        setIsConnected(false);
        setWasOffline(true);
        Toast.show({
          type: "error",
          position: "bottom",
          text1: "No Internet Connection",
          text2: "You are offline. Showing cached posts if available.",
        });
        loadPostsFromLocalStorage();
      }

      if (nowConnected && !isConnected) {
        setIsConnected(true);
        if (wasOffline) {
          setShowRefreshButton(true);
          setWasOffline(false);
          Toast.show({
            type: "success",
            position: "bottom",
            text1: "Back Online",
            text2: "You can now refresh the feed.",
          });
        }
      }
    });

    return () => unsubscribe();
  }, [isConnected, wasOffline, loadPostsFromLocalStorage]);

  const handleSwitchChange = (value) => {
    const feedType = value ? "global" : "friends";
    fetchPosts(feedType);
  };

  return (
    <View style={styles.viewOf}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshCurrentFeed}
          />
        }
      >
        <View style={styles.headerContainer}>
          <View style={styles.stickySwitchContainer}>
            <Text style={styles.switchLabel}>Friends</Text>
            <Switch
              value={activeFeed === "global"}
              onValueChange={handleSwitchChange}
            />
            <Text style={styles.switchLabel}>Global</Text>
          </View>

          {showRefreshButton && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refreshCurrentFeed}
            >
              <Text style={styles.refreshText}>🔄 Refresh Feed</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <Text>Loading...</Text>
        ) : fetchError && posts.length === 0 ? (
          <Text style={styles.infoText}>No posts available in this feed.</Text>
        ) : posts.length === 0 && !loading ? (
          <Text style={styles.infoText}>No posts available in this feed.</Text>
        ) : (
          <View>
            {posts.map((post) => (
              <View
                style={styles.postWrapper}
                key={post?.postId?.toString() ?? Math.random().toString()}
              >
                <PostItem post={post} userId={userId} />
              </View>
            ))}
          </View>
        )}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const screenHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
  viewOf: {
    height: screenHeight,
    backgroundColor: "#E0E0E2",
  },
  scrollView: {
    flex: 1,
  },
  bottomSpace: {
    height: 80,
  },
  scrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: 10,
    padding: 10,
    zIndex: 10,
  },
  stickySwitchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
    backgroundColor: "#E0E0E2",
    zIndex: 1,
    padding: 10,
  },
  switchLabel: {
    fontSize: 16,
    marginHorizontal: 10,
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
  infoText: {
    color: "gray",
    textAlign: "center",
    marginTop: 20,
  },
  postWrapper: {
    marginBottom: 5,
  },
});
