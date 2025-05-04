import React, { Component } from "react";
import {
  Alert,
  Button,
  TextInput,
  View,
  StyleSheet,
  ScrollView,
} from "react-native";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import AuthObserver from "../../utils/AuthObserver";

export class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
    };
    this.onSignIn = this.onSignIn.bind(this);
  }

  onSignIn() {
    const { email, password } = this.state;
    const auth = getAuth();

    AuthObserver.login(email, password)
    .then((userCredential) => {
      Alert.alert("Success", "Signed in successfully!");
    })
    .catch((error) => {
      Alert.alert("Login Error", error.message);
    });
  }

  render() {
    return (
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
          secureTextEntry={true}
          onChangeText={(password) => this.setState({ password })}
        />
        <View style={styles.buttonContainer}>
          <Button onPress={this.onSignIn} title="Sign In" color="#6200ea" />
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

export default Login;
