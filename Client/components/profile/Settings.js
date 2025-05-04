import React, { useState, useEffect } from "react";  
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AuthObserver from "../../utils/AuthObserver"; 
import { getAuth, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import * as SecureStore from 'expo-secure-store';

export default function Settings() {
  const [userData, setUserData] = useState(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [currentPassword, setCurrentPassword] = useState(""); 

  const [isDeletePostsModalVisible, setDeletePostsModalVisible] = useState(false);
  const [isDeleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [isLogOutModalVisible, setLogOutModalVisible] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const handleUserChange = (user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        setUserData(null);
      }
    };

    AuthObserver.subscribe(handleUserChange);
    AuthObserver.init();

    return () => {
      AuthObserver.unsubscribe(handleUserChange);
    };
  }, []);

 const fetchUserData = async (userId) => {
  try {
    const res = await fetch(`http://localhost:8000/data/users/${userId}`);
    const json = await res.json();
    if (json.error) {
      throw new Error(json.error); // Handle the error case if 'error' key exists in the response
    }
    setUserData(json);
    setNewName(json.name);
    setNewEmail(json.email);
    setBio(json.bio);
  } catch (err) {
    console.error("Error fetching user data:", err);
    setUserData({ error: err.message }); // Store the error in userData
  }
};


  const clearUserData = async () => {
    try {
      const user = AuthObserver.getCurrentUser();
      const userId = user?.uid;
      await SecureStore.deleteItemAsync(`profileData_${userId}`);
      await SecureStore.deleteItemAsync(`userPosts_${userId}`);
    } catch (err) {
      console.warn("Failed to clear user data", err);
    }
  };

  const onLogOut = async () => {
    setLogOutModalVisible(false);
    try {
      await AuthObserver.logout();
      clearUserData();
      navigation.navigate("Login");
    } catch (error) {
      console.error("Logout Error", error);
    }
  };

  const reauthenticateUser = async () => {
    const user = AuthObserver.getCurrentUser();
    if (user && currentPassword) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      try {
        await reauthenticateWithCredential(user, credential);
      } catch (error) {
        console.log("Re-authentication failed:", error);
      }
    }
  };

  const updatePasswordHandler = async () => {
    if (newPassword !== confirmPassword) {
      return;
    }

    setIsPasswordUpdating(true);
    try {
      const user = AuthObserver.getCurrentUser();
      await reauthenticateUser();
      await user.updatePassword(newPassword);
    } catch (error) {
      console.error("Password update error:", error);
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  const updateUserData = async () => {
    setLoading(true);
    try {
      const user = AuthObserver.getCurrentUser();
      const userId = user?.uid;
      const payload = { id: userId, name: newName, email: newEmail, bio };
      const res = await fetch(`http://localhost:8000/data/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update user data");

      if (newEmail !== userData.email) {
        await AuthObserver.getCurrentUser().updateEmail(newEmail);
      }

      setUserData({ ...userData, ...payload });
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllPosts = () => {
    setDeletePostsModalVisible(true);
  };

  const confirmDeleteAllPosts = async () => {
    setDeletePostsModalVisible(false);
    try {
      const user = AuthObserver.getCurrentUser();
      const res = await fetch(`http://localhost:8000/data/posts/user/${user?.uid}/delete`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete posts");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const deleteAccount = () => {
    setDeleteAccountModalVisible(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleteAccountModalVisible(false);
    try {
      const user = AuthObserver.getCurrentUser();
      const userId = user?.uid;

      const res = await fetch(`http://localhost:8000/data/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete account");

      await user.delete();
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error:", error);
    }
  };
  console.log("SETTINGS")
  return (
    <ScrollView style={styles.container}>
      <View>
     
      {userData && (
        <>
          <Text>Username:</Text>
          <TextInput value={newName} onChangeText={setNewName} placeholder="Enter your new username" style={styles.input} />
          <Text>Email:</Text>
          <TextInput value={newEmail} onChangeText={setNewEmail} placeholder="Enter your new email" style={styles.input} />
          <Text>Bio:</Text>
          <TextInput value={bio} onChangeText={setBio} placeholder="Enter your bio" style={styles.input} />
          <Text>Current Password:</Text>
          <TextInput
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter your current password"
            style={styles.input}
          />

          <Text>Password:</Text>
          <TextInput
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            style={styles.input}
          />

          <Text>Confirm Password:</Text>
          <TextInput
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your new password"
            style={styles.input}
          />
          <Button title={loading ? "Updating..." : "Update User Data"} onPress={updateUserData} />
          <Button title={isPasswordUpdating ? "Updating Password..." : "Update Password"} onPress={updatePasswordHandler} />

          <Button title="Delete All Posts" color="red" onPress={deleteAllPosts} />
          <Button title="Delete Account" color="red" onPress={deleteAccount} />
          <Button title="Go Back" onPress={() => navigation.navigate("Profile")} />
        </>
      )}
      <Button title="Log Out" onPress={() => setLogOutModalVisible(true)} />

      <Modal transparent visible={isLogOutModalVisible} animationType="slide" onRequestClose={() => setLogOutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Log Out</Text>
            <Text style={styles.modalText}>Are you sure you want to log out?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setLogOutModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onLogOut} style={styles.deleteButton}>
                <Text style={styles.buttonText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={isDeletePostsModalVisible} animationType="slide" onRequestClose={() => setDeletePostsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Delete All Posts</Text>
            <Text style={styles.modalText}>Are you sure you want to delete all your posts? This action cannot be undone.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setDeletePostsModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDeleteAllPosts} style={styles.deleteButton}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={isDeleteAccountModalVisible} animationType="slide" onRequestClose={() => setDeleteAccountModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalText}>Are you sure you want to delete your account? This action cannot be undone.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setDeleteAccountModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDeleteAccount} style={styles.deleteButton}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 20,
    borderRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "#aaa",
    padding: 10,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
  },
});
