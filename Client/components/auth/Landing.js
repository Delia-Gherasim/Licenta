import React from "react";
import { View, Button, StyleSheet } from "react-native";

export default function Landing({ navigation }) {
  console.log("Landing Component Rendered");
  console.log("Landing component props: ", { navigation });

  const handleRegisterPress = () => {
    console.log("Register button pressed");
    navigation.navigate("Register");
  };

  const handleLogInPress = () => {
    console.log("Log In button pressed");
    navigation.navigate("Log In");
  };

  return (
    <View style={styles.container}>
      <Button title="Register" onPress={handleRegisterPress} />
      <Button title="Log In" onPress={handleLogInPress} />
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
});
