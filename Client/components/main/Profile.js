import React from "react";
import { Button, Text, View, StyleSheet, Alert } from "react-native";
import { getAuth, signOut } from "firebase/auth";

export default function Profile() {
  const onLogOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      Alert.alert("Logged Out", "You have successfully logged out.");
    } catch (error) {
      Alert.alert("Logout Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Button title="Log Out" onPress={onLogOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});
