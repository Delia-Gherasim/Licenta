import React from "react";
import { View, Button, StyleSheet } from "react-native";

export default function Landing({ navigation }) {
  const handleRegisterPress = () => {
    navigation.navigate("Register");
  };

  const handleLogInPress = () => {
    navigation.navigate("Login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.button}>
        <Button
          title="Register"
          onPress={handleRegisterPress}
          color="#6200ea"
        />
      </View>
      <View style={styles.button}>
        <Button title="Log In" onPress={handleLogInPress} color="#6200ea" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  button: {
    marginVertical: 10,
    width: "80%",
  },
});
