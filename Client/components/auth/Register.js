import React, { Component } from "react";
import {
  TextInput,
  View,
  StyleSheet,
  ScrollView,
  Button,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";
import AuthObserver from "../../utils/AuthObserver";

export class Register extends Component {
  state = {
    email: "",
    password: "",
    RePassword: "",
    name: "",
    bio: "",
  };

  onSignUp = async () => {
    const { email, password, RePassword, name, bio } = this.state;

    if (!email.includes("@")) {
      return Toast.show({ type: "error", text1: "Invalid Email" });
    }
    if (password.length < 6) {
      return Toast.show({ type: "error", text1: "Weak Password", text2: "Must be at least 6 characters." });
    }
    if (password !== RePassword) {
      return Toast.show({ type: "error", text1: "Password Mismatch" });
    }

    try {
      await AuthObserver.register({ email, password, name, bio });
      Toast.show({ type: "success", text1: "User registered successfully!" });
    } catch (error) {
      console.log(error)
    }
  };

  render() {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
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
            secureTextEntry
            onChangeText={(password) => this.setState({ password })}
          />
          <TextInput
            placeholder="Repeat Password"
            style={styles.input}
            secureTextEntry
            onChangeText={(RePassword) => this.setState({ RePassword })}
          />
          <View style={styles.buttonContainer}>
            <Button onPress={this.onSignUp} title="Sign Up" color="#416788" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
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
    width: "100%",
  },
});

export default Register;
