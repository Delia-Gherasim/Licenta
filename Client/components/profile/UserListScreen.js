import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Button } from "react-native";
import AuthObserver from "../../utils/AuthObserver";
import Constants from 'expo-constants';
const API_URL = Constants.manifest.extra.API_URL_DATA;

const UserListScreen = ({ route }) => {
  const { ids: initialIds, title } = route.params;
  const [listIds, setListIds] = useState(initialIds);  
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const uid = await AuthObserver.getCurrentUserId();
      setUserId(uid);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const fetched = [];
      for (const id of listIds) {
        try {
          const res = await fetch(`${API_URL}/users/${id}`);
          const user = await res.json();
          if (!user.error) fetched.push(user);
        } catch (err) {
          console.error(`Error fetching user ${id}:`, err);
        }
      }
      setUsers(fetched);
    };

    if (listIds.length > 0) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [listIds]);

  const handleAction = async (targetUserId) => {
    if (!userId) {
      console.error("User ID not loaded yet");
      return;
    }

    const url =
      title === "Followers"
        ? `${API_URL}/users/${targetUserId}/remove_follower/${userId}`
        : `${API_URL}/users/${userId}/unfollow/${targetUserId}`;

    try {
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Action failed");
      setListIds((prev) => prev.filter((id) => id !== targetUserId));
    } catch (err) {
      console.error("Failed to perform action:", err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {users.map((user) => (
        <View key={user.userId} style={styles.userCard}>
          <Text style={styles.username}>{user.name || "No name available"}</Text>
          <Text style={styles.email}>{user.email || "No email available"}</Text>
          <Button
            title={title === "Followers" ? "Remove Follower" : "Unfollow"}
            onPress={() => handleAction(user.userId)}
          />
        </View>
      ))}
      {users.length === 0 && (
        <Text style={styles.empty}>No users to display.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  userCard: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  username: { fontSize: 16, fontWeight: "bold" },
  email: { fontSize: 14, color: "#666", marginBottom: 6 },
  empty: { textAlign: "center", marginTop: 20, color: "#888" },
});

export default UserListScreen;
