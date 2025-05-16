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
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AuthObserver from "../../utils/AuthObserver";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { emitPostChange } from "../../utils/PostEvent";
import Constants from 'expo-constants';
import authorizedFetch from "../../utils/authorizedFetch";
const API_URL = Constants.expoConfig.extra.API_URL_DATA;
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
      const res = await authorizedFetch(`${API_URL}/users/${userId}`);
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error);
      }
      setUserData(json);
      setNewName(json.name);
      setNewEmail(json.email);
      setBio(json.bio);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setUserData({ error: err.message });
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
      Toast.show({
        type: "success",
        text1: "Logged Out",
        text2: "You have been logged out successfully.",
      });
      navigation.navigate("Login");
    } catch (error) {
      console.error("Logout Error", error);
      Toast.show({
        type: "error",
        text1: "Logout Failed",
        text2: error.message || "Something went wrong during logout.",
      });
    }
  };

  const updatePasswordHandler = async () => {
    if (newPassword !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Password Mismatch",
        text2: "New password and confirmation do not match",
      });
      return;
    }

    setIsPasswordUpdating(true);
    try {
      await AuthObserver.updatePassword(newPassword, currentPassword);
      Toast.show({
        type: "success",
        text1: "Password Updated",
        text2: "Your password was successfully changed",
      });
    } catch (error) {
      console.error("Password update error:", error);
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error.message || "Something went wrong",
      });
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
      const res = await authorizedFetch(`${API_URL}/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update user data");

      if (newEmail !== userData.email) {
        await AuthObserver.updateEmail(newEmail);
      }

      setUserData({ ...userData, ...payload });

      Toast.show({
        type: "success",
        text1: "Profile Updated",
        text2: "Your profile was successfully updated.",
      });
    } catch (error) {
      console.error("Update error:", error);
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2:
          error.message || "Something went wrong while updating your profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAllPosts = () => setDeletePostsModalVisible(true);
  const confirmDeleteAllPosts = async () => {
    setDeletePostsModalVisible(false);
    
    try {
      const user = AuthObserver.getCurrentUser();
      const res = await authorizedFetch(
        `${API_URL}/posts/user/${user?.uid}/delete`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete posts");
      Toast.show({ type: "success", text1: "Posts Deleted" });
      emitPostChange();
    } catch (error) {
      Toast.show({ type: "error", text1: "Error", text2: error.message });
    }
  };

  const deleteAccount = () => setDeleteAccountModalVisible(true);
  const confirmDeleteAccount = async () => {
    setDeleteAccountModalVisible(false);
    try {
      const user = AuthObserver.getCurrentUser();
      const res = await authorizedFetch(`${API_URL}/users/${user?.uid}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete account");
      await user.delete();
      Toast.show({ type: "success", text1: "Account Deleted" });
      navigation.navigate("Login");
    } catch (error) {
      Toast.show({ type: "error", text1: "Error", text2: error.message });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#372554" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <View style={styles.container}>
        {userData && (
          <>
            <Text style={styles.label}>Username</Text>
            <TextInput value={newName} onChangeText={setNewName} placeholder="Enter your new username" style={styles.input} />

            <Text style={styles.label}>Email</Text>
            <TextInput value={newEmail} onChangeText={setNewEmail} placeholder="Enter your new email" style={styles.input} />

            <Text style={styles.label}>Bio</Text>
            <TextInput value={bio} onChangeText={setBio} placeholder="Enter your bio" style={styles.input} />

            <Text style={styles.label}>Current Password</Text>
            <TextInput secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} placeholder="Enter your current password" style={styles.input} />

            <Text style={styles.label}>New Password</Text>
            <TextInput secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholder="Enter new password" style={styles.input} />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm your new password" style={styles.input} />

            <TouchableOpacity onPress={updateUserData} style={styles.buttonPrimary}>
              <Text style={styles.buttonText}>{loading ? "Updating..." : "Update User Data"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={updatePasswordHandler} style={styles.buttonSecondary}>
              <Text style={styles.buttonText}>{isPasswordUpdating ? "Updating..." : "Update Password"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={deleteAllPosts} style={styles.buttonDanger}>
              <Text style={styles.buttonText}>Delete All Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteAccount} style={styles.buttonDanger}>
              <Text style={styles.buttonText}>Delete Account</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity onPress={() => setLogOutModalVisible(true)} style={styles.buttonSecondary}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isDeletePostsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeletePostsModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Are you sure you want to delete all your posts?</Text>
            <TouchableOpacity onPress={confirmDeleteAllPosts} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Yes, Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDeletePostsModalVisible(false)} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isDeleteAccountModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteAccountModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Are you sure you want to delete your account?</Text>
            <TouchableOpacity onPress={confirmDeleteAccount} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Yes, Delete Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDeleteAccountModalVisible(false)} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
  visible={isLogOutModalVisible}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setLogOutModalVisible(false)}
>
  <View style={styles.modalBackground}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalText}>Are you sure you want to log out?</Text>
      <TouchableOpacity onPress={onLogOut} style={styles.modalButton}>
        <Text style={styles.modalButtonText}>Yes, Log Out</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setLogOutModalVisible(false)} style={styles.modalButton}>
        <Text style={styles.modalButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

    <View style={{ height: 80}} />
    </ScrollView>
  );
}

const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  scrollContent: {
    height: screenHeight,
    backgroundColor: "#e0e0e2",
    paddingBottom: 30,
  },
  bottomSpace: {
    height: 80, 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#d6d6d8",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#372554",
  },
  container: {
    padding: 20,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#372554",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  buttonPrimary: {
    backgroundColor: "#416788",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: "#946e83",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonDanger: {
    backgroundColor: "#7e1946",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: "center",
    color: "#372554",
  },
  modalButton: {
    backgroundColor: "#416788",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
