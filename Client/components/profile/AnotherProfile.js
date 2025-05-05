import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Image,
  ScrollView,
  Alert,
  Dimensions,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AuthObserver from "../../utils/AuthObserver";
import PostDetails from "../Post/PostComponent/PostDetails";
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
const API_URL = Constants.expoConfig.extra.API_URL_DATA;
const AnotherProfile = () => {
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [selectedPostDetails, setSelectedPostDetails] = useState(null);
  const [numColumns, setNumColumns] = useState(2);
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {};
  const { width: screenWidth } = useWindowDimensions();

  useEffect(() => {
    if (screenWidth < 500) setNumColumns(2);
    else if (screenWidth < 800) setNumColumns(3);
    else setNumColumns(4);
  }, [screenWidth]);

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
        const res = await fetch(`${API_URL}/users/${userId}`);
        if (!res.ok) throw new Error("Server error");
        const json = await res.json();
        setUserData(json);
        if (currentUserId) {
          setIsFollowing(json.followers.includes(currentUserId));
        }
      } catch (err) {
        Alert.alert("Error", "Failed to load user profile.");
      }
    };

    const fetchUserPosts = async () => {
      try {
        const res = await fetch(`${API_URL}/posts/all/${userId}`);
        if (!res.ok) throw new Error("Server error");
        const json = await res.json();
        setPosts(json.posts || []);
      } catch (err) {
        Alert.alert("Error", "Failed to load user posts.");
      }
    };

    if (userId) {
      fetchUserData();
      fetchUserPosts();
    }
  }, [userId, currentUserId]);

  const handleFollow = async () => {
    if (!currentUserId) {
      Alert.alert("Sign in required", "Please log in to follow users.");
      return;
    }

    try {
      const action = isFollowing ? "unfollow" : "follow";
      const url = `${API_URL}/users/${currentUserId}/${action}/${userId}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Request failed");

      setIsFollowing(!isFollowing);

      const updatedRes = await fetch(`${API_URL}/users/${userId}`);
      const updatedData = await updatedRes.json();
      setUserData(updatedData);
    } catch (err) {
      Alert.alert("Error", "Failed to update follow status.");
    }
  };

  const openPostDetails = (post) => {
    setSelectedPostDetails(post);
  };

  if (!userData) return <Text style={styles.loading}>Loading...</Text>;

  return (
    <View style={styles.viewOf}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainContentContainer, screenWidth >= 800 ? styles.rowLayout : null]}>
          <View style={styles.leftContent}>
            <View style={[styles.profileHeader, { width: screenWidth < 600 ? "100%" : 600 }]}>
              <View style={styles.headerContainer}>
                <View style={styles.settingsIconContainer}>
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.profileRow}>
                <Text style={styles.name}>{userData.name}</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.bio}>{userData.bio}</Text>
              </View>

              <View style={styles.profileRow}>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color="#f4c542" style={{ marginRight: 4 }} />
                  <Text style={styles.rating}>Posts Rating: {userData.postRating || "0"}</Text>
                </View>
              </View>

              <View style={styles.followRow}>
                <Text>Followers: {userData.followers.length}</Text>
                <Text>Following: {userData.following.length}</Text>
              </View>

              {!isGuest && currentUserId !== userId && (
                <View style={styles.followButton}>
                  <Button
                    title={isFollowing ? "Unfollow" : "Follow"}
                    onPress={handleFollow}
                    color="#416788"
                  />
                </View>
              )}
            </View>

            <View style={styles.masonryContainer}>
              {Array.from({ length: numColumns }).map((_, colIndex) => (
                <View style={styles.masonryColumn} key={`col-${colIndex}`}>
                  {posts
                    .filter((_, idx) => idx % numColumns === colIndex)
                    .map((post) => (
                      <TouchableOpacity
                        key={post.postId}
                        onPress={() => openPostDetails(post)}
                        activeOpacity={0.8}
                        style={{ marginBottom: 8 }}
                      >
                        <Image
                          source={{ uri: post.url }}
                          style={{
                            width: "100%",
                            aspectRatio: post.aspectRatio || 1,
                            borderRadius: 8,
                            backgroundColor: "#ccc",
                          }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                </View>
              ))}
            </View>

            {screenWidth < 800 && selectedPostDetails && (
              <View style={styles.postDetailsContainer}>
                <PostDetails
                  post={selectedPostDetails}
                  userId={userId}
                  onPostDeleted={() => setSelectedPostDetails(null)}
                />
              </View>
            )}
          </View>

          {screenWidth >= 800 && selectedPostDetails && (
            <View style={styles.rightSidebar}>
              <PostDetails
                post={selectedPostDetails}
                userId={userId}
                onPostDeleted={() => setSelectedPostDetails(null)}
              />
            </View>
          )}
        </View>
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
};

const screenHeight = Dimensions.get("window").height;
const styles = StyleSheet.create({
  viewOf: {
    height: screenHeight,
    backgroundColor: "#e0e0e2",
  },
  scrollContent: {
    padding: 16,
    alignItems: "center",
    flexGrow: 1,
  },
  bottomSpace: {
    height: 80,
  },
  mainContentContainer: {
    width: "100%",
    flexGrow: 1,
  },
  rowLayout: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leftContent: {
    flex: 1,
  },
  rightSidebar: {
    flex: 1,
    paddingLeft: 16,
    minWidth: 400,
  },
  loading: {
    marginTop: 50,
    textAlign: "center",
    fontSize: 16,
  },
  profileHeader: {
    marginBottom: 16,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    alignSelf: "flex-start",
    position: "relative",
  },
  headerContainer: {
    position: "relative",
    width: "100%",
  },
  settingsIconContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
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
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  rating: {
    fontSize: 14,
    color: "#666",
  },
  followRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 10,
  },
  followButton: {
    marginTop: 10,
  },
  masonryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignSelf: "center",
    marginTop: 16,
    paddingHorizontal: 4,
  },
  masonryColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  postDetailsContainer: {
    borderColor: "#ccc",
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
});

export default AnotherProfile;
