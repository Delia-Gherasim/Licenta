import React, { Component } from "react";
import {
  Alert,
  Button,
  TextInput,
  View,
  StyleSheet,
  ScrollView,
} from "react-native";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";

export class Register extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      RePassword: "",
      name: "",
      bio: "",
    };
    this.onSignUp = this.onSignUp.bind(this);
  }

  async onSignUp() {
    const { email, password, RePassword, name, bio } = this.state;
    const auth = getAuth();
    const db = getFirestore();

    if (password !== RePassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        bio,
        postRating: 0,
        commentsRating: 0,
        followers: [],
        following: [],
      });

      Alert.alert("Success", "User registered successfully!");
      // Optionally navigate to login or home screen here
    } catch (error) {
      console.error("Error signing up:", error);
      Alert.alert("Sign Up Error", error.message);
    }
  }

  render() {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <TextInput
          placeholder="Name"
          style={styles.input}
          onChangeText={(name) => this.setState({ name })}
        />
        <TextInput
          placeholder="Email"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(email) => this.setState({ email })}
        />
        <TextInput
          placeholder="Bio"
          style={styles.input}
          onChangeText={(bio) => this.setState({ bio })}
        />
        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry={true}
          onChangeText={(password) => this.setState({ password })}
        />
        <TextInput
          placeholder="Repeat Password"
          style={styles.input}
          secureTextEntry={true}
          onChangeText={(RePassword) => this.setState({ RePassword })}
        />
        <View style={styles.buttonContainer}>
          <Button onPress={this.onSignUp} title="Sign Up" color="#6200ea" />
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  buttonContainer: {
    marginTop: 10,
  },
});

export default Register;
