import React, { Component } from "react";
import {
  Button,
  TextInput,
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";
import AuthObserver from "../../utils/AuthObserver";

export class Login extends Component {
  state = { email: "", password: "" };

  onSignIn = () => {
    const { email, password } = this.state;

    AuthObserver.login(email, password)
      .then(() => {
        Toast.show({ type: "success", text1: "Signed in successfully!" });
      })
      .catch((error) => {
        Toast.show({ type: "error", text1: "Login Error", text2: error.message });
      });
  };

  onForgotPassword = () => {
  const { email } = this.state;

  if (!email) {
    Toast.show({
      type: "error",
      text1: "Please enter your email to reset password.",
    });
    return;
  }

  AuthObserver.sendPasswordReset(email)
    .then(() => {
      Toast.show({
        type: "success",
        text1: "Reset email sent!",
        text2: "Check your inbox to reset your password.",
      });
    })
    .catch((error) => {
      Toast.show({
        type: "error",
        text1: "Reset Failed",
        text2: error.message,
      });
    });
};


  render() {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <TextInput
            placeholder="Email"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(email) => this.setState({ email })}
          />
          <TextInput
            placeholder="Password"
            style={styles.input}
            secureTextEntry
            onChangeText={(password) => this.setState({ password })}
          />
          <View style={styles.buttonContainer}>
            <Button onPress={this.onSignIn} title="Sign In" color="#416788" />
          </View>
          <View style={styles.forgotContainer}>
          <Button
            onPress={this.onForgotPassword}
            title="Forgot Password?"
            color="#6c757d"
          />
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
  forgotContainer: {
  marginTop: 10,
  width: "100%",
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

export default Login;
