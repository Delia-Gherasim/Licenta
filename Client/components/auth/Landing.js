import React from "react";
import { View, Button, StyleSheet, SafeAreaView, Text, Image, Platform } from "react-native";
import { Asset } from 'expo-asset';
const loadingAnimation = Asset.fromModule(require("../../assets/Animation - 1745528222870.gif")).uri;

export default function Landing({ navigation }) {
  const handleRegisterPress = () => navigation.navigate("Register");
  const handleLogInPress = () => navigation.navigate("Login");

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={{ uri: loadingAnimation }}
        style={styles.loadingAnimation}
      />
      <Text style={styles.headerText}>Welcome, Young Photographer!</Text>
      <Text style={styles.subText}>Please create an account or log in to an existing one</Text>

      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <Button title="Register" onPress={handleRegisterPress} color="#416788" />
        </View>
        <View style={styles.button}>
          <Button title="Log In" onPress={handleLogInPress} color="#416788" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingAnimation: {
    width: Platform.OS === "web" ? 200 : 150, 
    height: Platform.OS === "web" ? 200 : 150, 
    marginBottom: 20, 
  },
  headerText: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#231123",
    textAlign: "center",
  },
  subText: {
    fontSize: 16,
    color: "#372554",
    marginBottom: 30,
    textAlign: "center",
  },
  buttonContainer: {
    width: "80%", 
    alignItems: "center", 
  },
  button: {
    marginVertical: 10,
    width: "100%", 
  },
});
