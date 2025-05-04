import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Button,
  Modal,
  Alert,
} from "react-native";
import { getAuth } from "firebase/auth";
import { subscribeToPostAdded } from "../../utils/PostEvent";
import { useNavigation } from "@react-navigation/native";
import PostPopUp from "../Post/PostComponent/PostPopUp";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { Dimensions, TouchableOpacity } from "react-native";
import { notifyPostAdded } from "../../utils/PostEvent";

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [numColumns, setNumColumns] = useState(2);
  const screenWidth = Dimensions.get("window").width;
  const [message, setMessage] = useState("");
  const userId = getAuth().currentUser?.uid;
  const navigation = useNavigation();

  const PROFILE_KEY = `profileData_${userId}`;
  const POSTS_KEY = `userPosts_${userId}`;

  useEffect(() => {
    const calculateColumns = () => {
      const width = Dimensions.get("window").width;
      if (width < 500) setNumColumns(2);
      else if (width < 800) setNumColumns(3);
      else setNumColumns(4);
    };

    calculateColumns();

    const subscription = Dimensions.addEventListener("change", calculateColumns);

    return () => {
      if (typeof subscription?.remove === "function") {
        subscription.remove(); 
      } else {
        subscription?.remove?.(); 
      }
    };
  }, []);

  const saveToStorage = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data)); 
    } catch (error) {
      console.error(`Save failed for ${key}:`, error);
    }
  };

  const loadFromStorage = async (key, fallbackSetter) => {
    try {
      const data = await AsyncStorage.getItem(key);
      if (data) fallbackSetter(JSON.parse(data));
    } catch (error) {
      console.error(`Load failed for ${key}:`, error);
    }
  };

  const fetchUserData = async () => {
    try {
      const res = await fetch(`http://localhost:8000/data/users/${userId}`);
      if (!res.ok) throw new Error("Server error");
      const json = await res.json();
      setUserData(json);
      await saveToStorage(PROFILE_KEY, json); 
    } catch (err) {
      console.warn("Falling back to cached profile.");
      await loadFromStorage(PROFILE_KEY, setUserData);
      setMessage("Offline: Could not fetch profile. Showing cached data.");
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await fetch(`http://localhost:8000/data/posts/all/${userId}`);
      if (!res.ok) throw new Error("Server error");
      const json = await res.json();
      const top5 = json.posts?.slice(0, 5) || [];
      setPosts(top5);
      await saveToStorage(POSTS_KEY, top5); 
    } catch (err) {
      console.warn("Falling back to cached posts.");
      await loadFromStorage(POSTS_KEY, setPosts); 
      setMessage("Offline: Could not fetch posts. Showing cached data.");
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const refetchAllData = async () => {
    if (!userId) return;
    await fetchUserData();
    await fetchUserPosts();
  };

  useEffect(() => {
    if (!userId) return;

    refetchAllData();
    const unsubscribePosts = subscribeToPostAdded(() => fetchUserPosts());

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const nowConnected = state.isConnected;

      if (!nowConnected && isConnected) {
        setIsConnected(false);
        setWasOffline(true);setMessage("No Internet: You are offline. Showing cached data.");
        setTimeout(() => setMessage(""), 5000);
      }

      if (nowConnected && !isConnected && wasOffline) {
        setIsConnected(true);
        setWasOffline(false);
        setMessage("Back Online: Refreshing your profile and posts.");
        setTimeout(() => setMessage(""), 5000);
        refetchAllData();
      }
    });

    return () => {
      unsubscribePosts();
      unsubscribeNetInfo();
    };
  }, [userId]);

  const openPostModal = (post) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPost(null);
  };

  if (!userData) return <Text style={styles.loading}>Loading...</Text>;
  console.log("PROFILE")
  return (
    <>
   
      <Button title="Settings" onPress={() => navigation.navigate("Settings")} />
      <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.message}>
  {message.error ? message.error : message}
</Text>


        <View style={styles.profileBox}>
          <View style={styles.profileColumns}>
            <View style={styles.leftColumn}>
            <Text style={styles.name}>{userData.name || 'No name available'}</Text>
            <Text style={styles.bio}>{userData.bio || 'No bio available'}</Text>

            </View>
            <View style={styles.rightColumn}>
            <Text style={styles.rating}>
  {userData.postRating && typeof userData.postRating === 'number' ? userData.postRating : "No rating available"}
</Text>

              <Text style={styles.rating}> {userData.commentsRating || "No comments available"}</Text>
              <Button
                title={`Followers (${userData.followers.length})`}
                onPress={() =>
                  navigation.navigate("List", {
                    ids: userData.followers,
                    title: "Followers",
                  })
                }
              />
              <Button
                title={`Following (${userData.following.length})`}
                onPress={() =>
                  navigation.navigate("List", {
                    ids: userData.following,
                    title: "Following",
                  })
                }
              />
            </View>
          </View>
        </View>

        <View style={styles.masonryContainer}>
          {Array.from({ length: numColumns }).map((_, colIndex) => (
            <View style={styles.masonryColumn} key={`col-${colIndex}`}>
              {posts
                .filter((_, idx) => idx % numColumns === colIndex)
                .map((post) => (
                  <TouchableOpacity key={post.postId} onPress={() => openPostModal(post)} activeOpacity={0.8}>
                    <Image
                      source={{ uri: post.url }}
                      style={{
                        width: "100%",
                        aspectRatio: post.aspectRatio || 1,
                        marginBottom: 6,
                        borderRadius: 8,
                      }}
                    />
                  </TouchableOpacity>
                ))}
            </View>
          ))}
        </View>

        <Modal
          visible={modalVisible}
          onRequestClose={closeModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedPost && (
                <PostPopUp
                  visible={modalVisible}
                  post={selectedPost}
                  userId={userId}
                  onClose={closeModal}
                />
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  masonryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  masonryColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  container: {
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  loading: {
    marginTop: 50,
    textAlign: "center",
    fontSize: 16,
  },
  profileBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  profileColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leftColumn: {
    flex: 1,
    paddingRight: 10,
  },
  rightColumn: {
    flex: 1,
    justifyContent: "space-around",
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
  rating: {
    fontSize: 14,
    marginBottom: 6,
  },
  postsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 0,
    margin: 1,
    borderRadius: 0,
    elevation: 2,
    width: "45%",
  },
  image: {
    width: "100%",
    height: undefined,
    borderRadius: 0,
    margin: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    height: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
  },
});

export default UserProfile;
