import React, { useEffect, useState, useContext } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    Modal,
    Button,
    Alert,
    TouchableOpacity,
    useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthObserver from "../../utils/AuthObserver";
import UserListScreen from "./UserListScreen";
import PostDetails from "../Post/PostComponent/PostDetails"; 
import { subscribeToPostChange } from "../../utils/PostEvent";
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from "react-native";
import { subscribe } from "../../utils/EventBus";
import Constants from 'expo-constants';
const API_URL = Constants.manifest.extra.API_URL_DATA;
const UserProfile = () => {
    const [userData, setUserData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [selectedPostDetails, setSelectedPostDetails] = useState(null); 
    const [isConnected, setIsConnected] = useState(true);
    const [message, setMessage] = useState("");
    const [userId, setUserId] = useState("");
    const navigation = useNavigation();
    const [listModalVisible, setListModalVisible] = useState(false);
    const [listParams, setListParams] = useState({ ids: [], title: "" });
    const { width: screenWidth } = useWindowDimensions();
    const [wasOffline, setWasOffline] = useState(false);
    const [numColumns, setNumColumns] = useState(2);

    useEffect(() => {
        if (screenWidth < 500) setNumColumns(2);
        else if (screenWidth < 800) setNumColumns(3);
        else setNumColumns(4);
    }, [screenWidth]);

    const PROFILE_KEY = `profileData_${userId}`;
    const POSTS_KEY = `userPosts_${userId}`;

    useEffect(() => {
        const fetchUserId = async () => {
            const id = await AuthObserver.getCurrentUserId();
            if (id) setUserId(id);
        };
        fetchUserId();
    }, []);
    useEffect(() => {
        const refetchAllData = async () => {
            const id = await AuthObserver.getCurrentUserId();
            setUserId(id);
            if (!id) return;
            console.log("User ID:", id);
            await fetchUserData(id);
            await fetchUserPosts(id);
        };

        const unsubscribe = subscribeToPostChange(() => {
            console.log("Detected post change, refreshing posts...");
            fetchUserPosts();
        });
        if (userId) {
            refetchAllData();
        }

        return () => unsubscribe(); 
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        const fetchAll = async () => {
            await fetchUserData();
            await fetchUserPosts();
        };

        fetchAll();

        const unsubscribe = subscribeToPostChange(() => {
            fetchUserPosts();
        });

        return () => unsubscribe();
    }, [userId]);

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
            const res = await fetch(`${API_URL}/users/${userId}`);
            if (!res.ok) throw new Error("Server error");
            const json = await res.json();
            setUserData(json);
            await saveToStorage(PROFILE_KEY, json);
        } catch (err) {
            await loadFromStorage(PROFILE_KEY, setUserData);
            setMessage("Offline: Could not fetch profile. Showing cached data.");
            setTimeout(() => setMessage(""), 5000);
        }
    };

    const fetchUserPosts = async () => {
        try {
            const res = await fetch(`${API_URL}/posts/all/${userId}`);
            if (!res.ok) throw new Error("Server error");
            const json = await res.json();
            const top5 = json.posts?.slice(0, 5) || [];
            setPosts(top5);
            await saveToStorage(POSTS_KEY, top5);
        } catch (err) {
            await loadFromStorage(POSTS_KEY, setPosts);
            setMessage("Offline: Could not fetch posts. Showing cached data.");
            setTimeout(() => setMessage(""), 5000);
        }
    };

    const openPostDetails = (post) => {
        if (selectedPostDetails && selectedPostDetails.postId === post.postId) {
            setSelectedPostDetails(null);  
        } else {
            setSelectedPostDetails(post);  
        }
    };
    const refetchAllData = async () => {
        const id = await AuthObserver.getCurrentUserId();
        setUserId(id);
        await fetchUserData();
        await fetchUserPosts();
    };
    useEffect(() => {
        refetchAllData();
        if (!userId) return;
        console.log("User ID:", userId);

        const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
            const nowConnected = state.isConnected;

            if (!nowConnected && isConnected) {
                setIsConnected(false);
                setWasOffline(true); setMessage("No Internet: You are offline. Showing cached data.");
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
            unsubscribeNetInfo();
        };
    }, [userId]);

    if (!userData) return <Text style={styles.loading}>Loading...</Text>;

    return (
        <View style={styles.viewOf}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View
              style={[
                styles.mainContentContainer,
                screenWidth >= 800 ? styles.rowLayout : null,
              ]}
            >
              <View style={styles.leftContent}>
                <View
                  style={[
                    styles.profileHeader,
                    { width: screenWidth < 600 ? "100%" : 600 },
                  ]}
                >
                  <View style={styles.headerContainer}>
                  <View style={styles.headerIconsRow}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Notification")}
                      style={styles.iconButton}
                    >
                      <Ionicons name="notifications-outline" size={24} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Settings")}
                      style={styles.iconButton}
                    >
                      <Ionicons name="settings-outline" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>

                  </View>
      
                  {message ? <Text style={styles.message}>{message}</Text> : null}
      
                  <View style={styles.profileRow}>
                    <Text style={styles.name}>{userData.name || "No name available"}</Text>
                  </View>
      
                  <View style={styles.profileRow}>
                    <Text style={styles.bio}>{userData.bio || "No bio available"}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={16} color="#f4c542" style={{ marginRight: 4 }} />
                      <Text style={styles.rating}>
                        Posts Rating: {userData.postRating || "0"}
                      </Text>
                    </View>
                  </View>
      
                  <View style={styles.followRow}>
                    <View style={styles.followButton}>
                      <Button
                        title={`Followers (${userData.followers?.length ?? 0})`}
                        onPress={() => {
                          setListParams({
                            ids: userData.followers || [],
                            title: "Followers",
                          });
                          setListModalVisible(true);
                        }}
                        color="#416788"
                      />
                    </View>
                    <View style={styles.followButton}>
                      <Button
                        title={`Following (${userData.following?.length ?? 0})`}
                        onPress={() => {
                          setListParams({
                            ids: userData.following || [],
                            title: "Following",
                          });
                          setListModalVisible(true);
                        }}
                        color="#416788"
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

            <Modal
              visible={listModalVisible}
              onRequestClose={() => setListModalVisible(false)}
              transparent={true}
              animationType="fade"
            >
              <View style={styles.modalOverlay}>
                <View style={styles.popupContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{listParams.title}</Text>
                    <TouchableOpacity onPress={() => setListModalVisible(false)}>
                      <Ionicons name="close-circle" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.popupContent}>
                    <UserListScreen route={{ params: listParams }} />
                  </View>
                </View>
              </View>
            </Modal>
      
            <View style={styles.bottomSpace} />
          </ScrollView>
        </View>
      );
      
};
const screenHeight = Dimensions.get('window').height;
const styles = StyleSheet.create({
    mainContentContainer: {
        width: "100%",
        flexGrow: 1,
      },
      headerIconsRow: {
        position: "absolute",
        top: 10,
        right: 10,
        flexDirection: "row",
        gap: 12,
      },
      
      iconButton: {
        paddingHorizontal: 4,
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
      
    scrollContent: {
        padding: 16,
        alignItems: "center",
        flexGrow: 1,
    },
    bottomSpace: {
        height: 80, 
    },
    viewOf: {
        height: screenHeight,
        backgroundColor: "#e0e0e2",
    },
    loading: {
        marginTop: 50,
        textAlign: "center",
        fontSize: 16,
    },
    message: {
        color: "#d9534f",
        marginBottom: 10,
    },
    headerContainer: {
        position: "relative",
        alignSelf: "flex-start", 
        width: "100%",
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop:5,
    },
    
    settingsIconContainer: {
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      
      popupContainer: {
        backgroundColor: '#fff',
        width: '85%',
        maxHeight: '80%',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 5,
      },
      
      popupContent: {
        padding: 12,
        flex: 1,
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
        flex: 0.45,
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
      modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)", 
        justifyContent: "center",
        alignItems: "center",
      },
    postDetailsContainer: {
        borderColor: "#ccc",
        width: "100%",
        maxWidth: 600,
        alignSelf: "center",
    },
    modalHeader: {
        padding: 16,
        backgroundColor: "#f8f9fa",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default UserProfile;
