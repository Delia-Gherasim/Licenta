import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Button } from "react-native";
import AuthObserver from "../../utils/AuthObserver";

const API_URL = "http://localhost:8000";

const UserListScreen = ({ route }) => {
  const { ids, title } = route.params;
  const [users, setUsers] = useState([]);
  const userId = AuthObserver.getCurrentUserId();

  useEffect(() => {
    const fetchUsers = async () => {
      const fetched = [];
      for (const id of ids) {
        try {
          const res = await fetch(`${API_URL}/data/users/${id}`);
          const user = await res.json();

          // Check if there's an error in the response
          if (user.error) {
            console.error(`Error for user ${id}:`, user.error);
            continue; // Skip this user if there's an error
          }

          console.log('Fetched User:', user); // Debugging step

          fetched.push(user);
        } catch (err) {
          console.error(`Error fetching user ${id}:`, err);
        }
      }
      setUsers(fetched);
    };
    fetchUsers();
  }, [ids]);

  const handleAction = async (targetUserId) => {
    const url =
      title === "Followers"
        ? `${API_URL}/data/users/${targetUserId}/remove_follower/${userId}`
        : `${API_URL}/data/users/${userId}/unfollow/${targetUserId}`;

    try {
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Action failed");
      setUsers((prev) => prev.filter((u) => u.userId !== targetUserId));
    } catch (err) {
      console.error("Failed to perform action:", err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{title}</Text>

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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
});

export default UserListScreen;
